// no RN-specific platform usage here

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions {
  baseURL: string;
  getToken?: () => Promise<string | null> | string | null;
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(public status: number, public data: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
  }
}

export const createApiClient = (opts: ApiClientOptions) => {
  const timeoutMs = opts.timeoutMs ?? 15000;

  const request = async <T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const token = typeof opts.getToken === 'function' ? await opts.getToken() : opts.getToken ?? null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${opts.baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    }).catch((err) => {
      clearTimeout(id);
      throw new Error(`Network error: ${String(err)}`);
    });
    clearTimeout(id);

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new ApiError(res.status, data, data?.message ?? res.statusText);
    }
    return data as T;
  };

  return {
    get: <T>(p: string) => request<T>(p, 'GET'),
    post: <T>(p: string, b: unknown) => request<T>(p, 'POST', b),
    put:  <T>(p: string, b: unknown) => request<T>(p, 'PUT', b),
    patch:<T>(p: string, b: unknown) => request<T>(p, 'PATCH', b),
    delete:<T>(p: string) => request<T>(p, 'DELETE'),
  };
};
