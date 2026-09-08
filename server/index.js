import { config } from './config.js';
import { createApp } from './app.js';

/** Fail fast and loudly rather than serving requests with a broken config. */
if (config.isProduction && !config.geminiApiKey) {
  console.warn(
    '[startup] GEMINI_API_KEY is not set — /api/ai/compose-letter will return 503 until it is.'
  );
}

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`AI server listening on :${config.port} (${config.nodeEnv})`);
});

server.on('error', (err) => {
  console.error('[startup] server failed to start:', err.message);
  process.exit(1);
});

/**
 * Stop accepting connections, let in-flight requests finish, then exit. Without
 * this a container orchestrator's SIGTERM kills the process mid-request.
 */
const shutdown = (signal) => {
  console.log(`[shutdown] ${signal} received, draining connections…`);
  const forceExit = setTimeout(() => {
    console.error('[shutdown] drain timed out, forcing exit');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close((err) => {
    clearTimeout(forceExit);
    if (err) {
      console.error('[shutdown] error while closing:', err.message);
      process.exit(1);
    }
    console.log('[shutdown] complete');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// An unhandled rejection terminates the process on Node >= 15; log and survive
// so one stray promise cannot take the service down.
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[server] uncaught exception:', err);
  process.exit(1);
});
