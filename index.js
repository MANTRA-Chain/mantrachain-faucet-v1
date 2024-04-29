// index.js
import 'dotenv/config'; 
import createFaucet from './faucet.js';
import loadConfig from './configLoader.js';

async function startServer() {
  try {
    const config = await loadConfig();

    const PORT = config.port|| 3000;
    const app = createFaucet(config);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
  }
}

startServer();
