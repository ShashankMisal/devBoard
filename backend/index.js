const app = require('./src/app');
const config = require('./src/config/config');
const { connectDB, closeDatabaseConnection } = require('./src/config/db');
const { closeRedisConnection, connectRedis } = require('./src/config/redis');
const { logger } = require('./src/utils/logger');

let server;
let isShuttingDown = false;

const startServer = async () => {
  try {
    // Waiting for the database first avoids accepting traffic the API cannot actually serve correctly.
    await connectDB();
    await connectRedis();

    server = app.listen(config.app.port, () => {
      logger.info(`Server is running on port ${config.app.port} in ${config.app.env} mode.`);
    });
  } catch (error) {
    logger.error('Failed to start the application.', {
      errorMessage: error.message,
      stack: error.stack
    });

    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.warn(`Received ${signal}. Starting graceful shutdown.`);

  try {
    if (server && server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    await closeDatabaseConnection(signal);
    await closeRedisConnection(signal);

    logger.info('Application shutdown completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Graceful shutdown failed.', {
      errorMessage: error.message,
      stack: error.stack
    });

    process.exit(1);
  }
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

startServer();
