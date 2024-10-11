import { Wallet } from '@ethersproject/wallet'
import { ethers } from 'ethers';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";

import { pathToString } from '@cosmjs/crypto';
import verifyRecaptcha from '../recaptcha/recaptcha.js';
import { verifyPOW } from '../proof-of-work/pow.js';

export function enableBalanceApi(app, config, checker, transactionManager, logger) {
    app.get('/balance/:chain', async (req, res) => {
        const { chain } = req.params

        let balance = {}

        try {
            const chainConf = config.blockchains.find(x => x.name === chain)
            if (chainConf) {
                if (chainConf.type === 'Ethermint') {
                    const ethProvider = new ethers.providers.JsonRpcProvider(chainConf.endpoint.evm_endpoint);
                    const wallet = Wallet.fromMnemonic(chainConf.sender.mnemonic).connect(ethProvider);
                    await wallet.getBalance().then(ethBlance => {
                        balance = {
                            denom: chainConf.tx.amount.denom,
                            amount: ethBlance.toString()
                        }
                    }).catch(e => logger.error(e))
                } else {
                    const rpcEndpoint = chainConf.endpoint.rpc_endpoint;
                    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(chainConf.sender.mnemonic, chainConf.sender.option);
                    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
                    const [firstAccount] = await wallet.getAccounts();
                    await client.getBalance(firstAccount.address, chainConf.tx.amount.denom).then(x => {
                        return balance = x
                    }).catch(e => logger.error(e));
                }
            }
        } catch (err) {
            logger.info(err)
        }
        res.send(balance);
    })
}

//TODO: refactor the POW and Recapture as middleware

export function enableWeb2Send(app, config, checker, transactionManager, logger) {


    app.post('/send/:chain/:address', async (req, res) => {
        const { chain, address } = req.params;
        const ip = req.headers['x-real-ip'] || req.headers['X-Real-IP'] || req.headers['X-Forwarded-For'] || req.ip
        logger.info(`Request for ${chain} tokens to ${address} from IP ${ip}`);

        if (config.captcha && config.captcha.enabled) {

            let isCaptchaValid = false;

            try {
                const recaptchaResponse = req.body?.recaptchaResponse;
                isCaptchaValid = await verifyRecaptcha(recaptchaResponse, config.captcha.siteSecret, logger);
            }
            catch (error) {
                logger.error(`Recapture was not valid for request from ${address} from IP ${ip}`, error);
            }

            if (!isCaptchaValid) {
                res.status(400).send({ result: "CAPTCHA verification failed" })
                return;
            }
        }

        if (config.pow && config.pow.enabled) {
            const nonce = req.body?.nonce;
            const solution = req.body?.solution;
            const timestamp = req.body?.timestamp;

            const verified = await verifyPOW(nonce, timestamp, solution);
            if (!verified) {

                res.status(404).send({ result: "POW Challenge was not solved or incorrect." });
                return;
            }
        }

        if (chain || address) {
            try {
                const chainConf = config.blockchains.find(x => x.name === chain)
                if (chainConf && (address.startsWith(chainConf.sender.option.prefix) || address.startsWith('0x'))) {
                    if (await checker.checkAddress(address, chain) && await checker.checkIp(`${chain}${ip}`, chain)) {

                        transactionManager.enqueueSend(address, chain)
                            .then(result => {

                                // Upsert entries for abuse check only if the send is successful.
                                if (result && result.code == 0) {
                                    checker.update(`${chain}${ip}`) // get ::1 on localhost
                                    checker.update(address)
                                }
                                res.send({ result });
                            })
                            .catch(err => {
                                console.error("Failed to send transaction: ", err);
                                res.status(500).send({ result: `Error sending transaction: ${err.message}` });
                            });
                    } else {
                        res.status(429).send({ result: "You requested too often" })
                    }
                } else {
                    logger.error($`Bad request for chain ${chain} or address ${address}`);
                    res.status(400).send({ result: `Address [${address}] is not supported.` })
                }
            } catch (err) {
                logger.error(err);
                res.status(500).send({ result: 'Failed, Please contact to admin.' })
            }

        } else {
            // send result
            res.status(400).send({ result: 'address is required' });
        }
    })
}

export function enableWeb2ConfigApi(app, config, checker, transactionManager, logger) {
    app.get('/config.json', async (req, res) => {
        const sample = {}
        for (let i = 0; i < config.blockchains.length; i++) {
            const chainConf = config.blockchains[i]
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(chainConf.sender.mnemonic, chainConf.sender.option);
            const [firstAccount] = await wallet.getAccounts();
            sample[chainConf.name] = firstAccount.address
            if (chainConf.type === 'Ethermint') {
                const wallet = await fromMnemonicEthermint(chainConf.sender.mnemonic, chainConf.sender.option);
                sample[chainConf.name] = wallet.address;
            }

            const wallet2 = Wallet.fromMnemonic(chainConf.sender.mnemonic, pathToString(chainConf.sender.option.hdPaths[0]));
            logger.info('address:', sample[chainConf.name], wallet2.address);
        }

        const project = config.project
        project.sample = sample
        project.blockchains = config.blockchains.map(x => x.name)
        project.web2enabled = config.web2 && config.web2.enabled
        project.discordInvite = config.discord && config.discord.enabled ? config.discord.discordInvite : ''
        project.difficulty = config.pow && config.pow.enabled ? config.pow.difficulty : 0;
        project.explorer = config.discord.explorer;
        if (config.captcha && config.captcha.enabled)
            project.siteKey = config.captcha.siteKey;

        res.send(project);
    })
}

export function enableWeb2HealthApi(app, config, checker, transactionManager, logger) {
    app.get('/healthz', async (req, res) => {
        // Perform necessary health checks
        let clients = await transactionManager.checkAndReconnectClients(true);
        let message = 'OK';

        for (let i = 0; i < clients.length; i++) {
            if (!clients[i].latestBlock || clients[i].latestBlock <= 0) {
                message = 'DEGRADED';
            }
        }

        const healthcheck = {
            uptime: process.uptime(),
            message,
            blockchains: clients,
            timestamp: Date.now()
        };

        logger.info("[HEALTH CHECK]", healthcheck);

        try {
            // Optionally include further checks and throw errors if any checks fail
            res.send(healthcheck);
        } catch (e) {
            healthcheck.message = 'ERROR';
            res.status(503).send(healthcheck);
        }
    })
}