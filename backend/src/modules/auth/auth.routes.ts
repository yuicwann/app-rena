import { Hono, MiddlewareHandler } from 'hono';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';
import type { Deps } from '../../deps';

export function authRoutes(
  controllerOrDeps: AuthController | Deps,
  authMiddleware?: MiddlewareHandler
) {
  const router = new Hono();

  const controller =
    'authController' in controllerOrDeps
      ? controllerOrDeps.authController
      : controllerOrDeps;

  const middleware =
    authMiddleware ??
    ('tokenService' in controllerOrDeps
      ? requireAuth(controllerOrDeps.tokenService, controllerOrDeps.sessionService)
      : async (_c, next) => await next());

  // POST /v1/auth/login - Login dengan nama kelas dan password
  router.post('/login', controller.login);

  // POST /v1/auth/register-student - Daftarkan akun murid baru ke kelas
  router.post('/register-student', controller.registerStudent);
  router.post('/register', controller.registerStudent);

  // GET /v1/auth/classes - Daftar kelas aktif
  router.get('/classes', controller.listClasses);

  // POST /v1/auth/classes - Daftarkan kelas baru
  router.post('/classes', controller.registerClass);

  // POST /v1/auth/register-class - Alias pendaftaran kelas
  router.post('/register-class', controller.registerClass);

  // POST /v1/auth/refresh - Perbarui sesi dengan refresh token
  router.post('/refresh', controller.refresh);

  // POST /v1/auth/logout - Cabut sesi refresh token & session Better Auth
  router.post('/logout', controller.logout);

  // GET /v1/auth/me - Cek data profil login saat ini
  router.get('/me', middleware, controller.me);

  return router;
}
