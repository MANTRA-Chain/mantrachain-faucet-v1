
import { Wallet } from '@ethersproject/wallet'
import { bech32 } from 'bech32';
import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet, coins } from '@cosmjs/proto-signing';
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';

export class TransactionManager {

  constructor(config_, logger_) {
    this.config = config_;
    this.logger = logger_;
    this.transactionQueue = [];
    this.isProcessing = false;
    this._accounts = new Map();
    this._clients = new Map();
    this._wallets = new Map();
  }

  enqueueSend(recipient, chain) {
    return this.enqueueTransaction(() => this.sendTx(recipient, chain));
  }


  /* -----------------------------------------------------------------
                    FIFO Processing of Send Requests 
     -----------------------------------------------------------------*/
  async processQueue() {
    if (this.isProcessing || this.transactionQueue.length === 0) {
      return;
    }
    this.logger.info(`Processing. Current Queue Length: ${this.transactionQueue.length}`);

    this.isProcessing = true;
    const { transactionFunc, resolve, reject } = this.transactionQueue.shift();

    try {
      const result = await transactionFunc();
      this.logger.info(`Completed. Current Queue Length: ${this.transactionQueue.length}`);
      resolve(result);
    } catch (error) {
      this.logger.error("Error processing request", error);
      reject(error);
    } finally {
      this.isProcessing = false;
      // Recursively process the next item in the queue
      this.processQueue();
    }
  }


  enqueueTransaction(transactionFunc) {
    this.logger.info(`Enqueue send, Current Queue Length: ${this.transactionQueue.length}`);
    return new Promise((resolve, reject) => {
      this.transactionQueue.push({ transactionFunc, resolve, reject });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }


  async getConnectedClient(chainConf) {
    if (!this._clients.get(chainConf.name)) {
      const faucet = await this.getCosmosFaucetWalletAndAccount(chainConf);
      const rpcEndpoint = chainConf.endpoint.rpc_endpoint;
      const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, faucet.wallet);

      const accountData = await this.getCosmosAccountData(client, faucet.firstAccount.address);


      this._clients.set(chainConf.name, client);
    }
    return this._clients.get(chainConf.name);
  }

  async getCosmosAccountData(client, address) {
    let acc = this._accounts.get(address);
    if (!acc) {
      try {
        const account = await client.getAccount(address);
        if (!account) {
          throw new Error("Account not found");
        }
        acc = {
          accountNumber: account.accountNumber,
          sequence: account.sequence
        };
        this._accounts.set(address, acc);
      } catch (error) {
        this.logger.error("Failed to retrieve account data:", error);
        throw error;
      }
    }
    return acc;
  }

  async getCosmosFaucetWalletAndAccount(chainConf) {
    if (!this._wallets.get(chainConf.name)) {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(chainConf.sender.mnemonic, chainConf.sender.option);
      const [firstAccount] = await wallet.getAccounts();

      this._wallets.set(chainConf.name, { wallet, firstAccount });
    }

    return this._wallets.get(chainConf.name);
  }

  incrementNonce(address) {
    const account = this._accounts.get(address);
    account.sequence = account.sequence + 1;
    this._accounts.set(address, account); //do i need to set this again?
    return account;
  }

  getCosmosFee(chainConf) {
    return chainConf.tx.fee;
    return {
      amount: coins(chainConf.tx.fee.amount[0].amount, chainConf.tx.fee.amount.denom),
      gasLimit: chainConf.tx.fee.gas
    };
  }

  getCosmosSendMessage(chainConf, account, recipient) {
    return {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: account.address,
        toAddress: recipient,
        amount: coins(chainConf.tx.amount.amount, chainConf.tx.amount.denom)
      }
    };
  }

  async sendRawCosmosTx(recipient, chain) {
    let result;
    const chainConf = this.config.blockchains.find(x => x.name === chain)
    if (chainConf) {
      const client = await this.getConnectedClient(chainConf);
      const { wallet, firstAccount } = await this.getCosmosFaucetWalletAndAccount(chainConf);

      //const {accountNumber, sequence} =
      const account = await this.getCosmosAccountData(client, firstAccount.address);


      const fee = this.getCosmosFee(chainConf);

      const msgSend = this.getCosmosSendMessage(chainConf, firstAccount, recipient);

      const txBody = TxBody.fromPartial({
        messages: [client.registry.encode(msgSend)],
      });

      const memo = "Coin from Faucet";
      const signerData = { accountNumber: account.accountNumber, sequence: account.sequence, chainId: chain };
      const txRaw = await client.sign(firstAccount.address, [msgSend], fee, memo, signerData, undefined);
      const txBytes = TxRaw.encode(txRaw).finish();
      this.incrementNonce(firstAccount.address);
      return client.broadcastTxSync(txBytes);
    }
    return result;

  }

  async sendCosmosTx(recipient, chain) {

    const chainConf = this.config.blockchains.find(x => x.name === chain)
    if (chainConf) {
      const client = await this.getConnectedClient(chainConf);
      const faucet = await this.getCosmosFaucetWalletAndAccount(chainConf);

      const amount = chainConf.tx.amount;
      const fee = chainConf.tx.fee;

      return client.sendTokens(faucet.firstAccount.address, recipient, [amount], fee);
    }
  }

  async sendEvmosTx(recipient, chain) {

    try {
      const chainConf = this.config.blockchains.find(x => x.name === chain)
      // const ethProvider = new ethers.providers.JsonRpcProvider(chainConf.endpoint.evm_endpoint);

      const wallet = Wallet.fromMnemonic(chainConf.sender.mnemonic); // .connect(ethProvider);

      let evmAddress = recipient;
      if (recipient && !recipient.startsWith('0x')) {
        let decode = bech32.decode(recipient);
        let array = bech32.fromWords(decode.words);
        evmAddress = "0x" + this.toHexString(array);
      }

      let result = await wallet.sendTransaction(
        {
          from: wallet.address,
          to: evmAddress,
          value: chainConf.tx.amount.amount
        }
      );

      let repTx = {
        "code": 0,
        "nonce": result["nonce"],
        "value": result["value"].toString(),
        "hash": result["hash"]
      };

      logger.info("xxl result : ", repTx);
      return repTx;
    } catch (e) {
      logger.error("xxl e ", e);
      return e;
    }

  }

  toHexString(bytes) {
    return bytes.reduce(
      (str, byte) => str + byte.toString(16).padStart(2, '0'),
      '');
  }

  async sendTx(recipient, chain) {
    const chainConf = this.config.blockchains.find(x => x.name === chain)
    if (chainConf.type === 'Ethermint') {
      return this.sendEvmosTx(recipient, chain)
    }
    return this.sendRawCosmosTx(recipient, chain)
  }

}

