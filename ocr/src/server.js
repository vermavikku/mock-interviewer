// Server entry point for OCR Microservice
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/database');
const logger = require('./shared/utils/logger');

const startServer = async () => {
  try {
    // Connect to database (MongoDB)
    await connectDB();

    // Start server
    const server = app.listen(env.port, () => {
      logger.info(`OCR Service running in ${env.nodeEnv} mode on port ${env.port}`);
      logger.info(`Interactive API Docs available at http://localhost:${env.port}/api/docs`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });

    // Graceful shutdown on SIGTERM/SIGINT
    const shutdown = () => {
      logger.info('Shutting down OCR Service gracefully...');
      server.close(() => {
        logger.info('OCR Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error(`Failed to start OCR server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
