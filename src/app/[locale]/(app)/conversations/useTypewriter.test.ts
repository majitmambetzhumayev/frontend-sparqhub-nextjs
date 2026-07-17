import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTypewriter } from './useTypewriter';

describe('useTypewriter', () => {
  it('starts empty rather than dumping the full text synchronously', () => {
    const { result } = renderHook(() => useTypewriter('Hello there, this is a longer reply.'));

    expect(result.current).toBe('');
  });

  it('eventually reveals the full text', async () => {
    const { result } = renderHook(() => useTypewriter('Hello there, this is a longer reply.'));

    await waitFor(() => expect(result.current).toBe('Hello there, this is a longer reply.'));
  });

  it('keeps up as the target text grows across multiple chunks, without ever going backwards', async () => {
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text), {
      initialProps: { text: 'First chunk. ' },
    });

    await waitFor(() => expect(result.current).toBe('First chunk. '));

    rerender({ text: 'First chunk. Second chunk.' });

    await waitFor(() => expect(result.current).toBe('First chunk. Second chunk.'));
  });

  it('snaps instead of animating backwards when a new turn starts (target text shrinks)', async () => {
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text), {
      initialProps: { text: 'A fairly long streamed sentence from the previous turn.' },
    });

    await waitFor(() =>
      expect(result.current).toBe('A fairly long streamed sentence from the previous turn.'),
    );

    // streamingText resets to '' between turns (see useConversationSocket's
    // reducer) -- this must snap immediately, not "type backwards".
    rerender({ text: '' });

    expect(result.current).toBe('');
  });
});
