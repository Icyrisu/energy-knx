import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { pool, testDbConnection } from './db/pool.js';
import { alarmService } from './services/alarmService.js';
import { historyWriter } from './services/historyWriter.js';
import { liveStore } from './services/liveStore.js';
import { wsServer } from './websocket/wsServer.js';

async function bootstrap() {
  console.log('⚡ Starting Energy SCADA Backend service...');
  console.log(`🌍 Environment: ${env.NODE_ENV} | Port: ${env.PORT} | Timezone: ${env.TZ}`);

  // 1. Verify PostgreSQL connection with retry
  console.log('⏳ Connecting to PostgreSQL database...');
  const dbConnected = await testDbConnection(10, 2000);
  if (!dbConnected) {
    console.error('❌ Failed to connect to PostgreSQL database after multiple attempts.');
    process.exit(1);
  }
  console.log('✅ PostgreSQL database connected successfully.');

  // 2. Run migrations if enabled
  if (env.MIGRATE_ON_START) {
    try {
      await runMigrations();
    } catch (err) {
      console.error('❌ Migration failed during startup:', err);
      process.exit(1);
    }
  }

  // 3. Initialize Alarm Service rules cache
  await alarmService.refreshRules();

  // 4. Start HTTP & WebSocket server
  const app = createApp();
  const server = createServer(app);

  wsServer.init(server);
  historyWriter.start();

  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Energy SCADA Backend API running at http://0.0.0.0:${env.PORT}`);
    console.log(`🔌 WebSocket live telemetry endpoint available at ws://0.0.0.0:${env.PORT}/ws`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Stop background timers
    liveStore.stop();
    historyWriter.stop();

    // Close WebSocket connections
    wsServer.close();

    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed.');
    });

    // Close DB pool
    try {
      await pool.end();
      console.log('PostgreSQL connection pool closed.');
    } catch (err) {
      console.error('Error closing DB pool:', err);
    }

    console.log('👋 Energy SCADA Backend shutdown complete.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
