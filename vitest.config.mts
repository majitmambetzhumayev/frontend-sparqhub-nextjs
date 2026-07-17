import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Explicit, empty PostCSS pipeline -- without this, Vite auto-discovers
  // the project's real postcss.config.mjs (Tailwind v4's @tailwindcss/postcss
  // plugin) for ANY .css import reached during a test, which crashes: that
  // plugin isn't valid outside Next's own build integration. Nothing in
  // these tests asserts on real Tailwind output, so an empty pipeline is
  // correct, not just a workaround.
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    globals: true,
    css: false,
    // Without this, a mock's call history (mock.calls, toHaveBeenCalled)
    // carries over into the next test in the same file -- a `driver()`
    // call in one test was still showing up in a later, unrelated test's
    // assertion. Clears calls/results before each test; doesn't touch
    // implementations set via vi.mock(), so those stay intact.
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
