const logger = {
    info: (message, params) => {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, params);
    },
    error: (message, error) => {
      console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error);
    }
  };

  export default logger;