'use client';

import { useEffect, useRef, useState } from 'react';

// Reveals `targetText` progressively instead of dumping each chunk on
// arrival (choppy -- chunk boundaries are irregular in both size and
// timing) or waiting for the whole turn to render at once (slow-feeling on
// a long reply). Reveal speed scales with how far the display has fallen
// behind the actual streamed text: a burst of chunks arriving close
// together (a growing backlog) catches up quickly; a steady trickle of
// small chunks types at a natural, un-rushed pace. Self-correcting rather
// than a fixed cadence, so it can never drift arbitrarily far behind
// regardless of how bursty the underlying chunk arrival is.
const BASE_CHARS_PER_SECOND = 40;
const BACKLOG_CATCH_UP_FACTOR = 6;

export function useTypewriter(targetText: string): string {
  const [displayed, setDisplayed] = useState('');
  const displayedRef = useRef('');
  const targetRef = useRef(targetText);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  targetRef.current = targetText;

  useEffect(() => {
    // A shorter target than what's already displayed only happens when a
    // new turn starts (streamingText resets to '' between turns) -- never
    // a legitimate "catch up backwards" case, so snap instead of animating.
    if (targetText.length < displayedRef.current.length) {
      displayedRef.current = targetText;
      setDisplayed(targetText);
      lastTickRef.current = null;
    }
  }, [targetText]);

  useEffect(() => {
    function tick(now: number) {
      const last = lastTickRef.current ?? now;
      const elapsedSeconds = (now - last) / 1000;
      lastTickRef.current = now;

      const target = targetRef.current;
      const backlog = target.length - displayedRef.current.length;
      if (backlog > 0) {
        const charsPerSecond = BASE_CHARS_PER_SECOND + backlog * BACKLOG_CATCH_UP_FACTOR;
        const charsToReveal = Math.max(1, Math.round(charsPerSecond * elapsedSeconds));
        const next = target.slice(0, displayedRef.current.length + charsToReveal);
        displayedRef.current = next;
        setDisplayed(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return displayed;
}
