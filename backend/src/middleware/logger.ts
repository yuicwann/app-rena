import { createMiddleware } from 'hono/factory';
import { Logger } from '../shared/logger';

export const accessLog = (logger: Logger) =>
  createMiddleware<{ Variables: { requestId: string; auth?: { userId: string } } }>(
    async (c, next) => {
      const start = Date.now();
      const method = c.req.method;
      const path = c.req.path;

      await next();

      const durationMs = Date.now() - start;
      const status = c.res.status;
      const requestId = c.get('requestId');
      const userId = c.get('auth')?.userId;

      logger.info({
        requestId,
        method,
        path,
        status,
        durationMs,
        userId,
      });
    }
  );
