import { createApp } from './app.js';
import { env } from './config/env.js';
import { Logger } from './utils/logger.js';

// =============================================================================
// Server Entry Point
// Starts the HTTP listener and gracefully manages process termination
// =============================================================================

// Step 1: Instantiate Express application
Logger.info('[Server] Step 1: Initializing application server...');
const app = createApp();

// Step 2: Start HTTP server
const server = app.listen(env.PORT, () => {
  Logger.info(`[Server] Step 2: Modern CRM Backend successfully listening on port ${env.PORT}`);
  Logger.info(`[Server] API Base URL: http://localhost:${env.PORT}/api/v1`);
  Logger.info(`[Server] API Docs URL: http://localhost:${env.PORT}/api/docs`);
});

// Step 3: Handle graceful process shutdown
const shutdown = (signal: string) => {
  Logger.info(`[Server] Step 3: Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(() => {
    Logger.info('[Server] HTTP server closed. Process terminating cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
