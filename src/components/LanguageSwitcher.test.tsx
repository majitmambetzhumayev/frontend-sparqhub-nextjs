import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import LanguageSwitcher from './LanguageSwitcher';

// A fresh synthetic mock (not the global one in src/test/setup.tsx, and not
// vi.importActual -- next-intl's createNavigation transitively imports
// next/navigation, which Vitest can't resolve through node_modules
// externalization, see setup.tsx's own comment on the same gotcha).
// mockReplace is named with the `mock` prefix Vitest requires to allow
// referencing an outer variable from inside a hoisted vi.mock() factory.
const mockReplace = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: mockReplace }),
}));

describe('LanguageSwitcher', () => {
  it('marks the current locale (en, from the test provider) as active and not clickable', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByRole('button', { name: 'EN' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'FR' })).not.toBeDisabled();
  });

  it('switches to the other locale, staying on the same path', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: 'FR' }));

    expect(mockReplace).toHaveBeenCalledWith('/dashboard', { locale: 'fr' });
  });
});
