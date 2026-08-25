# SparqHub frontend — CLAUDE.md

Next.js 15 (App Router) frontend for SparqHub. See `REVIEW.md` for what's
actually been verified vs. known gaps — keep that file updated as gaps
close, don't replace it wholesale. See the backend repo's own `CLAUDE.md` +
`REVIEW.md` for the API/business-logic side.

## Code philosophy

The general rule (senior, clean, no speculative abstractions, comments
explain WHY not WHAT) lives in the user-level `CLAUDE.md` (outside this
repo, loaded automatically in every session) — don't re-duplicate it here.

Frontend-specific instance of it: no premature componentization (duplicate
a small bit of JSX/logic before extracting a shared component/hook that only
has one caller); existing comments (e.g. the `HeaderContentContext`
injection pattern, the two pre-existing `react-hooks/exhaustive-deps`
warnings noted in `REVIEW.md`) exist so an agent picking this up cold
doesn't have to re-derive the reasoning — read them, don't strip them.

## Structure

- `src/app/[locale]/(public)/` — unauthenticated routes (landing, about,
  contact, auth).
- `src/app/[locale]/(app)/` — authenticated app shell (dashboard,
  conversations, projects, assistant-manager, settings, users/admin).
- `src/components/` — shared UI components.
- `src/context/` — `AuthContext`, `HeaderContentContext` (lets conversation
  pages push provider/title controls into the topbar), `MobileMenuContext`,
  `ToastContext`.
- `src/lib/` — pure functions/hooks (axios client, `useLogout`,
  `useReportError`). This is the layer most worth unit-testing.
- `src/i18n/` + `src/messages/` — `next-intl` routing/config + `en.json`/
  `fr.json`. Scaffolding is in place but strings aren't actually translated
  yet — deliberate, not an oversight (revisit once the UI stops churning).

## Testing

- Vitest + React Testing Library (`vitest.config.mts`, `src/test/setup.tsx`).
  Tests are colocated (`*.test.ts(x)` next to the file under test, e.g.
  `src/lib/axios.test.ts`, `src/context/AuthContext.test.tsx`).
- `npm test` (single run) / `npm run test:watch`.
- Coverage is thin — most of the conversation UI is manually
  browser-verified only (see `REVIEW.md`). If adding meaningful coverage,
  `src/lib/` pure-function tests first, then RTL tests for the conversation
  flow (most complex, least-visible-to-review piece of the app).
- `npx tsc --noEmit` and `npm run lint` should stay clean; `npm run build`
  is the real gate (CI runs it).

## Env

No `.env.example` currently exists for this repo — add one if you add a new
`NEXT_PUBLIC_*` var, so the list doesn't have to be re-derived from `grep`
again. Currently used: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SENTRY_DSN`.

## Known non-blocking gaps

- No React error boundaries — an unexpected render error takes down the
  whole page rather than degrading gracefully.
- Not verified on real mobile viewports/narrow windows beyond normal desktop
  width.
