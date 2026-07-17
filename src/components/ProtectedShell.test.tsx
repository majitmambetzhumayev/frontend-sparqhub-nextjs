import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { useAuth } from '@/context/AuthContext';
import { HeaderContentProvider } from '@/context/HeaderContentContext';
import { MobileMenuProvider } from '@/context/MobileMenuContext';
import ProtectedSidebar from './ProtectedSidebar';
import ProtectedTopbar from './ProtectedTopbar';

// ProtectedSidebar and ProtectedTopbar only coordinate through
// MobileMenuContext (they're siblings in (app)/layout.tsx, not nested) --
// a real integration test needs both mounted together under a real
// provider, not a shallow render of either one alone.
function renderShell() {
  return render(
    <HeaderContentProvider>
      <MobileMenuProvider>
        <ProtectedTopbar />
        <ProtectedSidebar />
      </MobileMenuProvider>
    </HeaderContentProvider>,
  );
}

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));

describe('protected shell mobile menu (ProtectedTopbar + ProtectedSidebar)', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, username: 'alice', credits_remaining: 42, profile_picture: null, is_staff: false, has_seen_onboarding: true },
      status: 'authenticated',
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('opens the drawer from the topbar hamburger, showing nav items and credits', async () => {
    const user = userEvent.setup();
    renderShell();

    // The mobile drawer isn't rendered at all until opened (unlike
    // PublicNavbar's CSS-hidden desktop list, ProtectedSidebar's mobile
    // drawer is conditionally mounted -- see its isOpen check).
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    // Two "Close menu" buttons: the full-screen backdrop and the explicit
    // X icon, both dismiss the drawer -- see the second test.
    expect(screen.getAllByRole('button', { name: 'Close menu' })).toHaveLength(2);
    // Two "Conversations" links now exist: the always-mounted desktop
    // sidebar's, and the drawer's -- proves the drawer's own nav rendered.
    expect(screen.getAllByRole('link', { name: 'Conversations' })).toHaveLength(2);
    // Two copies of the credits pill exist too: the desktop topbar's
    // (CSS-hidden on mobile, still in the DOM) and the drawer's own.
    expect(screen.getAllByText('42 credits')).toHaveLength(2);
  });

  it('closes the drawer when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getAllByRole('button', { name: 'Close menu' })).toHaveLength(2);

    // The backdrop is the first "Close menu" labeled element (a full-screen
    // button behind the drawer panel) -- clicking it must close the drawer
    // just like the explicit X button does.
    await user.click(screen.getAllByRole('button', { name: 'Close menu' })[0]);

    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument();
  });

  it('does not show the hamburger or drawer content for staff-only nav when the user is not staff', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });
});
