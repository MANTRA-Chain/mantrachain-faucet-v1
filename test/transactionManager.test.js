import { expect } from 'chai';
import { TransactionManager } from '../src/transactionManager.js';
import sinon from 'sinon';

describe('TransactionManager', () => {
  let tm;
  let config;
  let logger;

  beforeEach(() => {
    config = {
      blockchains: [{
        name: 'mantra-hongbai-1',
        sender: { mnemonic: 'test mnemonic', option: {} },
        endpoint: { rpc_endpoint: 'http://localhost:26657' },
        tx: { amount: [{ amount: '1000', denom: 'uhong' }], fee: {} }
      }],
      pow: { difficulty: 2 }
    };
    logger = {
      info: sinon.spy(),
      error: sinon.spy()
    };
    tm = new TransactionManager(config, logger);
  });


it('should enqueue and process a transaction', async () => {
    const recipient = 'mantra18lktz5f5takc3g6pxk7exkrveyh7qttgte9jny';
    const chain = 'mantra-hongbai-1';
    sinon.stub(tm, 'sendTx').resolves('Transaction successful');

    await tm.enqueueSend(recipient, chain);
    expect(tm.transactionQueue.length).to.equal(0); // Ensure the queue is empty after processing
    expect(tm.sendTx.calledOnce).to.be.true;
    expect(tm.sendTx.calledWith(recipient, chain)).to.be.true;
    expect(logger.info.calledWith(sinon.match.string)).to.be.true; // Check if logger.info was called
  });

  it('should handle transaction failures gracefully', async () => {
    const recipient = 'mantra18lktz5f5takc3g6pxk7exkrveyh7qttgte9jny';
    const chain = 'mantra-hongbai-1';
    sinon.stub(tm, 'sendTx').rejects(new Error('Transaction failed'));

    try {
      await tm.enqueueSend(recipient, chain);
    } catch (e) {
      expect(e.message).to.equal('Transaction failed');
    }

    expect(tm.transactionQueue.length).to.equal(0); // Ensure the queue is cleared after failure
    expect(tm.sendTx.calledOnce).to.be.true;
    expect(logger.error.calledOnce).to.be.true; // Check if logger.error was called
  });

  afterEach(() => {
    sinon.restore();
  });
});

