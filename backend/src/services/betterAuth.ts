import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';
import { PrismaClient } from '../db/client';

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;

export function createBetterAuth(prisma: PrismaClient, secret: string, baseURL = 'http://localhost:3000') {
  return betterAuth({
    baseURL,
    secret,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    session: {
      expiresIn: 30 * 24 * 60 * 60, // 30 days session
      updateAge: 24 * 60 * 60, // 1 day
    },
    plugins: [
      bearer(),
    ],
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'student' },
        classId: { type: 'string', required: false },
        username: { type: 'string', required: false },
        usernameKey: { type: 'string', required: false },
        passwordHash: { type: 'string', required: false },
      },
    },
  });
}

export class SessionService {
  constructor(
    private prisma: PrismaClient,
    private sessionTtlDays = 30
  ) {}

  /**
   * Buat session baru di database yang terintegrasi dengan tabel Session Better Auth
   */
  async createSession(user: { id: string }, ipAddress?: string, userAgent?: string) {
    const rawToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + this.sessionTtlDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: rawToken,
        expiresAt,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      id: session.id,
    };
  }

  /**
   * Validasi session aktif dari database
   */
  async validateSession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      // Session kedaluwarsa, hapus
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    if (!session.user || !session.user.isActive) {
      return null;
    }

    return {
      session,
      user: session.user,
    };
  }

  /**
   * Cabut sesi aktif (logout)
   */
  async revokeSession(token: string): Promise<boolean> {
    try {
      const res = await this.prisma.session.deleteMany({
        where: { token },
      });
      return res.count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Cabut seluruh sesi user (saat ganti password atau force logout)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    }).catch(() => {});
  }
}
