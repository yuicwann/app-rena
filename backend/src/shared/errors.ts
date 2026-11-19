export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'LOGIN_LOCKED'
  | 'RATE_LIMITED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'REFRESH_REUSED'
  | 'ACCOUNT_DISABLED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Factory functions untuk error yang berulang (DRY & terpusat)
export const rateLimitedError = (
  retryAfter: number,
  message = 'Terlalu banyak percobaan tidak wajar. IP Anda diblokir sementara selama 5 menit.'
) =>
  new AppError('RATE_LIMITED', 429, message, { retryAfter });

export const invalidCredentialsError = (message = 'Nama kelas atau password salah.') =>
  new AppError('INVALID_CREDENTIALS', 401, message);

export const accountDisabledError = (message = 'Kelas ini telah dinonaktifkan.') =>
  new AppError('ACCOUNT_DISABLED', 403, message);

export const conflictError = (message: string) =>
  new AppError('CONFLICT', 409, message);

export const validationFailedError = (details: unknown, message = 'Format input tidak valid.') =>
  new AppError('VALIDATION_FAILED', 422, message, details);

export const tokenInvalidError = (message = 'Token autentikasi tidak valid atau telah kedaluwarsa.') =>
  new AppError('TOKEN_INVALID', 401, message);

export const refreshReusedError = (
  message = 'Terdeteksi penggunaan ulang refresh token. Sesi telah dicabut.'
) => new AppError('REFRESH_REUSED', 401, message);

