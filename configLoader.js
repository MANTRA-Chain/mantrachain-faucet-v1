import dotenv from 'dotenv';
dotenv.config();  // Ensure this is on top to configure the environment first

async function loadConfig() {
  const { default: loadedConfig } = await import(process.env.CONFIG_FILE_PATH || './config.js');
  return loadedConfig;
}

export default loadConfig;
