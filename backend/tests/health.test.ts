import { describe, expect, it } from 'bun:test';
import { loadEnv } from '../src/env';
import { buildDeps } from '../src/deps';
import { createApp } from '../src/app';

describe('Health and API routes', () => {
  it('GET / returns 200 with API version and success info in JSON', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const res = await app.request('/');
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      status: string;
      code: number;
      version: string;
      message: string;
      endpoints: Record<string, string>;
    };

    expect(data.status).toBe('success');
    expect(data.code).toBe(200);
    expect(data.version).toBe('v1.0.0');
    expect(data.message).toContain('200 OK');
    expect(data.endpoints.health).toBe('/health');
    expect(data.endpoints.docs).toBe('/docs');
  });

  it('GET /health returns 200 and status ok', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };
    expect(data.status).toBe('ok');
    expect(data.service).toBe('sinyallab-backend');
    expect(data.timestamp).toBeTruthy();
  });

  it('GET /ready returns 200 and status ready', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const res = await app.request('/ready');
    expect(res.status).toBe(200);

    const data = (await res.json()) as { status: string };
    expect(data.status).toBe('ready');
  });

  it('GET /non-existent returns 404 with structured error', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const res = await app.request('/non-existent');
    expect(res.status).toBe(404);

    const data = (await res.json()) as {
      error: { code: string; message: string; requestId: string };
    };
    expect(data.error.code).toBe('NOT_FOUND');
    expect(data.error.message).toBe('Endpoint tidak ditemukan.');
    expect(data.error.requestId).toBeTruthy();
  });

  it('OPTIONS /v1/auth/classes returns 204 with CORS preflight headers', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const res = await app.request('/v1/auth/classes', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:8081',
        'Access-Control-Request-Method': 'GET',
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8081');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});
