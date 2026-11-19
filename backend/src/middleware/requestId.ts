import { createMiddleware } from 'hono/factory';

export const requestId = () =>
  createMiddleware<{ Variables: { requestId: string } }>(async (c, next) => {
    const existing = c.req.header('X-Request-Id');
    const id = existing ?? crypto.randomUUID();
    c.set('requestId', id);
    c.header('X-Request-Id', id);
    await next();
  });
