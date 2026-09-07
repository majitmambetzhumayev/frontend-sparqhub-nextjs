# SparqHub frontend — review log

Baseline audit before this branch merges to `main`. See the backend repo's
`REVIEW.md` for the feature-level (API/business-logic) review — this one
covers frontend-specific state.

**No automated frontend test suite exists yet** (no Jest/RTL configured,
despite CLAUDE.md documenting the convention for when tests are added).
Everything below is `tsc --noEmit` + `next build` + manual browser/live
verification, not automated regression coverage. That's the single biggest
frontend gap this review surfaces.

Legend: ✅ verified · ⚠️ partially verified / known gap · ❌ not verified

---

## Build health

- ✅ **Fixed this pass**: `src/app/[locale]/(public)/testimonials/page.tsx`
  was a 0-byte file, empty since its creation (unrelated to this session's
  work) — broke `next build` with "is not a module". It was never linked from
  anywhere (`PublicNavbar` only links `/about` and `/contact`) and never
  referenced in the codebase, so it was dead scaffolding, not a real page
  under construction — deleted rather than stubbed out.
- ✅ `npx tsc --noEmit` clean.
- ✅ `npm run lint` clean (2 pre-existing `react-hooks/exhaustive-deps`
  warnings in `conversations/[threadId]/page.tsx`, not errors, not touched).
- ✅ `npm run build` succeeds — verified locally before trusting the new CI
  workflow (`.github/workflows/ci.yml`) to gate on it.

## Conversation UI (chat window, composer, status indicator)

- ✅ Manually verified in-browser across the session: message rendering
  (Markdown via `react-markdown` + `remark-gfm`, including generated images
  as inline `<img>` via standard Markdown image syntax), streaming text,
  activity indicator (thinking / tool-call / confirm-required states), the
  provider/model picker, project move modal, title rename.
- ✅ Tool-confirmation card (`ToolConfirmationCard.tsx`) — confirmed working
  live against the real pause/resume WebSocket flow.
- ⚠️ No automated coverage at all for any of this — a regression here would
  only be caught by someone actually clicking through the app.

## Layout

- ✅ Sticky sidebar/header + scrollable message area (flexbox containment,
  no JS-based scroll locking) — verified visually, including the header
  content injection pattern (`HeaderContentContext`) used by the conversation
  pages to push provider/title controls into the topbar.
- ⚠️ Not tested on real mobile viewports or narrow windows — only checked at
  normal desktop width during this session.

## Admin UI (`/users`, Settings admin section)

- ✅ Live-verified: real admin login, `/users` list renders, credit edit
  (input + explicit Save, not auto-save) round-trips to the backend, is_active
  toggle works, non-admin redirect confirmed.
- ⚠️ Client-side admin gating (`/users` redirects non-staff to `/dashboard`)
  is defense-in-depth only — the backend's `IsAdminUser` permission is the
  real boundary and is what's actually tested (see backend `REVIEW.md`).

## Known non-blocking gaps

- ✅ **Fixed (2026-09-07): `src/i18n/request.ts` always rendered English,
  regardless of the `/en` or `/fr` URL segment.** `requestLocale` is a
  `Promise<string | undefined>` (next-intl 4.x), but was passed unawaited
  into `hasLocale()` — comparing a Promise object against `routing.locales`
  never matches, so every request silently fell back to `defaultLocale`.
  This wasn't "strings not translated yet" as previously noted here —
  `home.title`/`home.cta` (and likely other already-translated namespaces)
  were real, different, correct strings in `fr.json` that server components
  could just never reach. `LanguageSwitcher.tsx` was also redesigned
  (dropdown + flags, was a bare "EN · FR" text toggle) while investigating
  this. Checked all namespaces once reachable: 194 keys total, only 11
  identical between `en.json`/`fr.json` — all legitimate (e.g. "Contact",
  "Email", "URL", "Admin" are spelled the same in French). Translation
  coverage is actually in good shape; the old note above undersold it.
- No React error boundaries — an unexpected render error anywhere still takes
  down the whole page rather than degrading gracefully.
- No automated frontend tests of any kind. If this project matures past MVP,
  this is the next real investment, in this order of value: `src/lib/`
  pure-function unit tests, then RTL tests for the conversation flow (the
  most complex, least-visible-to-review piece of the frontend).
