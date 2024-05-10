// index.js
import logger from './logger.js';
import dotenv from 'dotenv'
import loadConfig from './configLoader.js';
import createFaucetApp from './faucet.js';

import { FrequencyChecker } from './checker.js'
import { TransactionManager } from './transactionManager.js';

logger.info("Starting Faucet Server");

const closable = [];

async function startServer() {
  try {
    const config = await loadConfig();

    const PORT = config.port || 3000;

    const checker = new FrequencyChecker(config);
    closable.push(async () => await checker.close());
    const transactionManager = new TransactionManager(config, logger);
    const app = createFaucetApp(config, checker, transactionManager, logger);

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, {});
    });
  } catch (error) {
    logger.error('Failed to start the server:', error);
  }
}

async function stopServer(signal) {
  logger.info(`Received signal to terminate:`, signal)

  for (let i = 0; i < closable.length; i++)
    await closable[i]();

  process.kill(process.pid, signal);
}

process.once('SIGINT', stopServer)
process.once('SIGTERM', stopServer)

await startServer();
