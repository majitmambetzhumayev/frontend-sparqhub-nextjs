import { describe, expect, it } from 'vitest';
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
    // AllProviders always renders a (currently empty) toast portal, so the
    // container itself isn't literally empty -- assert on the marquee's
    // own wrapper being absent instead.
    const { container } = render(<ChangelogMarquee entries={[]} locale="en" />);

    expect(container.querySelector('.animate-marquee-vertical')).not.toBeInTheDocument();
  });

  it('shows the French fields when locale is fr', () => {
    render(<ChangelogMarquee entries={entries} locale="fr" />);

    expect(screen.getAllByText('Titre un').length).toBeGreaterThan(0);
    expect(screen.queryByText('Title one')).not.toBeInTheDocument();
  });

  it('shows the English fields when locale is en', () => {
    render(<ChangelogMarquee entries={entries} locale="en" />);

    expect(screen.getAllByText('Title one').length).toBeGreaterThan(0);
    expect(screen.queryByText('Titre un')).not.toBeInTheDocument();
  });

  it('duplicates the entries so the loop animation has a seamless second half', () => {
    render(<ChangelogMarquee entries={entries} locale="en" />);

    expect(screen.getAllByText('Title one')).toHaveLength(2);
    expect(screen.getAllByText('Title two')).toHaveLength(2);
  });
});
