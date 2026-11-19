import { describe, expect, it } from 'bun:test';
import { loadEnv } from '../src/env';
import { buildDeps } from '../src/deps';
import { createApp } from '../src/app';

describe('Swagger Docs Security & Access Control', () => {
  it('rejects public requests without Basic Auth credentials (HTTP 401)', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    // 1. Coba akses /docs tanpa kredensial
    const docsRes = await app.request('/docs');
    expect(docsRes.status).toBe(401);
    expect(docsRes.headers.get('www-authenticate')).toBeTruthy();

    // 2. Coba akses /docs/openapi.json tanpa kredensial
    const specRes = await app.request('/docs/openapi.json');
    expect(specRes.status).toBe(401);
    expect(specRes.headers.get('www-authenticate')).toBeTruthy();

    // 3. Coba akses dengan kredensial salah
    const invalidAuth = Buffer.from('attacker:wrongpassword').toString('base64');
    const invalidRes = await app.request('/docs/openapi.json', {
      headers: {
        Authorization: `Basic ${invalidAuth}`,
      },
    });
    expect(invalidRes.status).toBe(401);
  });

  it('allows access only with valid Basic Auth credentials', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const validAuth = Buffer.from(`${env.DOCS_USER}:${env.DOCS_PASSWORD}`).toString('base64');

    // 1. Akses OpenAPI JSON spec dengan Basic Auth yang sah
    const specRes = await app.request('/docs/openapi.json', {
      headers: {
        Authorization: `Basic ${validAuth}`,
      },
    });
    expect(specRes.status).toBe(200);

    const spec = (await specRes.json()) as {
      openapi: string;
      info: { title: string };
      paths: Record<string, unknown>;
    };
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toContain('SinyalLab');
    expect(spec.paths['/v1/auth/login']).toBeDefined();
    expect(spec.paths['/v1/auth/classes']).toBeDefined();
    expect(spec.paths['/health']).toBeDefined();

    // 2. Akses Swagger UI HTML dengan Basic Auth yang sah
    const uiRes = await app.request('/docs', {
      headers: {
        Authorization: `Basic ${validAuth}`,
      },
    });
    expect(uiRes.status).toBe(200);
    const htmlText = await uiRes.text();
    expect(htmlText.toLowerCase()).toContain('swagger');
  });

  it('blocks access entirely (HTTP 404) when ENABLE_DOCS is false', async () => {
    const env = loadEnv({
      ...process.env,
      ENABLE_DOCS: 'false',
    });
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const validAuth = Buffer.from(`${env.DOCS_USER}:${env.DOCS_PASSWORD}`).toString('base64');

    const res = await app.request('/docs', {
      headers: {
        Authorization: `Basic ${validAuth}`,
      },
    });
    expect(res.status).toBe(404);
  });
});
