
import express from 'express';
import * as path from 'path';
import { enablePOW } from './proof-of-work/pow.js';
import { enableDiscord } from './discord/bot.js';
import { enableBalanceApi, enableWeb2ConfigApi, enableWeb2Send } from './web2/web2.js';

function createFaucetApp(config, checker, transactionManager, logger) {

  const HOMEPAGE = config.web2 && config.web2.home ? config.web2.home : './pages/index.html';
  //logger.info(`Creating Faucet With Config:`, config);

  const app = express()
  enableWeb2ConfigApi(app, config, checker, transactionManager, logger);

  if (config.discord && config.discord.enabled) {
    enableDiscord(app, config, checker, transactionManager, logger);
  }

  app.use(express.json());

  if (config.pow && config.pow.enabled) {
    enablePOW(app, config, checker, transactionManager, logger);
  }

  if (config.web2 && config.web2.enabled) {
    enableWeb2Send(app, config, checker, transactionManager, logger);
    enableBalanceApi(app, config, checker, transactionManager, logger);
  }

  app.get('/', (req, res) => {
    res.sendFile(path.resolve(HOMEPAGE));
  })

  return app;

}

export default createFaucetApp;