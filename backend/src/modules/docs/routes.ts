import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { swaggerUI } from '@hono/swagger-ui';
import { Deps } from '../../deps';
import { getOpenApiSpec } from './openapi';
import { AppError } from '../../shared/errors';

export function docsRoutes(deps: Deps) {
  const router = new Hono();

  // 1. Kill-switch: jika dokumentasi dinonaktifkan di environment ini
  router.use('*', async (c, next) => {
    if (!deps.env.ENABLE_DOCS) {
      throw new AppError('NOT_FOUND', 404, 'Dokumentasi API tidak tersedia.');
    }
    await next();
  });

  // 2. Proteksi Akses Internal via HTTP Basic Authentication
  // Siapapun tanpa username & password di env tidak akan bisa membuka Swagger atau OpenAPI spec
  router.use(
    '*',
    basicAuth({
      username: deps.env.DOCS_USER,
      password: deps.env.DOCS_PASSWORD,
      realm: 'Akses Terbatas: Dokumentasi API Internal SinyalLab',
    })
  );

  // 3. Endpoint Spesifikasi OpenAPI JSON (hanya setelah Basic Auth lolos)
  router.get('/openapi.json', (c) => {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    return c.json(getOpenApiSpec(), 200);
  });

  // 4. Endpoint Antarmuka Swagger UI (hanya setelah Basic Auth lolos)
  router.get(
    '/',
    swaggerUI({
      url: '/docs/openapi.json',
    })
  );

  router.get(
    '/ui',
    swaggerUI({
      url: '/docs/openapi.json',
    })
  );

  return router;
}
