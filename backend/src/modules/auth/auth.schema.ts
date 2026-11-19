import { z } from 'zod';

export const loginSchema = z.object({
  className: z
    .string()
    .min(1, 'Nama kelas tidak boleh kosong.')
    .max(50, 'Nama kelas maksimal 50 karakter.'),
  password: z
    .string()
    .min(1, 'Password tidak boleh kosong.')
    .max(100, 'Password maksimal 100 karakter.'),
  username: z
    .string()
    .trim()
    .max(50, 'Nama siswa maksimal 50 karakter.')
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerStudentSchema = z.object({
  className: z
    .string()
    .min(1, 'Nama kelas tidak boleh kosong.')
    .max(50, 'Nama kelas maksimal 50 karakter.'),
  password: z
    .string()
    .min(1, 'Password kelas tidak boleh kosong.')
    .max(100, 'Password kelas maksimal 100 karakter.'),
  username: z
    .string()
    .trim()
    .min(2, 'Nama murid minimal 2 karakter.')
    .max(50, 'Nama murid maksimal 50 karakter.'),
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;

export const registerClassSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama kelas minimal 2 karakter.')
    .max(50, 'Nama kelas maksimal 50 karakter.'),
  password: z
    .string()
    .min(4, 'Password kelas minimal 4 karakter.')
    .max(100, 'Password kelas maksimal 100 karakter.'),
  creatorName: z
    .string()
    .trim()
    .max(50, 'Nama pendaftar maksimal 50 karakter.')
    .optional(),
});

export type RegisterClassInput = z.infer<typeof registerClassSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(10, 'Format refresh token tidak valid.'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
