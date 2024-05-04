// index.js
import 'dotenv/config';
import loadConfig from './src/configLoader.js';
import createFaucetApp from './src/faucet.js';
import logger from './src/logger.js';
import { FrequencyChecker } from './src/checker.js'
import { TransactionManager } from './src/transactionManager.js';

async function startServer() {
  try {
    const config = await loadConfig();

    const PORT = config.port || 3000;

    const checker = new FrequencyChecker(config);
    const transactionManager = new TransactionManager(config, logger);
    const app = createFaucetApp(config, checker, transactionManager, logger);

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, {});
    });
  } catch (error) {
    logger.error('Failed to start the server:', error);
  }
}

startServer();
