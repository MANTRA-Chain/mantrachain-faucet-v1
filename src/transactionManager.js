
import { Wallet } from '@ethersproject/wallet'
import { bech32 } from 'bech32';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";


// const transactionQueue = [];
// let isProcessing = false;
// let config = {};
// let logger = {};

export class TransactionManager {

  constructor(config_, logger_) {
    this.config = config_;
    this.logger = logger_;
    this.transactionQueue = [];
    this.isProcessing = false;
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

  async sendCosmosTx(recipient, chain) {
    // const mnemonic = "surround miss nominee dream gap cross assault thank captain prosper drop duty group candy wealth weather scale put";
    const chainConf = this.config.blockchains.find(x => x.name === chain)
    if (chainConf) {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(chainConf.sender.mnemonic, chainConf.sender.option);
      const [firstAccount] = await wallet.getAccounts();

      const rpcEndpoint = chainConf.endpoint.rpc_endpoint;
      const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
      client.getBalance

      // const recipient = "cosmos1xv9tklw7d82sezh9haa573wufgy59vmwe6xxe5";
      const amount = chainConf.tx.amount;
      const fee = chainConf.tx.fee;

      return client.sendTokens(firstAccount.address, recipient, [amount], fee);
    }
    throw new Error(`Blockchain Config [${chain}] not found`)
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
    return this.sendCosmosTx(recipient, chain)
  }

}

