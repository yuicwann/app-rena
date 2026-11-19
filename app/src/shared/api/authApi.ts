import { apiClient } from './client';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  class?: {
    id: string;
    name: string;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionToken?: string;
}

export interface LoginPayload {
  className: string;
  password: string;
  username?: string;
}

export interface LoginResponseData {
  user: AuthUser;
  tokens: AuthTokens;
  session?: {
    id: string;
    sessionToken: string;
    expiresAt: string;
  };
}

export interface RegisterStudentPayload {
  className: string;
  password: string;
  username: string;
}

export interface RegisterClassPayload {
  name: string;
  password: string;
  creatorName?: string;
}

export interface RegisterClassResponseData {
  id: string;
  name: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  status: 'success';
  data: T;
  message?: string;
}

/**
 * Modul pemanggilan API autentikasi & sesi
 */
export const authApi = {
  /**
   * Endpoint Login: POST /v1/auth/login
   */
  async login(payload: LoginPayload, baseUrl?: string): Promise<LoginResponseData> {
    const res = await apiClient<ApiResponse<LoginResponseData>>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        className: payload.className.trim(),
        password: payload.password,
        username: payload.username?.trim() || undefined,
      }),
      baseUrl,
    });

    return res.data;
  },

  /**
   * Endpoint Pendaftaran Murid Baru: POST /v1/auth/register-student
   */
  async registerStudent(
    payload: RegisterStudentPayload,
    baseUrl?: string
  ): Promise<LoginResponseData> {
    const res = await apiClient<ApiResponse<LoginResponseData>>('/v1/auth/register-student', {
      method: 'POST',
      body: JSON.stringify({
        className: payload.className.trim(),
        password: payload.password,
        username: payload.username.trim(),
      }),
      baseUrl,
    });

    return res.data;
  },

  /**
   * Endpoint Pendaftaran Kelas: POST /v1/auth/classes
   */
  async registerClass(
    payload: RegisterClassPayload,
    baseUrl?: string
  ): Promise<RegisterClassResponseData> {
    const res = await apiClient<ApiResponse<RegisterClassResponseData>>('/v1/auth/classes', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name.trim(),
        password: payload.password,
        creatorName: payload.creatorName?.trim() || undefined,
      }),
      baseUrl,
    });

    return res.data;
  },

  /**
   * Endpoint Daftar Kelas: GET /v1/auth/classes
   */
  async getClasses(baseUrl?: string): Promise<{ id: string; name: string }[]> {
    try {
      const res = await apiClient<ApiResponse<{ classes: { id: string; name: string }[] }>>(
        '/v1/auth/classes',
        {
          method: 'GET',
          baseUrl,
        }
      );
      return res.data?.classes || [];
    } catch {
      return [];
    }
  },

  /**
   * Endpoint Logout: POST /v1/auth/logout
   */
  async logout(
    params: { refreshToken?: string; sessionToken?: string },
    baseUrl?: string
  ): Promise<void> {
    await apiClient('/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify(params),
      token: params.sessionToken,
      baseUrl,
    }).catch(() => {
      // Best-effort logout, abaikan kegagalan jaringan
    });
  },

  /**
   * Endpoint Profil Sesi Saat Ini: GET /v1/auth/me
   */
  async getMe(token: string, baseUrl?: string): Promise<{ user: AuthUser }> {
    const res = await apiClient<ApiResponse<{ user: AuthUser }>>('/v1/auth/me', {
      method: 'GET',
      token,
      baseUrl,
    });

    return res.data;
  },
};
