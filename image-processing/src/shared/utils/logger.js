// Logger utility
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const timestamp = () => new Date().toISOString();

const formatMessage = (level, message) => `[${timestamp()}] [${level.toUpperCase()}] ${message}`;

const writeToFile = (message) => {
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `${date}.log`);
  fs.appendFileSync(logFile, message + '\n');
};

const logger = {
  info: (message) => {
    const msg = formatMessage('info', message);
    console.log(msg);
    writeToFile(msg);
  },
  warn: (message) => {
    const msg = formatMessage('warn', message);
    console.warn(msg);
    writeToFile(msg);
  },
  error: (message) => {
    const msg = formatMessage('error', message);
    console.error(msg);
    writeToFile(msg);
  },
  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      const msg = formatMessage('debug', message);
      console.debug(msg);
      writeToFile(msg);
    }
  },
};

module.exports = logger;