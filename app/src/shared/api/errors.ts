export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
    requestId?: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Menerjemahkan error HTTP / Network menjadi pesan yang ramah untuk pengguna
 */
export function getApiErrorMessage(error: unknown, baseUrl?: string): string {
  if (error instanceof ApiError) {
    if (error.code === 'TIMEOUT' || error.status === 408) {
      return 'Koneksi ke server timeout (melebihi batas waktu). Periksa koneksi internet Anda.';
    }
    if (error.code === 'INVALID_CREDENTIALS' || error.status === 401) {
      return error.message || 'Nama kelas, nama murid, atau password salah. Silakan periksa kembali.';
    }
    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Terlalu banyak percobaan login yang gagal. IP Anda diblokir sementara selama 5 menit untuk keamanan.';
    }
    if (error.code === 'ACCOUNT_DISABLED' || error.status === 403) {
      return 'Akun atau kelas ini telah dinonaktifkan. Silakan gunakan Mode Tamu.';
    }
    if (error.code === 'CONFLICT' || error.status === 409) {
      return error.message || 'Kelas dengan nama tersebut sudah terdaftar.';
    }
    if (error.code === 'VALIDATION_FAILED' || error.status === 422) {
      return error.message || 'Data yang dimasukkan tidak valid. Periksa kembali form isian.';
    }
    if (error.status >= 500) {
      return 'Server sedang mengalami gangguan atau dalam pemeliharaan. Silakan coba lagi nanti atau gunakan Mode Tamu.';
    }

    return error.message || 'Terjadi kesalahan saat menghubungi server.';
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (error.name === 'AbortError' || msg.includes('abort') || msg.includes('cancel')) {
      return 'Koneksi ke server timeout atau dibatalkan. Periksa koneksi internet Anda dan coba lagi.';
    }
    if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('econnrefused')) {
      const serverText = baseUrl ? ` (${baseUrl})` : ' (https://backend.hayyu.online)';
      return `Gagal terhubung ke server${serverText}. Periksa koneksi internet atau gunakan Mode Tamu.`;
    }
    return error.message;
  }

  return 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
}
