export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(data: Record<string, unknown> | string, msg?: string): void;
  info(data: Record<string, unknown> | string, msg?: string): void;
  warn(data: Record<string, unknown> | string, msg?: string): void;
  error(data: Record<string, unknown> | string, msg?: string): void;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function createLogger(minLevel: LogLevel = 'info'): Logger {
  const minWeight = LEVEL_WEIGHT[minLevel];

  const log = (level: LogLevel, data: Record<string, unknown> | string, msg?: string) => {
    if (LEVEL_WEIGHT[level] < minWeight) return;

    const payload: Record<string, unknown> =
      typeof data === 'string'
        ? { time: new Date().toISOString(), level, msg: data }
        : { time: new Date().toISOString(), level, msg, ...data };

    // Redact sensitive keys if present
    if (payload.password) payload.password = '[REDACTED]';
    if (payload.newPassword) payload.newPassword = '[REDACTED]';
    if (payload.refreshToken) payload.refreshToken = '[REDACTED]';

    console.log(JSON.stringify(payload));
  };

  return {
    debug: (d, m) => log('debug', d, m),
    info: (d, m) => log('info', d, m),
    warn: (d, m) => log('warn', d, m),
    error: (d, m) => log('error', d, m),
  };
}
