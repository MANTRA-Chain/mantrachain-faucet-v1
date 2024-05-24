import { capitalize, InstallGlobalCommands } from './utils.js';
import loadConfig from '../configLoader.js';


async function register() {
  const config = await loadConfig();

  // // Get the game choices from game.js
  // function createCommandChoices() {
  //   const choices = getRPSChoices();
  //   const commandChoices = [];

  //   for (let choice of choices) {
  //     commandChoices.push({
  //       name: capitalize(choice),
  //       value: choice.toLowerCase(),
  //     });
  //   }

  //   return commandChoices;
  // }

  // Simple test command
  const TEST_COMMAND = {
    name: 'test',
    description: 'Basic command',
    type: 1,
  };

  const REQUEST_TOKEN_COMMAND = {
    name: 'request',
    description: 'Request tokens from the faucet',
    type: 1
    // options: [{
    //   type: 3, // Type 3 corresponds to STRING
    //   name: 'wallet',
    //   description: 'Your wallet address',
    //   required: true // This must be provided by the user
    // }]
  };

  const ALL_COMMANDS = [REQUEST_TOKEN_COMMAND];

  await InstallGlobalCommands(config, ALL_COMMANDS);
}


register();