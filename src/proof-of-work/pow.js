import crypto from 'crypto';
import * as path from 'path'

let _logger = {};
let _config = {};
let _checker = {};

export function enablePOW(app, config, checker, transactionManager, logger ) {

  _logger = logger;
  _config = config;
  _checker = checker;

    app.get('/powWorker.js', (req, res) => {
        res.sendFile(path.resolve('pages/powWorker.js'));
      })
    

    app.get('/pow-challenge', async (req, res) => {
        if (config.pow && config.pow.enabled) {
          const nonce = crypto.randomBytes(16).toString('hex'); // Generate a random nonce
          const timestamp = Date.now();
          await _checker.update(nonce);
          res.json({ nonce, timestamp, difficulty: config.pow.difficulty });
        }
        else {
          res.status(200).json({ result: "disabled" });
        }
      });
}

export async function verifyPOW(nonce, timestamp, solution) {
    const powTarget = '0'.repeat(_config.pow.difficulty);
    const hash = crypto.createHash('sha256').update(`${nonce}${solution}`).digest('hex');
  
    // fetch from the database to ensure no reuse during the window
    const dbTime = await _checker.checkPOW(nonce);

    if (!dbTime) {
      _logger.info(`Did not find nonce (${nonce}) in the db`);
      return false;
    } else {
      _checker.remove(nonce); //remove it from the database
    }
  
    if (hash.startsWith(powTarget) && (Date.now() - dbTime < estimateTime())) { // Verify solution and expiration
      return true;
    } else {
      return false;
    }
  }
  
  function estimateTime() {
    const attemptsNeeded = Math.pow(16, Math.max(6, _config.pow.difficulty));
    return (attemptsNeeded / 90000) * 1000; //milliseconds
  }