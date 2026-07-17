// src/lib/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: { 'Content-Type': 'application/json' },
});

// Read csrftoken cookie & attach X-CSRFToken header on every write
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  if (method && method !== 'get' && config.headers) {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='));
    if (match) {
      config.headers['X-CSRFToken'] = match.split('=')[1];
    }
  }
  return config;
});

// access_token is short-lived (15 min) by design; without this, every
// request made after it expires just fails with a raw 401 even though the
// refresh_token cookie (1 day) is still good. On a 401, attempt exactly one
// silent refresh and retry the original request. Concurrent 401s (several
// queries firing around the same moment the token expires) share the same
// in-flight refresh instead of each firing their own.
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean;
}

const REFRESH_URL = '/api/auth/refresh/';
// AuthContext listens for this to clear its user/status client-side -- this
// module has no React context to update directly, and importing AuthContext
// here would create a dependency cycle (AuthContext already imports `api`).
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

let refreshPromise: Promise<void> | null = null;

function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post(REFRESH_URL)
      .then(() => undefined)
      .catch((err: unknown) => {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isRefreshCall = config?.url?.includes(REFRESH_URL) ?? false;

    if (error.response?.status === 401 && config && !config._retriedAfterRefresh && !isRefreshCall) {
      config._retriedAfterRefresh = true;
      try {
        await refreshAccessToken();
        return api(config);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
