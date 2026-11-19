import { describe, expect, it } from 'bun:test';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthRepository } from '../src/modules/auth/auth.repository';
import { Hasher } from '../src/services/hasher';
import { IpBlockerService } from '../src/services/ipBlocker';
import { TokenService } from '../src/services/tokens';
import { SessionService } from '../src/services/betterAuth';

describe('AuthService Business Logic Unit Tests', () => {
  it('rejects login when IP is blocked by rate limiter', async () => {
    const mockIpBlocker = {
      checkIp: async () => ({ blocked: true, remainingSeconds: 280, failureCount: 5 }),
      recordFailure: async () => ({ blocked: true, remainingSeconds: 280, failureCount: 5 }),
      recordSuccess: async () => {},
    } as unknown as IpBlockerService;

    const service = new AuthService(
      {} as AuthRepository,
      {} as Hasher,
      {} as TokenService,
      mockIpBlocker,
      {} as SessionService
    );

    try {
      await service.login('1.2.3.4', { className: 'TAV 1', password: 'secret' });
      expect(true).toBe(false); // Should not reach
    } catch (err: unknown) {
      const error = err as { code: string; status: number };
      expect(error.code).toBe('RATE_LIMITED');
      expect(error.status).toBe(429);
    }
  });

  it('rejects login when class does not exist', async () => {
    let failureRecorded = false;
    let attemptLogged = false;

    const mockRepo = {
      findClassByKey: async () => null,
      createLoginAttempt: async () => {
        attemptLogged = true;
      },
    } as unknown as AuthRepository;

    const mockIpBlocker = {
      checkIp: async () => ({ blocked: false, remainingSeconds: 0, failureCount: 0 }),
      recordFailure: async () => {
        failureRecorded = true;
        return { blocked: false, remainingSeconds: 0, failureCount: 1 };
      },
    } as unknown as IpBlockerService;

    const service = new AuthService(
      mockRepo,
      {} as Hasher,
      {} as TokenService,
      mockIpBlocker,
      {} as SessionService
    );

    try {
      await service.login('1.2.3.4', { className: 'Kelas Palsu', password: 'secret' });
      expect(true).toBe(false);
    } catch (err: unknown) {
      const error = err as { code: string; status: number };
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.status).toBe(401);
      expect(attemptLogged).toBe(true);
      expect(failureRecorded).toBe(true);
    }
  });

  it('rejects login when class is inactive', async () => {
    const mockRepo = {
      findClassByKey: async () => ({
        id: 'c1',
        name: 'Kelas Nonaktif',
        key: 'kelas nonaktif',
        isActive: false,
        passwordHash: 'hash',
      }),
    } as unknown as AuthRepository;

    const mockIpBlocker = {
      checkIp: async () => ({ blocked: false, remainingSeconds: 0, failureCount: 0 }),
    } as unknown as IpBlockerService;

    const service = new AuthService(
      mockRepo,
      {} as Hasher,
      {} as TokenService,
      mockIpBlocker,
      {} as SessionService
    );

    try {
      await service.login('1.2.3.4', { className: 'Kelas Nonaktif', password: 'secret' });
      expect(true).toBe(false);
    } catch (err: unknown) {
      const error = err as { code: string; status: number };
      expect(error.code).toBe('ACCOUNT_DISABLED');
      expect(error.status).toBe(403);
    }
  });

  it('rejects login when password verification fails', async () => {
    const mockRepo = {
      findClassByKey: async () => ({
        id: 'c1',
        name: 'Kelas TAV',
        key: 'kelas tav',
        isActive: true,
        passwordHash: 'hashed_password',
      }),
      createLoginAttempt: async () => {},
    } as unknown as AuthRepository;

    const mockHasher = {
      verify: async () => false,
    } as unknown as Hasher;

    const mockIpBlocker = {
      checkIp: async () => ({ blocked: false, remainingSeconds: 0, failureCount: 0 }),
      recordFailure: async () => ({ blocked: false, remainingSeconds: 0, failureCount: 1 }),
    } as unknown as IpBlockerService;

    const service = new AuthService(
      mockRepo,
      mockHasher,
      {} as TokenService,
      mockIpBlocker,
      {} as SessionService
    );

    try {
      await service.login('1.2.3.4', { className: 'Kelas TAV', password: 'wrong' });
      expect(true).toBe(false);
    } catch (err: unknown) {
      const error = err as { code: string; status: number };
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.status).toBe(401);
    }
  });

  it('successfully logs in and orchestrates session creation', async () => {
    const mockClass = {
      id: 'class-123',
      name: 'Kelas Audio Video',
      key: 'kelas audio video',
      isActive: true,
      passwordHash: 'correct_hash',
    };

    const mockUser = {
      id: 'user-789',
      name: 'Aris Pratama',
      username: 'Aris Pratama',
      role: 'student',
    };

    const mockRepo = {
      findClassByKey: async () => mockClass,
      findStudentInClass: async () => mockUser,
      createLoginAttempt: async () => {},
      upsertStudent: async () => mockUser,
    } as unknown as AuthRepository;

    const mockHasher = {
      verify: async () => true,
    } as unknown as Hasher;

    const mockIpBlocker = {
      checkIp: async () => ({ blocked: false, remainingSeconds: 0, failureCount: 0 }),
      recordSuccess: async () => {},
    } as unknown as IpBlockerService;

    const mockSessionService = {
      createSession: async () => ({
        id: 'sess-1',
        sessionToken: 'better_auth_token_xyz',
        expiresAt: new Date(Date.now() + 3600000),
      }),
    } as unknown as SessionService;

    const mockTokenService = {
      issueTokens: async () => ({
        accessToken: 'jwt_access_abc',
        refreshToken: 'refresh_def',
        expiresIn: 900,
      }),
    } as unknown as TokenService;

    const service = new AuthService(
      mockRepo,
      mockHasher,
      mockTokenService,
      mockIpBlocker,
      mockSessionService
    );

    const result = await service.login('1.2.3.4', {
      className: 'Kelas Audio Video',
      password: 'password_valid',
      username: 'Aris Pratama',
    });

    expect(result.user.id).toBe('user-789');
    expect(result.user.username).toBe('Aris Pratama');
    expect(result.tokens.accessToken).toBe('jwt_access_abc');
    expect(result.tokens.sessionToken).toBe('better_auth_token_xyz');
    expect(result.session?.sessionToken).toBe('better_auth_token_xyz');
  });
});
