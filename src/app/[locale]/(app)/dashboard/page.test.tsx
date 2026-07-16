import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import DashboardPage from './page';
import type { ThreadListItem } from '@/types/thread';
import type { Project } from '@/types/project';
import type { UsageSummary } from '@/types/usage';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));

const mockUser = { id: 1, username: 'alice', credits_remaining: 100, profile_picture: null, is_staff: false };

const thread: ThreadListItem = {
  id: 7,
  title: 'Discussing pgvector',
  ai_provider: 'anthropic',
  model: 'claude-sonnet-5',
  project: null,
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-15T00:00:00Z',
};

const project: Project = {
  id: 3,
  name: 'SparqHub',
  description: 'The main project',
  thread_count: 4,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-07-10T00:00:00Z',
};

const usage: UsageSummary = { input_tokens: 12345, output_tokens: 6789 };

function mockApiGet({
  threads = [],
  projects = [],
  usageSummary = { input_tokens: 0, output_tokens: 0 },
}: {
  threads?: ThreadListItem[];
  projects?: Project[];
  usageSummary?: UsageSummary;
} = {}) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/api/threads/') return Promise.resolve({ data: threads });
    if (url === '/api/projects/') return Promise.resolve({ data: projects });
    if (url === '/api/usage/summary/') return Promise.resolve({ data: usageSummary });
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      status: 'authenticated',
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('greets the user by name', async () => {
    mockApiGet();
    render(<DashboardPage />);

    expect(await screen.findByText('Welcome back, alice')).toBeInTheDocument();
  });

  it('shows the recent conversations and projects once loaded', async () => {
    mockApiGet({ threads: [thread], projects: [project] });
    render(<DashboardPage />);

    expect(await screen.findByText('Discussing pgvector')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Discussing pgvector/ })).toHaveAttribute(
      'href',
      '/conversations/7',
    );
    expect(screen.getByText('SparqHub')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /SparqHub/ })).toHaveAttribute('href', '/projects/3');
  });

  it('shows empty states for a fresh account with no conversations or projects', async () => {
    mockApiGet();
    render(<DashboardPage />);

    expect(await screen.findByText('No conversations yet. Start a new chat.')).toBeInTheDocument();
    expect(screen.getByText('No projects yet.')).toBeInTheDocument();
  });

  it('shows total token usage', async () => {
    // toLocaleString()'s thousands separator depends on the runtime's
    // default locale (not the app's own next-intl locale) -- comma in one
    // environment, a space in another. Match on the digits only so this
    // test doesn't depend on which locale the test runner happens to use.
    const matchesDigits = (expected: string) => (content: string) =>
      content.replace(/[^\d]/g, '') === expected;

    mockApiGet({ usageSummary: usage });
    render(<DashboardPage />);

    expect(await screen.findByText(matchesDigits('12345'))).toBeInTheDocument();
    expect(screen.getByText(matchesDigits('6789'))).toBeInTheDocument();
  });

  it('links the quick actions to the right destinations', async () => {
    mockApiGet();
    render(<DashboardPage />);

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/threads/'));

    expect(screen.getByRole('link', { name: 'New conversation' })).toHaveAttribute(
      'href',
      '/conversations/new',
    );
    expect(screen.getByRole('link', { name: 'New project' })).toHaveAttribute('href', '/projects');
  });
});
