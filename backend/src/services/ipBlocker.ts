import { PrismaClient } from '../db/client';

export interface IpBlockCheckResult {
  blocked: boolean;
  remainingSeconds: number;
}

export class IpBlockerService {
  private inMemoryBlocks = new Map<string, number>(); // IP -> timestamp when block expires
  private attemptHistory = new Map<string, number[]>(); // IP -> array of failure timestamps
  private readonly blockDurationMs = 5 * 60 * 1000; // 5 minutes
  private readonly maxFailures = 5; // 5 failed attempts
  private readonly failureWindowMs = 15 * 60 * 1000; // 15 minutes window

  constructor(private prisma?: PrismaClient) {}

  /**
   * Check if an IP address is currently blocked
   */
  async checkIp(ip: string): Promise<IpBlockCheckResult> {
    const now = Date.now();

    // 1. Check in-memory first for ultra-fast response
    const memExpiry = this.inMemoryBlocks.get(ip);
    if (memExpiry && memExpiry > now) {
      const remainingSeconds = Math.ceil((memExpiry - now) / 1000);
      return { blocked: true, remainingSeconds };
    } else if (memExpiry && memExpiry <= now) {
      this.inMemoryBlocks.delete(ip);
    }

    // 2. Check DB if prisma client is available
    if (this.prisma) {
      try {
        const record = await this.prisma.blockedIp.findUnique({
          where: { ip },
        });

        if (record && record.blockedUntil.getTime() > now) {
          const remainingSeconds = Math.ceil((record.blockedUntil.getTime() - now) / 1000);
          this.inMemoryBlocks.set(ip, record.blockedUntil.getTime());
          return { blocked: true, remainingSeconds };
        } else if (record && record.blockedUntil.getTime() <= now) {
          // Clean up expired block in background
          this.prisma.blockedIp.delete({ where: { ip } }).catch(() => {});
        }
      } catch {
        // Fallback to memory on DB error
      }
    }

    return { blocked: false, remainingSeconds: 0 };
  }

  /**
   * Record a failed/suspicious attempt. If threshold exceeded, blocks the IP for 5 minutes.
   */
  async recordFailure(
    ip: string,
    reason: string = 'Terlalu banyak percobaan login gagal'
  ): Promise<{ blocked: boolean; remainingSeconds: number }> {
    const now = Date.now();
    const attempts = this.attemptHistory.get(ip) ?? [];

    // Filter attempts within the window
    const recentAttempts = attempts.filter((t) => now - t < this.failureWindowMs);
    recentAttempts.push(now);
    this.attemptHistory.set(ip, recentAttempts);

    if (recentAttempts.length >= this.maxFailures) {
      const blockedUntilDate = new Date(now + this.blockDurationMs);
      this.inMemoryBlocks.set(ip, blockedUntilDate.getTime());
      this.attemptHistory.delete(ip); // reset attempts after blocking

      // Persist to database if available
      if (this.prisma) {
        try {
          await this.prisma.blockedIp.upsert({
            where: { ip },
            create: {
              ip,
              reason,
              blockedUntil: blockedUntilDate,
            },
            update: {
              reason,
              blockedUntil: blockedUntilDate,
            },
          });
        } catch {
          // Ignore write error
        }
      }

      return {
        blocked: true,
        remainingSeconds: Math.ceil(this.blockDurationMs / 1000),
      };
    }

    return { blocked: false, remainingSeconds: 0 };
  }

  /**
   * Record successful action from IP, clearing recent failure history
   */
  async recordSuccess(ip: string): Promise<void> {
    this.attemptHistory.delete(ip);
  }

  /**
   * Reset block for testing / admin unblock
   */
  async unblockIp(ip: string): Promise<void> {
    this.inMemoryBlocks.delete(ip);
    this.attemptHistory.delete(ip);
    if (this.prisma) {
      try {
        await this.prisma.blockedIp.delete({ where: { ip } });
      } catch {
        // Ignore if not in DB
      }
    }
  }

  /**
   * Clear all memory (for tests)
   */
  clearAll(): void {
    this.inMemoryBlocks.clear();
    this.attemptHistory.clear();
  }
}
