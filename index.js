const http = require('http');
const { EventEmitter } = require('events');
const { setupLogger } = require('./logger');

class AppServer extends EventEmitter {
  constructor() {
    super();
    this.server = null;
    this.port = null;
  }

  start(port) {
    if (this.server) {
      throw new Error('Сервер уже запущен');
    }

    this.server = http.createServer((req, res) => {
      this.emit('request:received', {
        url: req.url,
        method: req.method
      });

      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('Hello from Event-Driven Server!');
    });

    this.server.on('error', (error) => {
      this.emit('server:error', error);
    });

    this.server.listen(port, () => {
      this.port = this.server.address().port;
      this.emit('server:started', this.port);
    });

    return this.server;
  }

  stop() {
    if (!this.server) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        this.server = null;
        this.emit('server:stopped');
        resolve();
      });
    });
  }
}

function configureServerLogging(app) {
  app.on('server:started', (port) => {
    console.log(`🚀 Сервер запущен на порту ${port}`);
  });

  app.on('request:received', ({ method, url }) => {
    console.log(`📨 Получен запрос: ${method} ${url}`);
  });

  app.on('server:stopped', () => {
    console.log('🛑 Сервер остановлен');
  });

  app.on('server:error', (error) => {
    console.error('Ошибка HTTP-сервера:', error.message);
  });
}

if (require.main === module) {
  const app = new AppServer();

  configureServerLogging(app);
  setupLogger(app);

  const port = Number(process.env.PORT) || 3000;
  app.start(port);

  process.on('SIGINT', () => {
    app.stop().catch((error) => {
      console.error('Ошибка остановки сервера:', error.message);
      process.exitCode = 1;
    });
  });
}

module.exports = {
  AppServer,
  configureServerLogging
};
