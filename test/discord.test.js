import { use, expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import express from 'express';
import { enableDiscord, handleInteraction } from '../src/discord/bot.js';
import { InteractionResponseType, InteractionType, verifyKeyMiddleware } from 'discord-interactions';
import fetch from 'node-fetch';
import * as utils from '../src/discord/utils.js';

let chai = use(chaiHttp);

describe('Discord Integration', () => {
  let app, req, res;
  let config, checker, transactionManager, logger;

  beforeEach(() => {
    app = express();
    app.use(express.json()); // Ensure the express app can parse JSON requests

    req = {
      body: {}
    };
    res = {
      send: sinon.spy(),
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Create fake configurations and other dependencies
    config = { discord: { publicKey: 'some-key' }, blockchains: [{ name: "testchain" }] };
    checker = {
      checkAddress: sinon.stub(),
      update: sinon.stub()
    };

    transactionManager = {
      enqueueSend: sinon.stub().resolves("Transaction successful")
    };
    logger = { info: sinon.stub(), error: sinon.stub() };

    // Stub the verifyKeyMiddleware to just call the next function
    // verifyKeyStub = sinon.stub().callsFake((req, res, next) => next());
    //sinon.stub(verifyKeyMiddleware, 'verifyKeyMiddleware').returns(verifyKeyStub);

    // Initialize the Discord functionality
    enableDiscord(app, config, checker, transactionManager, logger);
  });

  it('should respond with pong on PING', async () => {
    req.body = {
      type: InteractionType.PING,
      data: {}
    };

    await handleInteraction(req, res);
    expect(res.send.calledWith({ type: InteractionResponseType.PONG })).to.be.true;
  });

  it('should send a modal response on "request" application command', async () => {
    req.body = {
      type: InteractionType.APPLICATION_COMMAND,
      data: { name: 'request' }
    };

    await handleInteraction(req, res);
    expect(res.send.calledWith(sinon.match({
      type: InteractionResponseType.MODAL,
      data: {
        custom_id: 'requestModal',
        title: 'Request Tokens'
      }
    }))).to.be.true;
  });

  it('should return an error message for invalid commands', async () => {
    req.body = {
      type: InteractionType.APPLICATION_COMMAND,
      data: { name: 'unknown_command' }
    };

    await handleInteraction(req, res);
    expect(res.send.calledWith(sinon.match({
      data: { content: 'Invalid command. Sending Help.' }
    }))).to.be.true;
  });

  it('should handle modal submission correctly', async () => {
    req.body = {
      type: InteractionType.MODAL_SUBMIT,
      data: {
        custom_id: 'requestModal',
        components: [{
          components: [{ value: 'walletAddressValue' }]
        }]
      },
      member: { user: { id: 'userId', username: 'username' } },
      channel_id: 'channelId'
    };

    checker.checkAddress.withArgs(sinon.match.any, "testchain").resolves(true);

    await handleInteraction(req, res);
    // Add assertions for the expected response after processing the wallet request
    expect(res.send.calledOnce).to.be.true;

    expect(transactionManager.enqueueSend.called).to.be.true;
  });

  it('should allow token request if checker approves the address', async () => {
    // Setup checker to return true for address checks
    checker.checkAddress.withArgs(sinon.match.any, "testchain").resolves(true);

    // Mock the request as it would be received from Discord
    req = {
      body: {
        type: InteractionType.MODAL_SUBMIT, // Assuming type 2 is for MODAL_SUBMIT or similar
        data: { name: 'request', components: [{ components: [{ value: 'wallet123' }] }] },
        member: { user: { id: 'user123', username: 'testuser' } },
        channel_id: 'channel123'
      }
    };

    // Simulate the handling of the interaction
    await handleInteraction(req, res);

    // Assertions to verify behavior
    expect(checker.checkAddress.calledTwice).to.be.true;
    expect(transactionManager.enqueueSend.calledOnce).to.be.true;
    expect(res.send.calledOnce).to.be.true;
    expect(res.send.firstCall.args[0]).to.include({ type: 4 }); // Check for the specific response type
  });

  afterEach(() => {
    sinon.restore(); // Restore original functions
  });

});
