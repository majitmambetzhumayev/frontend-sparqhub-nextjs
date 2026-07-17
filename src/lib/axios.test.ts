import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosAdapter, AxiosError } from 'axios';
import api, { SESSION_EXPIRED_EVENT } from './axios';

// The response interceptor's own logic (single-flight silent refresh, retry
// the original request, propagate on failure) is what's under test here --
// not real network behavior, so the adapter itself is replaced with a fake
// that inspects each request's url/retry marker and returns a synthetic
// response or a synthetic 401, exactly like the real backend would for a
// short-lived access token.
function makeAxiosError(status: number): AxiosError {
  const error = new Error(`Request failed with status code ${status}`) as AxiosError;
  error.isAxiosError = true;
  error.response = {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {} as never,
  };
  return error;
}

describe('api response interceptor (silent token refresh)', () => {
  let callLog: string[];
  let refreshShouldSucceed: boolean;

  const fakeAdapter: AxiosAdapter = async (config) => {
    callLog.push(`${config.method}:${config.url}`);

    if (config.url === '/api/auth/refresh/') {
      if (refreshShouldSucceed) {
        return { data: {}, status: 200, statusText: '', headers: {}, config };
      }
      const error = makeAxiosError(401);
      error.config = config;
      throw error;
    }

    if (config.url === '/api/protected/' && !('_retriedAfterRefresh' in config)) {
      const error = makeAxiosError(401);
      error.config = config;
      throw error;
    }

    return { data: { ok: true }, status: 200, statusText: '', headers: {}, config };
  };

  beforeEach(() => {
    callLog = [];
    refreshShouldSucceed = true;
    api.defaults.adapter = fakeAdapter;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retries the original request after a successful silent refresh', async () => {
    const response = await api.get('/api/protected/');

    expect(response.data).toEqual({ ok: true });
    expect(callLog).toEqual(['get:/api/protected/', 'post:/api/auth/refresh/', 'get:/api/protected/']);
  });

  it('dispatches a session-expired event and propagates the original error when refresh fails', async () => {
    refreshShouldSucceed = false;
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);

    await expect(api.get('/api/protected/')).rejects.toMatchObject({ response: { status: 401 } });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  });

  it('shares a single refresh call across concurrent 401s', async () => {
    const [a, b] = await Promise.all([api.get('/api/protected/'), api.get('/api/protected/')]);

    expect(a.data).toEqual({ ok: true });
    expect(b.data).toEqual({ ok: true });
    expect(callLog.filter((c) => c === 'post:/api/auth/refresh/')).toHaveLength(1);
  });

  it('does not attempt a refresh for a 401 on the refresh call itself', async () => {
    refreshShouldSucceed = false;

    await expect(api.post('/api/auth/refresh/')).rejects.toMatchObject({ response: { status: 401 } });

    expect(callLog).toEqual(['post:/api/auth/refresh/']);
  });
});
