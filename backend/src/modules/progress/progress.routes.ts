import { Hono, MiddlewareHandler } from 'hono';
import { ProgressController } from './progress.controller';
import { AppEnv } from '../../app';

export function progressRoutes(
  controller: ProgressController,
  authMiddleware: MiddlewareHandler
) {
  const router = new Hono<AppEnv>();

  // Semua endpoint progress mewajibkan token login valid (Bearer token)
  router.use('*', authMiddleware);

  router.get('/', controller.get);
  router.post('/step', controller.updateStep);
  router.put('/sync', controller.sync);
  router.post('/reset', controller.reset);

  return router;
}
