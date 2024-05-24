import GCPConsoleLogger from './GCPConsoleLogger.js'
const logger = {
    info: (message, params) => {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, params);
    },
    error: (message, error) => {
      console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error);
    }
  };

  // The code neeeds a major refactor - for now just shim it in.

  const gcplogger = new GCPConsoleLogger();
export default gcplogger;
 // export default logger;