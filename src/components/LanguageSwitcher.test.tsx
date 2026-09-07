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
  it('shows the current locale on the trigger and keeps the menu closed', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByRole('button', { name: /en/i })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens on click and marks the current locale as selected', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /en/i }));

    expect(screen.getByRole('option', { name: /english/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /français/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches to the other locale, staying on the same path, and closes the menu', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /en/i }));
    await user.click(screen.getByRole('option', { name: /français/i }));

    expect(mockReplace).toHaveBeenCalledWith('/dashboard', { locale: 'fr' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes without switching when the current locale is clicked again', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /en/i }));
    await user.click(screen.getByRole('option', { name: /english/i }));

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
