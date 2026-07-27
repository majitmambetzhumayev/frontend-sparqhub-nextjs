import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import ChangelogMarquee from './ChangelogMarquee';
import type { ChangelogEntry } from '@/types/changelog';

const entries: ChangelogEntry[] = [
  {
    id: 1,
    title_fr: 'Titre un',
    title_en: 'Title one',
    description_fr: 'Description un',
    description_en: 'Description one',
    published_at: '2026-07-17T00:00:00Z',
  },
  {
    id: 2,
    title_fr: 'Titre deux',
    title_en: 'Title two',
    description_fr: 'Description deux',
    description_en: 'Description two',
    published_at: '2026-07-16T00:00:00Z',
  },
];

describe('ChangelogMarquee', () => {
  it('renders nothing when there are no entries', () => {
    render(<ChangelogMarquee entries={[]} locale="en" />);

    expect(screen.queryByRole('button', { name: 'Scroll up' })).not.toBeInTheDocument();
  });

  it('shows the section title', () => {
    render(<ChangelogMarquee entries={entries} locale="en" />);

    expect(screen.getByRole('heading', { name: 'Patch notes' })).toBeInTheDocument();
  });

  it('shows a formatted date for each entry', () => {
    render(<ChangelogMarquee entries={entries} locale="en" />);

    // toLocaleDateString's exact separators/format depend on the runtime's
    // ICU data -- match on the day-of-month digits only, same reasoning as
    // the dashboard's token-count assertions.
    expect(screen.getByText((content) => content.includes('17'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('16'))).toBeInTheDocument();
  });

  it('shows the French fields when locale is fr', () => {
    render(<ChangelogMarquee entries={entries} locale="fr" />);

    expect(screen.getByText('Titre un')).toBeInTheDocument();
    expect(screen.queryByText('Title one')).not.toBeInTheDocument();
  });

  it('shows the English fields when locale is en', () => {
    render(<ChangelogMarquee entries={entries} locale="en" />);

    expect(screen.getByText('Title one')).toBeInTheDocument();
    expect(screen.queryByText('Titre un')).not.toBeInTheDocument();
  });

  it('scrolls the list down and up when the chevron buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<ChangelogMarquee entries={entries} locale="en" />);
    // jsdom doesn't implement scrollBy at all -- stubbed so clicking the
    // buttons doesn't throw; this test only asserts the buttons wire up to
    // it, not real scroll physics.
    const scrollBySpy = vi.fn();
    Element.prototype.scrollBy = scrollBySpy;

    await user.click(screen.getByRole('button', { name: 'Scroll down' }));
    await user.click(screen.getByRole('button', { name: 'Scroll up' }));

    expect(scrollBySpy).toHaveBeenNthCalledWith(1, { top: 120, behavior: 'smooth' });
    expect(scrollBySpy).toHaveBeenNthCalledWith(2, { top: -120, behavior: 'smooth' });
  });
});
