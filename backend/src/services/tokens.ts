import { sign, verify } from 'hono/jwt';
import { PrismaClient } from '../db/client';
import { AppError } from '../shared/errors';

export interface TokenPayload {
  [key: string]: unknown;
  sub: string;
  role: string;
  classId?: string;
  className?: string;
  username?: string;
  exp: number;
  iat: number;
}

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenService {
  constructor(
    private jwtSecret: string,
    private accessTokenTtlSec: number,
    private refreshTokenTtlDays: number,
    private prisma: PrismaClient
  ) {}

  async issueTokens(user: {
    id: string;
    role: string;
    classId?: string | null;
    className?: string;
    username?: string;
  }): Promise<SessionResult> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.accessTokenTtlSec;

    // 1. Issue Access Token
    const payload: TokenPayload = {
      sub: user.id,
      role: user.role,
      classId: user.classId ?? undefined,
      className: user.className,
      username: user.username,
      iat: now,
      exp,
    };

    const accessToken = await sign(payload, this.jwtSecret, 'HS256');

    // 2. Issue Opaque Refresh Token
    const rawRefreshToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const familyId = crypto.randomUUID();
    const tokenHash = await this.hashToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.accessTokenTtlSec,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = (await verify(token, this.jwtSecret, 'HS256')) as unknown as TokenPayload;
      return payload;
    } catch {
      throw new AppError('TOKEN_INVALID', 401, 'Token autentikasi tidak valid atau telah kedaluwarsa.');
    }
  }

  async rotateRefreshToken(rawToken: string): Promise<SessionResult> {
    const tokenHash = await this.hashToken(rawToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new AppError('TOKEN_INVALID', 401, 'Refresh token tidak valid.');
    }

    // Reuse detection: jika sudah pernah digunakan, cabut semua token dalam family ini
    if (tokenRecord.usedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { revokedAt: new Date() },
      });
      throw new AppError('REFRESH_REUSED', 401, 'Terdeteksi penggunaan ulang refresh token. Sesi telah dicabut.');
    }

    // Cek apakah sudah dicabut atau kedaluwarsa
    if (tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new AppError('TOKEN_EXPIRED', 401, 'Refresh token telah kedaluwarsa atau dicabut.');
    }

    // Cek apakah user aktif
    if (!tokenRecord.user || !tokenRecord.user.isActive) {
      throw new AppError('ACCOUNT_DISABLED', 403, 'Akun pengguna tidak aktif.');
    }

    // Tandai token ini sebagai used
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    // Terbitkan token baru dalam family yang sama
    const rawNewRefreshToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const newTokenHash = await this.hashToken(rawNewRefreshToken);
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        familyId: tokenRecord.familyId,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.accessTokenTtlSec;

    const payload: TokenPayload = {
      sub: tokenRecord.user.id,
      role: tokenRecord.user.role,
      classId: tokenRecord.user.classId ?? undefined,
      className: tokenRecord.user.class?.name,
      username: tokenRecord.user.username ?? tokenRecord.user.name,
      iat: now,
      exp,
    };

    const accessToken = await sign(payload, this.jwtSecret, 'HS256');

    return {
      accessToken,
      refreshToken: rawNewRefreshToken,
      expiresIn: this.accessTokenTtlSec,
    };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = await this.hashToken(rawToken);
    try {
      await this.prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Abaikan jika tidak ditemukan
    }
  }

  private async hashToken(token: string): Promise<string> {
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(token);
    return hasher.digest('hex');
  }
}
