import 'dotenv/config';
import fetch from 'node-fetch';
import { verifyKey } from 'discord-interactions';

export const APPROVE_EMOJI = "✅";
export const REJECT_EMOJI = "🚫";

export function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    const signature = req.get('X-Signature-Ed25519');
    const timestamp = req.get('X-Signature-Timestamp');

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);

    console.log("REQUEST IS VALID: " + isValidRequest);

    if (!isValidRequest) {
      res.status(401).send('Bad request signature');
      throw new Error('Bad request signature');
    }
  };
}

export async function DiscordRequest(config, endpoint, options, logger, attempt = 1) {
  const MAX_ATTEMPTS = 5;
  const MIN_DELAY = (1.25 * 1000) + (Math.floor(Math.random() * 15) + 1) * 1000;

  if (attempt >= MAX_ATTEMPTS) {
    logger.alert('Discord send reached maximum attempts reached trying to send Discord request. Bailing out.')
    return;
    //throw new Error('Maximum attempts reached trying to send Discord request. Bailing out.');
  }

  try {

    const response = await DiscordRequestInternal(config, endpoint, options);

    if (!response.ok) {
      let responseData;

      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { error: 'Failed to parse response as JSON' };
      }

      logger.error(`Discord request failed with status ${response.status}`, responseData);

      // Retryable status codes
      const retryableStatusCodes = [429, 500, 502, 503, 504];

      if (retryableStatusCodes.includes(response.status)) {
        let delay = MIN_DELAY;
        if (response.status === 429 && responseData.retry_after) {
          delay = Math.max(MIN_DELAY, responseData.retry_after * 1000);
        }

        logger.warn(`Retryable error encountered. Retrying attempt ${attempt + 1} after ${delay}ms.`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return DiscordRequest(config, endpoint, options, logger, attempt + 1);
      }

      throw new Error(`Request failed with status ${response.status}`);
    }
    else if (attempt > 1) {
      logger.info("Discord retry was successful.");
    }

    return response;

  } catch (error) {
    logger.error(`Request encountered an error: ${error.message}`, { error });

    logger.warn(`Network error encountered. Retrying attempt ${attempt + 1} after ${MIN_DELAY}ms.`);
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY));
    return DiscordRequest(config, endpoint, options, logger, attempt + 1);

  }
}



async function DiscordRequestInternal(config, endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use node-fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${config.discord.discordToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/MANTRA-Finance/cosmos-sdk-faucet, 1.0.0)',
    },
    ...options
  });
  // return original response
  return res;
}

export async function InstallGlobalCommands(config, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${config.discord.appId}/commands`;

  try {
    console.log(`Registering ${commands.length} commands on ${endpoint}`);
    const res = await DiscordRequest(config, endpoint, { method: 'PUT', body: commands });
    console.log("Register completed with Status Code " + res.status)
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭', '😄', '😌', '🤓', '😎', '😤', '🤖', '😶‍🌫️', '🌏', '📸', '💿', '👋', '🌊', '✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}