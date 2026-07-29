import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@/test/test-utils';
import { AuthProvider, useAuth } from './AuthContext';

// AuthContext imports useRouter/useParams from next/navigation directly
// (not @/i18n/navigation) -- overriding the global setup.tsx mock here so
// router.replace assertions check the SAME mock instance the component
// actually calls, not a fresh vi.fn() per useRouter() call.
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ locale: 'en' }),
}));

const mockGet = vi.fn();
vi.mock('@/lib/axios', () => ({
  __esModule: true,
  default: { get: (...args: unknown[]) => mockGet(...args) },
  SESSION_EXPIRED_EVENT: 'auth:session-expired',
}));

function StatusProbe() {
  const { status } = useAuth();
  return <div>{status}</div>;
}

describe('AuthContext session-expired handling', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockGet.mockReset();
  });

  it('does not redirect an anonymous visitor whose initial /api/auth/me/ 401 also fails silent refresh', async () => {
    // Mirrors what actually happens on a hard navigation to a public page
    // with no cookies at all: init()'s /api/auth/me/ call 401s, the axios
    // interceptor's silent-refresh retry 401s too, and lib/axios.ts
    // dispatches SESSION_EXPIRED_EVENT -- there was never a session here,
    // so this must not bounce the visitor to /login.
    mockGet.mockRejectedValue(new Error('401'));
    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );
    await screen.findByText('unauthenticated');

    act(() => {
      window.dispatchEvent(new Event('auth:session-expired'));
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to login when a real, live session expires mid-use', async () => {
    mockGet.mockResolvedValue({
      data: {
        user: {
          id: 1, username: 'alice', credits_remaining: 10,
          profile_picture: null, is_staff: false, has_seen_onboarding: true,
        },
      },
    });
    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );
    await screen.findByText('authenticated');

    act(() => {
      window.dispatchEvent(new Event('auth:session-expired'));
    });

    expect(mockReplace).toHaveBeenCalledWith('/en/auth/login');
  });
});
