import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://admin:secret123@localhost:5433/myapp?schema=public'),
  JWT_SECRET: z
    .string()
    .min(32)
    .default('development_secret_key_sinyallab_must_be_32_bytes_or_more'),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().default(30),
  CORS_ORIGINS: z.string().default(''),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  ARGON_MEMORY_KIB: z.coerce.number().int().default(19456),
  ARGON_TIME_COST: z.coerce.number().int().default(2),
  HASH_CONCURRENCY: z.coerce.number().int().min(1).default(4),
  ENFORCE_XP_RULES: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_DOCS: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(true),
  DOCS_USER: z.string().min(1).default('admin'),
  DOCS_PASSWORD: z.string().min(6).default('sinyallab-rahasia-2026'),
});

export type Env = z.infer<typeof schema>;

export const loadEnv = (src: Record<string, string | undefined> = process.env): Env =>
  schema.parse(src);
