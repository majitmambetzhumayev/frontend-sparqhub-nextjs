import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import ChatWindow from './ChatWindow';

describe('ChatWindow', () => {
  it('shows the empty state when there is nothing to display', () => {
    render(<ChatWindow messages={[]} />);

    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
  });

  it('renders user and assistant messages in order', () => {
    render(
      <ChatWindow
        messages={[
          { sender: 'user', content: 'What is pgvector?' },
          { sender: 'assistant', content: 'It is a Postgres extension.' },
        ]}
      />,
    );

    expect(screen.getByText('What is pgvector?')).toBeInTheDocument();
    expect(screen.getByText('It is a Postgres extension.')).toBeInTheDocument();
  });

  it('marks a stopped assistant message as interrupted', () => {
    render(
      <ChatWindow messages={[{ sender: 'assistant', content: 'Partial answer', stopped: true }]} />,
    );

    expect(screen.getByText('Interrupted')).toBeInTheDocument();
  });

  it('shows the "thinking" activity indicator while waiting, with no streamed text yet', () => {
    render(<ChatWindow messages={[]} status="thinking" />);

    expect(screen.getByText('Thinking…')).toBeInTheDocument();
  });

  it('hides the activity indicator once streamed text starts arriving', async () => {
    render(<ChatWindow messages={[]} status="streaming" streamingText="Here is the an" />);

    expect(screen.queryByText('Thinking…')).not.toBeInTheDocument();
    // The typewriter effect (useTypewriter) reveals streamingText
    // progressively via requestAnimationFrame rather than all at once --
    // findByText polls until the full text has caught up.
    expect(await screen.findByText('Here is the an')).toBeInTheDocument();
  });

  it('shows which tool is active during a tool call', () => {
    render(<ChatWindow messages={[]} status="tool_call" activeTool="search_project_files" />);

    expect(screen.getByText('Using tool: search_project_files…')).toBeInTheDocument();
  });

  it('lets the user confirm or cancel a pending tool confirmation', async () => {
    const user = userEvent.setup();
    const onConfirmTool = vi.fn();
    const onCancelTool = vi.fn();

    render(
      <ChatWindow
        messages={[]}
        status="confirm_required"
        pendingConfirmation={{ tool: 'delegate_to_model', arguments: { provider: 'gemini' }, threadId: 1 }}
        onConfirmTool={onConfirmTool}
        onCancelTool={onCancelTool}
      />,
    );

    expect(screen.getByText('Wants to use: Delegate to another model')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirmTool).toHaveBeenCalledTimes(1);
    expect(onCancelTool).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancelTool).toHaveBeenCalledTimes(1);
  });
});
