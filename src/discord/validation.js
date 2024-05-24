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


export {
    validateMantraAccount
};
