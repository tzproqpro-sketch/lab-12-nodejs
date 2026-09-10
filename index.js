const http = require('http');
const { EventEmitter } = require('events');
const { setupLogger } = require('./logger');

class AppServer extends EventEmitter {
  constructor() {
    super();
    this.server = null;
    this.port = null;
    this.orderHandler = new OrderHandler();
  }

  start(port) {
    if (this.server) {
      throw new Error('Сервер уже запущен');
    }

    this.server = http.createServer((req, res) => {
      const request = {
        url: req.url,
        method: req.method
      };

      this.emit('request:received', request);

      if (req.method === 'GET' && req.url.startsWith('/order/')) {
        const orderId = decodeURIComponent(req.url.slice('/order/'.length));

        if (orderId) {
          this.orderHandler.processOrder(orderId);
          res.writeHead(202, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`Заказ #${orderId} принят в обработку`);
          return;
        }
      }

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
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

class OrderHandler extends EventEmitter {
  processOrder(orderId) {
    this.emit('order:start', orderId);

    setTimeout(() => {
      this.emit('order:processing', orderId, 'Идёт обработка...');

      setTimeout(() => {
        const sum = Math.floor(Math.random() * 901) + 100;
        this.emit('order:complete', orderId, sum);
      }, 2000);
    }, 2000);
  }
}

class UserTracker extends EventEmitter {
  trackAction(userId, action, metadata) {
    const event = {
      userId,
      action,
      timestamp: new Date().toISOString(),
      metadata,
      id: Math.random().toString(36).slice(2, 11)
    };

    this.emit('user:action', event);
    return event;
  }
}

function calculatePi() {
  const arctangent = (value) => {
    let result = 0;
    let power = value;
    let denominator = 1;
    let sign = 1;

    for (let term = 0; term < 100; term += 1) {
      result += sign * power / denominator;
      power *= value * value;
      denominator += 2;
      sign *= -1;

      if (Math.abs(power / denominator) < Number.EPSILON) {
        break;
      }
    }

    return result;
  };

  // Формула Мачина: pi = 16 * atan(1/5) - 4 * atan(1/239).
  return 16 * arctangent(1 / 5) - 4 * arctangent(1 / 239);
}

function configureOrderLogging(orderHandler) {
  orderHandler.on('order:start', (orderId) => {
    console.log(`[order:start] Заказ #${orderId} начат`);
  });

  orderHandler.on('order:processing', (orderId, message) => {
    console.log(`[order:processing] Заказ #${orderId}: ${message}`);
  });

  orderHandler.on('order:complete', (orderId, sum) => {
    console.log(
      `💰 Заказ #${orderId} завершён на сумму ${sum} руб. PI = ${calculatePi().toFixed(7)}`
    );
  });
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

function runUserTrackerDemo() {
  const tracker = new UserTracker();

  tracker.on('user:action', ({ userId, action, timestamp, metadata, id }) => {
    console.log(
      `👤 Пользователь ${userId} совершил действие "${action}"\n` +
      `   Время: ${timestamp}\n` +
      `   ID события: ${id}\n` +
      `   Доп. данные: ${JSON.stringify(metadata)}`
    );
  });

  tracker.trackAction('user-101', 'login', { device: 'desktop', success: true });
  tracker.trackAction('user-101', 'open-order', { orderId: 42, source: 'web' });
  tracker.trackAction('user-202', 'logout', { reason: 'button-click' });
}

if (require.main === module) {
  const app = new AppServer();
  const orderHandler = new OrderHandler();

  app.orderHandler = orderHandler;
  configureServerLogging(app);
  setupLogger(app);
  configureOrderLogging(orderHandler);
  runUserTrackerDemo();

  const port = Number(process.env.PORT) || 3000;
  app.start(port);

  // Для проверки остановки можно завершить процесс через 10 секунд.
  setTimeout(() => {
    app.stop().catch((error) => {
      console.error('Ошибка остановки сервера:', error.message);
    });
  }, 10000);
}

module.exports = {
  AppServer,
  OrderHandler,
  UserTracker,
  calculatePi,
  configureOrderLogging,
  configureServerLogging
};
