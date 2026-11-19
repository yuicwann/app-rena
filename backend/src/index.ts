import { loadEnv } from './env';
import { buildDeps } from './deps';
import { createApp } from './app';

const env = loadEnv();
const deps = await buildDeps(env);
const app = createApp(deps);

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

deps.logger.info(
  {
    port: server.port,
    env: env.NODE_ENV,
  },
  `SinyalLab API server started on port ${server.port}`
);

const shutdown = async () => {
  deps.logger.info('Shutting down server gracefully...');
  server.stop();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
