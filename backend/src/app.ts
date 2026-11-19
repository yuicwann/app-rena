import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { Deps } from './deps';
import { requestId } from './middleware/requestId';
import { accessLog } from './middleware/logger';
import { secureHeaders } from './middleware/secureHeaders';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './modules/health/routes';
import { authRoutes } from './modules/auth/auth.routes';
import { progressRoutes } from './modules/progress/progress.routes';
import { docsRoutes } from './modules/docs/routes';
import { requireAuth } from './middleware/auth';
import { AppError } from './shared/errors';

export type AppEnv = {
  Variables: {
    requestId: string;
    auth?: {
      userId: string;
      role: 'student' | 'teacher' | 'admin';
      classId?: string;
    };
  };
};

export function createApp(deps: Deps) {
  const app = new Hono<AppEnv>();

  // Global Middlewares
  app.use(requestId());
  app.use(accessLog(deps.logger));

  // CORS Middleware - allow configured origins or allow all in development / wildcard
  const allowedOrigins = deps.env.CORS_ORIGINS
    ? deps.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || !origin) {
          return origin || '*';
        }
        return allowedOrigins.includes(origin) ? origin : null;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id', 'Accept'],
      exposeHeaders: ['Content-Length', 'X-Request-Id'],
      maxAge: 86400,
      credentials: true,
    })
  );

  app.use(secureHeaders());

  // Body limit (256 KB)
  app.use(
    '/v1/*',
    bodyLimit({
      maxSize: 256 * 1024,
      onError: () => {
        throw new AppError('PAYLOAD_TOO_LARGE', 413, 'Ukuran payload melebihi batas 256 KB.');
      },
    })
  );

  // Error handling
  app.onError(errorHandler(deps.logger));

  // 404 Handler
  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint tidak ditemukan.',
          requestId: c.get('requestId'),
        },
      },
      404
    );
  });

  // Better Auth Handler
  app.on(['POST', 'GET'], '/api/auth/*', (c) => deps.betterAuth.handler(c.req.raw));

  // Root & Modular Routes
  const authMiddleware = requireAuth(deps.tokenService, deps.sessionService);

  return app
    .route('/', healthRoutes(deps))
    .route('/v1/auth', authRoutes(deps.authController, authMiddleware))
    .route('/v1/progress', progressRoutes(deps.progressController, authMiddleware))
    .route('/docs', docsRoutes(deps));
}

export type AppType = ReturnType<typeof createApp>;
