import { describe, expect, it, beforeEach } from 'bun:test';
import { loadEnv } from '../src/env';
import { buildDeps } from '../src/deps';
import { createApp } from '../src/app';

describe('Auth & IP Blocker Integration Tests', () => {
  it('registers a class, logs in successfully, accesses /me, and rotates token', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const testClassName = `Test Class ${Date.now()}`;
    const testPassword = 'securePassword123';
    const testStudentName = 'Budi Santoso';

    // 1. Daftarkan kelas baru
    const registerRes = await app.request('/v1/auth/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testClassName,
        password: testPassword,
      }),
    });

    expect(registerRes.status).toBe(201);
    const registerBody = (await registerRes.json()) as {
      status: string;
      data: { id: string; name: string };
    };
    expect(registerBody.status).toBe('success');
    expect(registerBody.data.name).toBe(testClassName);

    // 2. Mendaftarkan nama kelas yang sama harus ditolak (409 CONFLICT)
    const duplicateRes = await app.request('/v1/auth/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testClassName,
        password: testPassword,
      }),
    });
    expect(duplicateRes.status).toBe(409);

    // 3. Login dengan nama kelas dan password yang benar
    const loginRes = await app.request('/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        className: testClassName,
        password: testPassword,
        username: testStudentName,
      }),
    });

    expect(loginRes.status).toBe(200);
    const loginBody = (await loginRes.json()) as {
      status: string;
      data: {
        user: { id: string; username: string; role: string; class: { name: string } };
        tokens: { accessToken: string; refreshToken: string; expiresIn: number };
      };
    };

    expect(loginBody.status).toBe('success');
    expect(loginBody.data.user.username).toBe(testStudentName);
    expect(loginBody.data.user.class.name).toBe(testClassName);
    expect(loginBody.data.tokens.accessToken).toBeTruthy();
    expect(loginBody.data.tokens.refreshToken).toBeTruthy();

    const accessToken = loginBody.data.tokens.accessToken;
    const refreshToken = loginBody.data.tokens.refreshToken;

    // 4. Akses GET /v1/auth/me tanpa token harus 401
    const unauthRes = await app.request('/v1/auth/me');
    expect(unauthRes.status).toBe(401);

    // 5. Akses GET /v1/auth/me dengan Bearer token
    const meRes = await app.request('/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    expect(meRes.status).toBe(200);
    const meBody = (await meRes.json()) as {
      data: { user: { username: string; role: string } };
    };
    expect(meBody.data.user.username).toBe(testStudentName);
    expect(meBody.data.user.role).toBe('student');

    // 6. Rotasi refresh token
    const refreshRes = await app.request('/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    expect(refreshRes.status).toBe(200);
    const refreshBody = (await refreshRes.json()) as {
      data: { tokens: { accessToken: string; refreshToken: string } };
    };
    expect(refreshBody.data.tokens.accessToken).toBeTruthy();
    expect(refreshBody.data.tokens.refreshToken).not.toBe(refreshToken);

    // 7. Token reuse detection: menggunakan refreshToken lama yang sudah dipakai harus ditolak
    const reusedRes = await app.request('/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    expect(reusedRes.status).toBe(401);

    // 8. Better Auth Session: Verifikasi sesi tersimpan di DB dan dapat dipakai sebagai Bearer token
    const sessionToken = (loginBody.data.tokens as { sessionToken?: string }).sessionToken;
    expect(sessionToken).toBeTruthy();

    const sessionMeRes = await app.request('/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    expect(sessionMeRes.status).toBe(200);

    // 9. Logout: Mencabut session Better Auth
    const logoutRes = await app.request('/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        sessionToken,
      }),
    });
    expect(logoutRes.status).toBe(200);

    // 10. Setelah logout, request dengan sessionToken yang telah dicabut harus ditolak (401)
    const revokedRes = await app.request('/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    expect(revokedRes.status).toBe(401);
  });

  it('blocks suspicious IP address for 5 minutes after 5 consecutive failed attempts', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const attackerIp = '203.0.113.199';
    await deps.ipBlocker.unblockIp(attackerIp);

    // Lakukan 4 percobaan gagal berturut-turut (harus 401)
    for (let i = 1; i <= 4; i++) {
      const res = await app.request('/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': attackerIp,
        },
        body: JSON.stringify({
          className: 'KelasPalsu',
          password: 'wrongPassword',
        }),
      });

      expect(res.status).toBe(401);
    }

    // Percobaan ke-5 gagal -> threshold tercapai, langsung diblokir 5 menit (HTTP 429)
    const fifthRes = await app.request('/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': attackerIp,
      },
      body: JSON.stringify({
        className: 'KelasPalsu',
        password: 'wrongPassword',
      }),
    });

    expect(fifthRes.status).toBe(429);
    const fifthBody = (await fifthRes.json()) as {
      error: { code: string; message: string; details: { retryAfter: number } };
    };
    expect(fifthBody.error.code).toBe('RATE_LIMITED');
    expect(fifthBody.error.details.retryAfter).toBeGreaterThan(250);
    expect(fifthRes.headers.get('Retry-After')).toBeTruthy();

    // Percobaan ke-6 (bahkan jika pakai data yang benar sekalipun) langsung diblokir 429
    const sixthRes = await app.request('/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': attackerIp,
      },
      body: JSON.stringify({
        className: 'KelasApapun',
        password: 'passwordApapun',
      }),
    });

    expect(sixthRes.status).toBe(429);
    const sixthBody = (await sixthRes.json()) as {
      error: { code: string };
    };
    expect(sixthBody.error.code).toBe('RATE_LIMITED');

    // Clean up
    await deps.ipBlocker.unblockIp(attackerIp);
  });

  it('allows students to register into an existing class and rejects duplicate student names', async () => {
    const env = loadEnv();
    const deps = await buildDeps(env);
    const app = createApp(deps);

    const testClassName = `Kelas Siswa ${Date.now()}`;
    const testPassword = 'classPassword123';
    const student1 = 'Ahmad Dahlan';

    // 1. Buat kelas target
    await app.request('/v1/auth/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testClassName, password: testPassword }),
    });

    // 2. Daftarkan murid baru
    const regRes = await app.request('/v1/auth/register-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        className: testClassName,
        password: testPassword,
        username: student1,
      }),
    });

    expect(regRes.status).toBe(201);
    const regBody = (await regRes.json()) as {
      status: string;
      data: { user: { username: string }; tokens: { accessToken: string } };
    };
    expect(regBody.status).toBe('success');
    expect(regBody.data.user.username).toBe(student1);
    expect(regBody.data.tokens.accessToken).toBeTruthy();

    // 3. Daftarkan murid dengan nama yang sama di kelas yang sama -> harus ditolak (409 CONFLICT)
    const dupRes = await app.request('/v1/auth/register-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        className: testClassName,
        password: testPassword,
        username: student1,
      }),
    });

    expect(dupRes.status).toBe(409);

    // 4. Daftarkan murid kedua di kelas yang sama -> harus berhasil (1 kelas banyak murid)
    const student2 = 'Siti Nurhaliza';
    const regRes2 = await app.request('/v1/auth/register-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        className: testClassName,
        password: testPassword,
        username: student2,
      }),
    });

    expect(regRes2.status).toBe(201);
    const regBody2 = (await regRes2.json()) as {
      data: { user: { username: string } };
    };
    expect(regBody2.data.user.username).toBe(student2);
  });
});
