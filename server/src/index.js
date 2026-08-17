import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { isFirebaseReady, getInitError } from './config/firebase.js';

const server = app.listen(env.port, () => {
  logger.info('─'.repeat(64));
  logger.info(`API listening on http://localhost:${env.port}`);
  logger.info(`Environment      : ${env.nodeEnv}`);
  logger.info(`Public site URL  : ${env.siteUrl}`);
  logger.info(`Allowed origins  : ${env.corsOrigins.join(', ') || '(none)'}`);
  logger.info(`Firebase Admin   : ${isFirebaseReady() ? 'connected' : 'NOT CONFIGURED'}`);
  if (!isFirebaseReady()) {
    logger.warn(getInitError()?.message || 'Firebase Admin is unavailable.');
    logger.warn('Content endpoints will return 503 until credentials are provided.');
  }
  logger.info('─'.repeat(64));
});

const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully.`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  // Force-exit if connections do not drain in time.
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception — exiting', error);
  process.exit(1);
});

export default server;
