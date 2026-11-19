import { Env } from './env';
import { createLogger, Logger } from './shared/logger';
import { systemClock, Clock } from './shared/clock';
import { getPrismaClient, PrismaClient } from './db/client';
import { BunHasher, Hasher } from './services/hasher';
import { IpBlockerService } from './services/ipBlocker';
import { TokenService } from './services/tokens';
import { createBetterAuth, BetterAuthInstance, SessionService } from './services/betterAuth';
import { AuthRepository } from './modules/auth/auth.repository';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { ProgressRepository } from './modules/progress/progress.repository';
import { ProgressService } from './modules/progress/progress.service';
import { ProgressController } from './modules/progress/progress.controller';

export interface Deps {
  env: Env;
  logger: Logger;
  clock: Clock;
  prisma: PrismaClient;
  hasher: Hasher;
  ipBlocker: IpBlockerService;
  tokenService: TokenService;
  sessionService: SessionService;
  betterAuth: BetterAuthInstance;
  authRepo: AuthRepository;
  authService: AuthService;
  authController: AuthController;
  progressRepo: ProgressRepository;
  progressService: ProgressService;
  progressController: ProgressController;
}

export async function buildDeps(env: Env): Promise<Deps> {
  const logger = createLogger(env.LOG_LEVEL);
  const clock = systemClock;
  const prisma = getPrismaClient();
  const hasher = new BunHasher();
  const ipBlocker = new IpBlockerService(prisma);
  const tokenService = new TokenService(
    env.JWT_SECRET,
    env.ACCESS_TOKEN_TTL_SEC,
    env.REFRESH_TOKEN_TTL_DAYS,
    prisma
  );
  const sessionService = new SessionService(prisma, env.REFRESH_TOKEN_TTL_DAYS);
  const betterAuth = createBetterAuth(prisma, env.JWT_SECRET, `http://localhost:${env.PORT}`);

  // Composition Root: Layered Architecture Wiring
  const authRepo = new AuthRepository(prisma);
  const authService = new AuthService(authRepo, hasher, tokenService, ipBlocker, sessionService);
  const authController = new AuthController(authService, ipBlocker, sessionService);

  const progressRepo = new ProgressRepository(prisma);
  const progressService = new ProgressService(progressRepo);
  const progressController = new ProgressController(progressService);

  return {
    env,
    logger,
    clock,
    prisma,
    hasher,
    ipBlocker,
    tokenService,
    sessionService,
    betterAuth,
    authRepo,
    authService,
    authController,
    progressRepo,
    progressService,
    progressController,
  };
}
