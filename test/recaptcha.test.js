import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import verifyRecaptcha from '../src/recaptcha/recaptcha.js'; // Adjust the import path as necessary

describe('verifyRecaptcha', () => {
  let axiosPostStub;
  let logger;

  beforeEach(() => {
    // Setup a stub for axios.post to control its behavior in tests
    axiosPostStub = sinon.stub(axios, 'post');
    // Setup a fake logger to monitor its usage
    logger = {
      error: sinon.spy()
    };
  });

  afterEach(() => {
    // Restore the original function after each test
    sinon.restore();
  });

  it('should return true when recaptcha verification is successful', async () => {
    // Setup axios to return a successful response
    axiosPostStub.resolves({ data: { success: true } });
    
    const result = await verifyRecaptcha('dummy_response', 'secret_key', logger);
    
    expect(result).to.be.true;
    expect(axiosPostStub.calledOnce).to.be.true;
  });

  it('should log an error and return false when recaptcha verification fails', async () => {
    // Setup axios to return a failure response
    axiosPostStub.resolves({ data: { success: false, 'error-codes': ['invalid-input-response'] } });
    
    const result = await verifyRecaptcha('dummy_response', 'secret_key', logger);
    
    expect(result).to.be.false;
    expect(logger.error.calledOnce).to.be.true;
    expect(logger.error.firstCall.args[0]).to.equal('Recaptcha check returned false');
    expect(logger.error.firstCall.args[1]).to.include('invalid-input-response');
  });

  it('should log an error and return false when an exception occurs', async () => {
    // Setup axios to throw an exception
    axiosPostStub.rejects(new Error('network error'));
    
    const result = await verifyRecaptcha('dummy_response', 'secret_key', logger);
    
    expect(result).to.be.false;
    expect(logger.error.calledOnce).to.be.true;
    expect(logger.error.firstCall.args[0]).to.equal('Error verifying CAPTCHA');
    expect(logger.error.firstCall.args[1]).to.be.an('error').that.includes({ message: 'network error' });
  });
});
