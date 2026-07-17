import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { useAuth } from '@/context/AuthContext';
import PublicNavbar from './PublicNavbar';

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));

describe('PublicNavbar', () => {
  describe('logged out', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        status: 'unauthenticated',
        login: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });
    });

    it('opens the mobile menu on tap and adds a second copy of each link', async () => {
      const user = userEvent.setup();
      render(<PublicNavbar />);

      // jsdom doesn't evaluate the "hidden md:flex" media query, so the
      // always-rendered desktop link list is present in the DOM from the
      // start — only the mobile panel itself is conditionally rendered.
      // A second "Login" link appearing is what proves the mobile panel
      // mounted, not just presence/absence of the text.
      expect(screen.getAllByRole('link', { name: 'Login' })).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: 'Open menu' }));

      expect(screen.getAllByRole('link', { name: 'Login' })).toHaveLength(2);
      expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    });

    it('closes the mobile menu after tapping a link', async () => {
      const user = userEvent.setup();
      render(<PublicNavbar />);

      await user.click(screen.getByRole('button', { name: 'Open menu' }));
      // The mobile panel's own "About" link, distinguishable by being the
      // last one rendered (desktop list first, then the mobile panel).
      const aboutLinks = screen.getAllByRole('link', { name: 'About' });
      await user.click(aboutLinks[aboutLinks.length - 1]);

      expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    });
  });

  describe('logged in', () => {
    it('shows a dashboard link and a logout button instead of login/register', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 1, username: 'alice', credits_remaining: 100, profile_picture: null, is_staff: false, has_seen_onboarding: true },
        status: 'authenticated',
        login: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });
      const user = userEvent.setup();
      render(<PublicNavbar />);

      await user.click(screen.getByRole('button', { name: 'Open menu' }));

      expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: 'Logout' }).length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
    });
  });
});
