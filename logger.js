const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs.txt');

function formatData(data) {
  if (data === undefined) {
    return '';
  }

  if (typeof data === 'object' && data !== null) {
    return JSON.stringify(data);
  }

  return String(data);
}

function setupLogger(app) {
  const writeLog = (eventName, data) => {
    const line = `[${new Date().toISOString()}] ${eventName}: ${formatData(data)}\n`;

    fs.appendFile(LOG_FILE, line, 'utf8', (error) => {
      if (error) {
        console.error('Ошибка записи в logs.txt:', error.message);
      }
    });
  };

  app.on('server:started', (port) => writeLog('server:started', { port }));
  app.on('server:stopped', () => writeLog('server:stopped'));
  app.on('request:received', (request) => {
    writeLog('request:received', request);
  });

  return LOG_FILE;
}

module.exports = { setupLogger };
