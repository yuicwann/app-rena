import { DEFAULT_API_BASE_URL, API_TIMEOUT_MS } from './config';
import { ApiError, ApiErrorResponse } from './errors';

export interface RequestOptions extends RequestInit {
  baseUrl?: string;
  timeoutMs?: number;
  token?: string;
}

/**
 * HTTP Client terstandarisasi untuk pemanggilan API backend
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    baseUrl = DEFAULT_API_BASE_URL,
    timeoutMs = API_TIMEOUT_MS,
    token,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  // Format base URL dan endpoint agar tidak terjadi double slash
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${cleanBase}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      const errData = responseData as ApiErrorResponse | null;
      const code = errData?.error?.code;
      const message =
        errData?.error?.message || `HTTP ${response.status}: Permintaan gagal diproses.`;
      const details = errData?.error?.details;
      const requestId = errData?.error?.requestId;

      throw new ApiError(message, response.status, code, details, requestId);
    }

    return responseData as T;
  } catch (err: unknown) {
    if (controller.signal.aborted) {
      throw new ApiError(
        'Koneksi ke server timeout (melebihi batas waktu). Periksa koneksi internet Anda.',
        408,
        'TIMEOUT'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

