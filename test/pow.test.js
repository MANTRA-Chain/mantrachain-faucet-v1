import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import crypto from 'crypto';
import { enablePOW, verifyPOW } from '../src/proof-of-work/pow.js'; // Adjust the import path as necessary


describe('Proof of Work (PoW) Middleware', () => {
    let app, config, checker, transactionManager, logger, response, request;
  
    beforeEach(() => {
      app = express();
      app.get = sinon.spy();
      app.post = sinon.spy();
      
      config = { pow: { enabled: true, difficulty: 5 } };
      checker = {
        update: sinon.stub().resolves(),
        checkPOW: sinon.stub().resolves(Date.now() + 10000),
        remove: sinon.spy()
      };
      transactionManager = {};
      logger = { info: sinon.spy(), error: sinon.spy() };
  
      response = {
        sendFile: sinon.spy(),
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      request = {};
    });
  
    describe('enablePOW', () => {
      it('should setup pow routes correctly', () => {
        enablePOW(app, config, checker, transactionManager, logger);
        
        expect(app.get.calledWith('/powWorker.js')).to.be.true;
        expect(app.get.calledWith('/pow-challenge')).to.be.true;
      });
    });
  
//TODO: Write tests for actual POW solving not using mocks.

    describe('verifyPOW', () => {
      it('should return true when the hash starts with the required number of zeros and is within time limit', async () => {
        const nonce = 'testnonce';
        const timestamp = Date.now() - 500; // 500 ms ago
        const solution = 'solution';
  
        sinon.stub(crypto, 'createHash').returns({
          update: sinon.stub().returnsThis(),
          digest: sinon.stub().returns('000001abcdef') // Mocked hash output
        });
        enablePOW(app, config, checker, transactionManager, logger);
        const isValid = await verifyPOW(nonce, timestamp, solution);
  
        expect(isValid).to.be.true;
        
        expect(checker.remove.calledOnce).to.be.true;
        expect(crypto.createHash.calledWith('sha256')).to.be.true;
      });
  
      it('should return false if the hash does not start with the required number of zeros', async () => {
        const nonce = 'testnonce';
        const timestamp = Date.now() - 50000; // 500 ms ago
        const solution = 'solution';
        config.pow.difficulty = 2; // Simplify the difficulty for testing
        enablePOW(app, config, checker, transactionManager, logger);
        sinon.stub(crypto, 'randomBytes').returns(Buffer.from(nonce, 'utf-8'));
        sinon.stub(crypto, 'createHash').returns({
          update: sinon.stub().returnsThis(),
          digest: sinon.stub().returns('100001abcdef') // Mocked hash output
        });
  
        const isValid = await verifyPOW(nonce, timestamp, solution);
  
        expect(isValid).to.be.false;
        expect(checker.remove.calledOnce).to.be.true;
      });
    });
  
    afterEach(() => {
      sinon.restore();
    });
  });