import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement scrollIntoView at all — several components
// (e.g. ChatWindow) call it in an effect purely as a UX nicety with no
// return value to assert on, so a no-op stub is enough for tests.
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
