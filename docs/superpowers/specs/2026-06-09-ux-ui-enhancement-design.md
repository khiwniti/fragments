# UX/UI Enhancement: Headless Chat + App-Wide Token Consistency

**Date:** 2026-06-09
**Status:** Approved design, pending implementation plan
**Approach:** Token foundation first, then rebuild (Approach A)

## Problem

1. The `/chat` "headless" implementation is not actually headless: it mixes the
   `@copilotkit/react-core/v2` provider with the v1 `CopilotSidebar` from
   `@copilotkit/react-ui`, patched by an inline `<style>` hack and
   `app/copilotkit-overrides.css` full of duplicated hex values. The version
   mismatch is the root cause of the broken headless attempt.
2. Design tokens are not consistent app-wide. The `.impeccable` audit
   (2026-06-09, score 11/20) found hard-coded slate/indigo in the resume outer
   UI, zero project-token usage in `resume-canvas.tsx` / `a4-blocks.tsx`
   (outer elements), and accent drift (`rgba(52,211,153,…)` utilities vs
   primary `#3ee5a4`).
3. Audit P1/P2 issues: fixed-size SVGs break mobile, missing keyboard
   handlers/ARIA states, heatmap tooltip jank (371 setState on sweep), chart
   remount flash, width-animated layout recalc.

## Scope

- Truly headless chat UI on the v2 `useAgent` + `useCopilotKit().runAgent` pattern (custom components, no CopilotKit CSS, no Cloud license key).
- App-wide token consistency (chat, resume outer UI, landing, navbar, all components).
- Responsive, accessibility, and performance fixes from the audit.
- CopilotKit wiring verification (runtime route, agent, dependency cleanup).
- Generative UI (tool-call/shared-state widgets) polish inside the new chat panel.

**Out of scope:** `portfolio-mcp-ui/` (empty dir; a future MCP App is its own
spec), A4 sheet internals (fixed print palette is intentional), backend/agent
logic changes.

## Section 1 — Token Foundation

`app/globals.css` is the single source of truth.

