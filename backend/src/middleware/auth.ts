import { Context, Next } from 'hono';
import { TokenService } from '../services/tokens';
import { SessionService } from '../services/betterAuth';
import { AppError } from '../shared/errors';

export function requireAuth(tokenService: TokenService, sessionService?: SessionService) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('TOKEN_INVALID', 401, 'Header otorisasi Bearer token diperlukan.');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new AppError('TOKEN_INVALID', 401, 'Token autentikasi tidak ditemukan.');
    }

    // 1. Coba validasi sebagai session token Better Auth terlebih dahulu jika sessionService tersedia
    if (sessionService) {
      const activeSession = await sessionService.validateSession(token);
      if (activeSession) {
        c.set('auth', {
          userId: activeSession.user.id,
          role: (activeSession.user.role as 'student' | 'teacher' | 'admin') || 'student',
          classId: activeSession.user.classId ?? undefined,
        });
        await next();
        return;
      }
    }

    // 2. Fallback ke validasi JWT Access Token
    const payload = await tokenService.verifyAccessToken(token);

    c.set('auth', {
      userId: payload.sub,
      role: (payload.role as 'student' | 'teacher' | 'admin') || 'student',
      classId: payload.classId,
    });

    await next();
  };
}
