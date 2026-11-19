import { describe, expect, it } from 'bun:test';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { IpBlockerService } from '../src/services/ipBlocker';
import { SessionService } from '../src/services/betterAuth';
import { Context } from 'hono';

describe('AuthController Layer Unit Tests', () => {
  it('rejects invalid login input at boundary and records failure', async () => {
    let failureRecorded = false;
    const mockIpBlocker = {
      recordFailure: async () => {
        failureRecorded = true;
        return { blocked: false, remainingSeconds: 0, failureCount: 1 };
      },
    } as unknown as IpBlockerService;

    const controller = new AuthController(
      {} as AuthService,
      mockIpBlocker,
      {} as SessionService
    );

    const mockContext = {
      req: {
        json: async () => ({ className: '', password: '' }),
        header: () => undefined,
      },
      env: {},
    } as unknown as Context;

    try {
      await controller.login(mockContext);
      expect(true).toBe(false);
    } catch (err: unknown) {
      const error = err as { code: string; status: number };
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.status).toBe(422);
      expect(failureRecorded).toBe(true);
    }
  });

  it('validates and delegates login to AuthService, returning formatted response', async () => {
    const mockLoginResult = {
      user: { id: 'u1', username: 'Budi', role: 'student', class: { id: 'c1', name: 'TAV 1' } },
      tokens: { accessToken: 'jwt1', refreshToken: 'ref1', expiresIn: 900 },
    };

    const mockAuthService = {
      login: async () => mockLoginResult,
    } as unknown as AuthService;

    const controller = new AuthController(
      mockAuthService,
      {} as IpBlockerService,
      {} as SessionService
    );

    let jsonResponse: unknown = null;
    let statusCode: number | undefined = undefined;

    const mockContext = {
      req: {
        json: async () => ({ className: 'TAV 1', password: 'validPassword123' }),
        header: () => undefined,
      },
      json: (payload: unknown, status?: number) => {
        jsonResponse = payload;
        statusCode = status;
        return payload as unknown as Response;
      },
    } as unknown as Context;

    await controller.login(mockContext);

    expect<number | undefined>(statusCode).toBe(200);
    expect(jsonResponse).toEqual({
      status: 'success',
      data: mockLoginResult,
    });
  });

  it('rejects invalid class registration input at boundary', async () => {
    let failureRecorded = false;
    const mockIpBlocker = {
      recordFailure: async () => {
        failureRecorded = true;
        return { blocked: false, remainingSeconds: 0, failureCount: 1 };
      },
    } as unknown as IpBlockerService;

    const controller = new AuthController(
      {} as AuthService,
      mockIpBlocker,
      {} as SessionService
    );

    const mockContext = {
      req: {
        json: async () => ({ name: 'A', password: '1' }), // Too short
        header: () => undefined,
      },
    } as unknown as Context;

    try {
      await controller.registerClass(mockContext);
      expect(true).toBe(false);
    } catch (err: unknown) {
      const error = err as { code: string; status: number };
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.status).toBe(422);
      expect(failureRecorded).toBe(true);
    }
  });
});
