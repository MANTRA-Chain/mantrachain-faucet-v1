
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
  verifyKeyMiddleware
} from 'discord-interactions';
import { REJECT_EMOJI, DiscordRequest } from './utils.js';
import { validateMantraAccount, checkAllowedGuilds } from './validation.js';


const REQUEST_RESPONSE_MESSAGE = {
  type: InteractionResponseType.MODAL,
  data: {
    custom_id: 'requestModal',
    title: 'Request Tokens',
    components: [{
      type: 1,
      components: [{
        type: 4,
        custom_id: 'walletAddress',
        style: 1,
        label: 'Enter your wallet address',
        required: true,
        "min_length": 40,
        "max_length": 50,
        placeholder: 'mantra1f088a52skn4t7lk8uhpq3nurtv6d7xjmuza0l0'
      }]
    }]
  }
};


export async function handleInteraction(req, res) {
  const message = req.body;

  if (!message.type || !message.data) {
    return res.status(400).send({ result: "invalid request" });
  }

  switch (message.type) {
    case InteractionType.PING:
      return res.send({ type: InteractionResponseType.PONG });
    case InteractionType.APPLICATION_COMMAND:
      return handleCommand(message, res);
    case InteractionType.MODAL_SUBMIT:
      return handleModalSubmit(message, res);
    default:
      return res.status(400).send();
  }
}

function handleCommand(message, res) {
  const name = message.data.name || "help";
  if (name === 'request') {
    return res.send(REQUEST_RESPONSE_MESSAGE);
  } else {
    return sendErrorResponse(res, 'Invalid command. Sending Help.');
  }
}

async function handleModalSubmit(message, res) {
  // Extract wallet address
  const walletAddress = message.data?.components?.[0]?.components?.[0]?.value;
  if (!walletAddress) {
    logger.warn("Malformed Modal Submit - Missing wallet address in modal submit", message);
    return res.send(createEphemeralResponse(`Wallet address is missing. Please provide a valid wallet address.`));
  }


  if (!message.member || !message.member.user || !message.member.user.id || !message.member.user.username) {
    logger.warn("Malformed Modal Submit - Missing member or user", message);
    return res.send(createEphemeralResponse(`We couldn't process your request because it was not formed correctly. If this persists, contact admin.`))
  }

  const userId = message.member.user.id;
  const username = message.member.user.username;
  const chain = config.blockchains[0].name; // see Important note above.
  const result = await processWalletRequest(walletAddress, userId, username, message.channel_id, chain);
  return res.send(result);
}

async function processWalletRequest(walletAddress, userId, username, channelId, chain) {
  try {
    const messageEndpoint = `channels/${channelId}/messages`

    logger.info(`Discord Token Request from ${username} (${userId}) for wallet ${walletAddress}`);

    if (await checker.checkAddress(walletAddress, chain) && await checker.checkAddress(userId, chain)) {

      transactionManager.enqueueSend(walletAddress, chain)
        .then(async (result) => {
          if (result.code == 0) {
            checker.update(userId);
            checker.update(walletAddress);
            await DiscordRequest(config, messageEndpoint, { method: 'POST', body: { content: createSuccessMessage(userId, walletAddress) } }, logger);
          }
          else {
            await DiscordRequest(config, messageEndpoint, { method: 'POST', body: { content: createErrorMessage(userId, result.message) } }, logger);
          }
        })
        .catch(async (err) => {
          logger.error("Failed to send transaction: ", err);
          await DiscordRequest(config, messageEndpoint, { method: 'POST', body: { content: createErrorMessage(userId) } }, logger);
        });
    } else {
      return createEphemeralResponse(`You have requested too often. Please try again later.`);
    }

    return createEphemeralResponse(`Request received for wallet: ${walletAddress}. Your tokens will be sent shortly.`);

  } catch (error) {
    logger.error('Transaction error', error);
    DiscordRequest({ content: createErrorMessage(userId) }, channelId, {}, logger);
    return createEphemeralResponse(`Error processing your request. Please try again.`);
  }
}

function createSuccessMessage(userId, walletAddress) {
  return `Hey <@${userId}> 👋, we've sent you some tokens! [Check them here](${config.discord.explorer}/accounts/${walletAddress})`;
}

function createErrorMessage(userId, errorMessage) {
  if (!errorMessage)
    errorMessage = "Sorry something went wrong sending your tokens. You can try again at anytime.";

  return `Hey <@${userId}> 👋, Failure: ${errorMessage}`;
}

function createEphemeralResponse(message) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: message, flags: InteractionResponseFlags.EPHEMERAL }
  };
}

function sendErrorResponse(res, message) {
  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: message }
  });
}

let config, checker, transactionManager, logger;

export function enableDiscord(app, config_, checker_, transactionManager_, logger_) {
  /* IMPORTANT NOTE
   * Due to time constraints this function only supports sending tokens to a the first
   * registered blockchain in the array. We may update this in the future.
   */

  config = config_;
  checker = checker_;
  transactionManager = transactionManager_;
  logger = logger_;

  app.post(
    '/interactions',
    verifyKeyMiddleware(config.discord.publicKey),
    checkAllowedGuilds(config.discord.allowed_guilds),
    validateMantraAccount,
    async (req, res) => {
      handleInteraction(req, res);
    })
}

