# A4 Resume Artifact Panel — Print-Ready Multi-Page Sheets

**Date:** 2026-06-06
**Status:** Approved

## Goal

Make the resume artifact panel render as true, ready-to-print A4 sheets —
white paper on the dark app canvas, content paginated into pages with no
within-page scrolling — while restoring the original fragments-org artifact
proportions (~60% of the screen) and keeping the existing /chat user flow
(sidebar, sessions, starter chips, `?prompt=` auto-submit, streaming)
completely intact.

## Background

- `app/chat/page.tsx` renders the resume artifact in a fixed `w-[480px]`
  right panel — too small to present a resume properly.
- The original artifact app (`fragments-org/app/page.tsx`) used a
  `md:grid-cols-2` split where the artifact takes roughly half the screen
  with full panel chrome (`components/preview.tsx`).
- `ResumeArtifact` currently renders one continuous theme-colored scroll
  area; printed output does not match screen.

## Decisions (locked)

1. **Multi-page A4 sheets** — content flows into stacked A4 pages
   (Google-Docs page view). Scroll moves between pages, never within one.
2. **Panel ≈ 60% of content area** — chat column `flex-1 min-w-[360px]
   max-w-[800px]`; artifact `w-[60%] flex-shrink-0`. On `< md`, the panel
   overlays full-width (existing `absolute md:relative` chrome).
3. **White paper on dark canvas** — sheets are white with near-black text;
   screen output is identical to print output (WYSIWYG).
4. **Pagination: measurement-based, item granularity (Option A)** — no
   pagination libraries.
5. **/admin and /blog** — verification scope only: confirm they still work
   after the change. No redesign.

## Design

### 1. Layout — `app/chat/page.tsx`

- Replace the right panel `w-[480px]` with `w-[60%]` (of the chat content
  row), keeping the slide-in animation and `ResumePreview` chrome (close
  `»`, Preview/Data tabs, Print button).
- Everything else unchanged: conversation sidebar, session persistence,
  starter chips, URL-prompt auto-submit, `useObject` streaming, non-resume
  fragment flow.

### 2. New component — `components/resume/a4-pager.tsx`

The pagination engine.

- **Constants:** A4 = 794 × 1123 CSS px (210 × 297 mm @ 96 dpi); content
  padding ≈ 48 px (~12 mm margins).
- **Blocks:** content is decomposed into measurable blocks — the profile
  header (page 1 only), each section heading, each section item (one job,
  one project, …).
- **Measure:** blocks render into a hidden container at exact A4 content
  width; heights measured via `useLayoutEffect` + `ResizeObserver`.
- **Pack:** greedy packing of blocks into pages. A section heading is never
  orphaned — it always stays with its first item (move both to the next
  page if the pair doesn't fit).
- **Render:** `pages: Block[][]` → stacked white `.a4-sheet` divs centered
  on the dark canvas with `shadow-2xl` and a page badge (`1 / 2`) under
  each sheet.
- **Scale-to-fit:** the container measures available panel width and
  applies `transform: scale(n)` so a full A4 page is always fully visible
  horizontally.
- **Streaming:** re-paginate on content change, debounced ~150 ms, so pages
  grow live while the model streams.

### 3. Restyle — `components/resume-artifact.tsx`, `components/resume/resume-section.tsx`

- Switch the resume body from theme tokens to a fixed **print palette**:
  white background, near-black text, one accent color. Identical on screen
  and on paper.
- The profile header (name, headline, contacts, open-to-work) becomes the
  first block of page 1.
- Typography tuned for A4: ~10–11 pt body equivalents, tighter spacing.

### 4. Print path

- `@media print`: hide app chrome (extend existing `print:hidden`),
  remove the scale transform, `@page { size: A4; margin: 0 }`, each
  `.a4-sheet` gets `break-after: page`.
- Printed PDF matches the on-screen pages exactly, page for page.

## Unchanged

Schema, `/api/resume-chat`, streaming via `useObject`, session storage,
chat artifact card, conversation sidebar, starter chips, non-resume
fragment flow, /admin, /blog.

## Error handling

- A single block taller than one A4 content area (pathological case):
  render it alone on its own page and let it clip at the page edge; do not
  crash pagination.
- Zero sections / streaming not yet started: keep the existing skeleton +
  empty states, rendered inside a single white sheet.

## Testing

- `npx tsc --noEmit` passes.
- Playwright (existing setup): generate a resume → assert at least one
  `.a4-sheet` exists; assert sheet aspect ratio ≈ 794 / 1123; with long
  content assert multiple sheets.
- Manual: print preview matches the on-screen pages; close/tab/print
  buttons in the panel chrome work; streaming shows live page growth.
- Regression sweep: click through /admin (login, blog CRUD, analytics,
  series, contact) and /blog (index, post, tag, type, series, search)
  to confirm they render and navigate as before.
