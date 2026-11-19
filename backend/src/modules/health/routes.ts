import { Hono } from 'hono';
import { Deps } from '../../deps';

export const API_VERSION = 'v1.0.0';

export const healthRoutes = (deps: Deps) =>
  new Hono()
    .get('/', (c) => {
      return c.json(
        {
          status: 'success',
          code: 200,
          message: 'Backend SinyalLab aktif dan berjalan normal (200 OK)',
          service: 'sinyallab-backend',
          version: API_VERSION,
          environment: deps.env.NODE_ENV,
          timestamp: deps.clock.nowIso(),
          endpoints: {
            health: '/health',
            ready: '/ready',
            docs: '/docs',
            auth: '/v1/auth',
            progress: '/v1/progress',
          },
        },
        200
      );
    })
    .get('/health', (c) => {
      return c.json(
        {
          status: 'ok',
          service: 'sinyallab-backend',
          version: API_VERSION,
          timestamp: deps.clock.nowIso(),
        },
        200
      );
    })
    .get('/ready', async (c) => {
      try {
        await deps.prisma.$queryRaw`SELECT 1`;
        return c.json(
          {
            status: 'ready',
            database: 'connected',
            version: API_VERSION,
            timestamp: deps.clock.nowIso(),
          },
          200
        );
      } catch (err) {
        deps.logger.error({ err }, 'Database readiness check failed');
        return c.json(
          {
            status: 'unavailable',
            database: 'disconnected',
            version: API_VERSION,
            timestamp: deps.clock.nowIso(),
          },
          503
        );
      }
    });
