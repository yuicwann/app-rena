import {
  DEFAULT_API_BASE_URL,
  ApiError,
  getApiErrorMessage,
  authApi,
} from '../src/shared/api';

describe('API Client & Error Handling', () => {
  it('has DEFAULT_API_BASE_URL set to https://backend.hayyu.online', () => {
    expect(DEFAULT_API_BASE_URL).toBe('https://backend.hayyu.online');
  });

  describe('getApiErrorMessage', () => {
    it('returns custom message for 401 invalid credentials', () => {
      const err = new ApiError('', 401, 'INVALID_CREDENTIALS');
      expect(getApiErrorMessage(err)).toBe('Nama kelas, nama murid, atau password salah. Silakan periksa kembali.');
    });

    it('returns friendly message for 429 rate limited', () => {
      const err = new ApiError('RATE_LIMITED', 429);
      expect(getApiErrorMessage(err)).toContain('IP Anda diblokir sementara');
    });

    it('returns friendly message for 500 / server errors', () => {
      const err = new ApiError('INTERNAL_ERROR', 500);
      expect(getApiErrorMessage(err)).toContain('Server sedang mengalami gangguan');
    });

    it('handles AbortError timeout gracefully', () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      expect(getApiErrorMessage(err)).toContain('Koneksi ke server timeout');
    });

    it('handles failed to fetch network error gracefully', () => {
      const err = new Error('Failed to fetch');
      expect(getApiErrorMessage(err)).toContain('https://backend.hayyu.online');
    });
  });

  describe('authApi login function', () => {
    it('sends correct request and returns user data on success', async () => {
      const originalFetch = globalThis.fetch;

      const mockResponseData = {
        status: 'success',
        data: {
          user: { id: 'u1', username: 'Aris', role: 'student', class: { id: 'c1', name: 'XII TAV 1' } },
          tokens: { accessToken: 'jwt123', refreshToken: 'ref456', expiresIn: 900 },
        },
      };

      globalThis.fetch = async (url, options) => {
        expect(url.toString()).toBe('https://backend.hayyu.online/v1/auth/login');
        expect(options?.method).toBe('POST');
        const body = JSON.parse(options?.body as string);
        expect(body.className).toBe('XII TAV 1');
        expect(body.password).toBe('rahasia');

        return new Response(JSON.stringify(mockResponseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      try {
        const result = await authApi.login({
          className: ' XII TAV 1 ',
          password: 'rahasia',
          username: 'Aris',
        });

        expect(result.user.username).toBe('Aris');
        expect(result.tokens.accessToken).toBe('jwt123');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('throws ApiError with status and message when server returns error', async () => {
      const originalFetch = globalThis.fetch;

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Nama kelas atau password salah.',
            },
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      };

      try {
        let threw = false;
        try {
          await authApi.login({
            className: 'Kelas Salah',
            password: 'salah',
          });
        } catch (err: unknown) {
          threw = true;
          expect(err instanceof ApiError).toBe(true);
          const apiErr = err as ApiError;
          expect(apiErr.status).toBe(401);
          expect(getApiErrorMessage(apiErr)).toBe('Nama kelas atau password salah.');
        }
        expect(threw).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('sends correct request to /v1/auth/register-student', async () => {
      const originalFetch = globalThis.fetch;

      const mockResponseData = {
        status: 'success',
        data: {
          user: { id: 'u2', username: 'Budi', role: 'student', class: { id: 'c1', name: 'XII TAV 1' } },
          tokens: { accessToken: 'jwtReg', refreshToken: 'refReg', expiresIn: 900 },
        },
      };

      globalThis.fetch = async (url, options) => {
        expect(url.toString()).toBe('https://backend.hayyu.online/v1/auth/register-student');
        expect(options?.method).toBe('POST');
        const body = JSON.parse(options?.body as string);
        expect(body.className).toBe('XII TAV 1');
        expect(body.password).toBe('pass123');
        expect(body.username).toBe('Budi');

        return new Response(JSON.stringify(mockResponseData), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      try {
        const result = await authApi.registerStudent({
          className: 'XII TAV 1',
          password: 'pass123',
          username: 'Budi',
        });

        expect(result.user.username).toBe('Budi');
        expect(result.tokens.accessToken).toBe('jwtReg');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
