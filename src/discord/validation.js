import { bech32 } from 'bech32';
import {
    InteractionType,
    InteractionResponseType,
    InteractionResponseFlags
} from 'discord-interactions';

// Middleware to validate Mantra account address
function validateMantraAccount(req, res, next) {

    if (req.body && req.body.type == InteractionType.MODAL_SUBMIT) {

        const walletAddress = req.body.data.components[0].components[0].value;
        let message = 'The address you sent is not valid for Hongbai: ';
        const errorResponse = {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: message, flags: InteractionResponseFlags.EPHEMERAL }
        };


        try {
            const decoded = bech32.decode(walletAddress);
            if (decoded.prefix !== 'mantra') {
                errorResponse.data.content += 'Invalid account prefix - should be "mantra"';
                return res.status(200).json(errorResponse);
            }
            next();
        } catch (err) {
            errorResponse.data.content += 'Invalid account format';
            return res.status(200).json(errorResponse);
        }
    }
    else {
        next();
    }


}

// Middleware to check if the server is allowed
function checkAllowedGuilds(allowedGuilds, logger) {
    return (req, res, next) => {

        if (req.body && req.body.type == InteractionType.MODAL_SUBMIT) {
            const guildId = req.body.guild_id;

            if (!guildId) {
                logger.warn("Guild ID is missing in the request");
                return res.status(400).json({ error: "Guild ID is missing" });
            }

            if (!allowedGuilds || !Array.isArray(allowedGuilds)) {
                logger.warn("Allowed guilds list is not provided or not an array");
                return res.status(400).json({ error: "Allowed guilds list is not provided or not an array" });
            }

            if (allowedGuilds.includes(guildId)) {
                logger.info(`Request from Guild: ${guildId} permitted.`);

                next();
            } else {
                logger.info(`Guild ${guildId} is not allowed`);
                return res.status(403).json({ error: "Guild is not allowed" });
            }
        } else {
            logger.debug("Request is not a modal submit - skipping guild check");
            next();
        }
    };
}

export {
    validateMantraAccount,
    checkAllowedGuilds
};