- Promote missing semantic tokens from DESIGN.md into `@theme`/`:root`:
  `--surface-elevated` (#161e2a); formalize accent-dim/accent-surface as
  tokens derived from `--primary`, replacing the drifted
  `rgba(52, 211, 153, …)` utility classes.
- **Rule:** components use only Tailwind semantic classes (`bg-card`,
  `text-muted-foreground`, `border-border`, `bg-primary`, …). No raw hex, no
  `slate-*`, no `indigo-*` — except inside the A4 sheet print region, which
  keeps its fixed print palette (documented exception, marked with a comment
  block).
- Delete `app/copilotkit-overrides.css` (only existed to re-skin the prebuilt
  UI being removed).
- Add a short "token contract" section to DESIGN.md listing allowed classes.

## Section 2 — Headless Chat Rebuild

`app/chat/page.tsx` keeps the `<CopilotKit>` provider from
`@copilotkit/react-core/v2` (`runtimeUrl="/api/copilotkit"`, `agent="resume"`
unchanged).

**Removed:** `CopilotSidebar`, `@copilotkit/react-ui` styles import, inline
`<style>` hack, `copilotkit-overrides.css`. Zero CopilotKit CSS ships.

**Added:** `components/chat-panel/` with focused components, all built from
project tokens + existing shadcn/ui primitives:

| Component | Responsibility |
|---|---|
| `chat-panel.tsx` | Fixed right panel (`bg-card border-l border-border`); layout: message scroll area + input dock; collapsible on mobile (slides over canvas) |
| `message-list.tsx` | Renders `agent.messages`; user bubbles `bg-accent`, assistant transparent `text-foreground`; shared markdown renderer |
| `chat-input.tsx` | Textarea + send button (`bg-input`/`ring` tokens); Enter sends, Shift+Enter newline; disabled while `agent.isRunning` |
| `suggestions.tsx` | Pill buttons (DESIGN.md chip style); static starter prompts (no Cloud suggestions API) |
| `tool-render.tsx` | Generative UI slot: agent tool calls / shared-state widgets inline in the stream; same tokens, loading skeletons, error states |

**Data flow:** v2 `useAgent({ agentId: 'resume' })` provides
`agent.messages` / `agent.isRunning`; sending = `agent.addMessage({...})` +
`useCopilotKit().copilotkit.runAgent({ agent })`. (Decision: the originally
spec'd `useCopilotChatHeadless_c` hook requires a CopilotKit Cloud public API
key; the `useAgent` pattern is key-free and is what `ResumeCanvas` already
uses — both surfaces share one agent connection.) No backend changes.

**Error handling:** runtime/agent errors render as an inline system message
(`text-destructive-foreground bg-destructive/20`) with a retry button.

**Layout:** resume canvas left (unchanged), chat panel right, both on
`bg-background`.

## Section 3 — App-Wide Token Sweep

- `components/resume-canvas.tsx` (audit P1): outer container, tag row,
  "Improve with AI" button, Evidence popover → `bg-card`, `border-border`,
  `text-muted-foreground`, `shadow-sm`. Indigo accent removed; interactive
  accents become `primary` (Bio Emerald) — restores "one accent, used with
  intent".
- `components/resume/a4-blocks.tsx`: same for elements outside the A4 sheet;
  sheet internals keep fixed print palette behind the documented exception.
- Landing widgets, navbar, auth dialog, footer: verification sweep + spot
  fixes (e.g. rgba accent-drift utilities → new accent tokens).
- Resume visualization components (tech-radar, contribution-heatmap,
  language-chart, architecture-explorer, skill-stat-card, credential-timeline,
  claim-density): on-screen chart strokes/fills → `hsl(var(--primary))` /
  `--chart-*` tokens; print-side colors stay fixed.

**Verification gate:**
`grep -rn 'slate-\|indigo-\|#[0-9a-f]\{6\}' components app --include='*.tsx'`
must return only documented A4-sheet exceptions.

## Section 4 — Audit Fixes + Wiring Verification

**Responsive (P1):** All four fixed-size SVGs (TechRadar 240×240, Heatmap
~270px, Language Chart 260px, Architecture Explorer 252px) adopt the
`a4-pager.tsx` pattern: container-measured width via `ResizeObserver`, SVG
scales via `viewBox` + `max-width: 100%`. Heatmap gets `overflow-x: auto` on
narrow viewports (<375px). SVG touch targets get ≥44×44px invisible hit areas
(transparent rects).

**Accessibility (P2):** keyboard Enter/Space on TechBadge
(`a4-blocks.tsx:114`); `aria-expanded` on SkillStatCard toggle; same checks
applied to other collapsibles/popovers found during the sweep. Chat panel
built keyboard-first (visible focus rings via `ring` token; no focus trap —
panel, not modal).

**Performance (P2):** Heatmap tooltip → CSS-only (`:hover` + data
attributes); Language Chart variants stay mounted (CSS visibility toggle,
hover state lifted); ClaimDensity bar animates `transform: scaleX` instead of
width.

**CopilotKit wiring:** confirm `/api/copilotkit` route + `resume`
BuiltInAgent against current v2 docs (single-route mode from fd3a81c); remove
`@copilotkit/react-ui` from package.json; grep gate: `@copilotkit/react-ui` →
zero hits.

## Testing

Existing Playwright e2e setup gains:

1. Chat send/receive smoke test on `/chat`.
2. Mobile viewport (375px) no-horizontal-overflow check on `/chat` and `/`.
3. axe-core a11y scan of the chat panel.

Plus the two grep gates (token sweep, v1 package removal) as scriptable
checks.

## Build Order

1. Token foundation (Section 1)
2. Headless chat rebuild (Section 2)
3. App-wide token sweep (Section 3)
4. Audit fixes + wiring verification (Section 4)

Each step consumes the tokens established in step 1 — nothing gets styled
twice.
