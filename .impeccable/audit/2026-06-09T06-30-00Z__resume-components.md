# Audit: Resume Components

**Target:** `components/resume-canvas.tsx`, `components/resume/a4-blocks.tsx`, `components/resume/tech-radar.tsx`, `components/resume/architecture-explorer.tsx`, `components/resume/contribution-heatmap.tsx`, `components/resume/language-chart.tsx`, `components/resume/skill-stat-card.tsx`, `components/resume/credential-timeline.tsx`, `components/resume/claim-density.tsx`, `components/resume/a4-pager.tsx`

**Date:** 2026-06-09

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | Partial a11y — aria-labels present, but keyboard Enter/Space handlers missing on custom interactive elements; no `aria-expanded` on collapsibles |
| 2 | Performance | 3 | Mostly optimized (useMemo, ResizeObserver debounce). Heatmap tooltip over-triggers (371 setState calls on mouse sweep). Width-animated bar in ClaimDensity causes layout recalc |
| 3 | Responsive Design | 1 | Major gaps — all SVGs are fixed-size (240×240, 260px, 252px). Touch targets well below 44×44px for all SVG interactive elements |
| 4 | Theming | 2 | A4 sheet colors are intentionally hard-coded for print consistency (correct). But outer UI elements (container, tag row, Improve button, Evidence popover) use hard-coded slate instead of project CSS tokens. Zero project token usage in resume-canvas.tsx and a4-blocks.tsx |
| 5 | Anti-Patterns | 3 | No AI slop tells. Well-structured components. Resume uses **indigo** as accent instead of the design system's Bio Emerald — the one place two accents exist |
| **Total** | | **11/20** | **Acceptable — significant work needed on responsive + theming** |

## Anti-Patterns Verdict

**PASS.** The resume components are clean, custom-designed, and show no AI-generated tells. No gradient text, no glassmorphism, no side-stripe borders, no sketchy illustrations, no hero-metric templates, no identical card grids, no uppercase eyebrows, no numbered markers. The components feel purpose-built.

**Caveat:** The resume's "Improve with AI" button and outer container use indigo as their accent color rather than the project's Bio Emerald (`#3ee5a4`). This is the one place two accent colors coexist in the project, violating the design system's "one accent, used with intent" rule.

## Executive Summary

- **Audit Health Score: 11/20 (Acceptable)**
- **Total issues: 9** (P0: 0, P1: 2, P2: 4, P3: 3)
- **Top critical issues:**
  1. All SVGs have hard-coded dimensions — break on mobile viewports
  2. Outer resume UI elements use hard-coded slate instead of project design tokens
  3. Interactive SVG elements have no keyboard Enter/Space handlers

### Detailed Findings by Severity

#### P1 — Major

1. **SVG components not responsive**
   - **Location:** `tech-radar.tsx:106`, `contribution-heatmap.tsx:155`, `language-chart.tsx:81`, `architecture-explorer.tsx:148`
   - **Category:** Responsive
   - **Impact:** The TechRadar (240×240), Heatmap (dynamic ~270px), Language Chart bars (260px), and Architecture Explorer (252px) are all hard-coded sizes. On mobile viewports (<375px), they cause horizontal overflow or require the user to scroll sideways.
   - **Recommendation:** Wrap SVGs in responsive containers with `max-width: 100%` and `overflow-visible`. Set SVG `width` to a percentage or use viewport-relative sizing via `useLayoutEffect` + `ResizeObserver` (same pattern as A4Pager). Or add a horizontal scroll container with `overflow-x: auto` for mobile.
   - **Suggested command:** `$impeccable adapt resume-components`

2. **Outer resume UI uses hard-coded slate colors instead of project tokens**
   - **Location:** `resume-canvas.tsx:157-167`, `209-221`, `229-253`; `a4-blocks.tsx:75-85`
   - **Category:** Theming
   - **Impact:** The white A4 sheet correctly uses print-optimized fixed colors (by design). But the outer *container* (`border-slate-200 bg-white p-12`), the tag row (`bg-slate-50 text-slate-500 border-slate-200`), the "Improve with AI" button (`border-slate-200 bg-white text-slate-700 shadow-sm`), and the Evidence popover (`border-slate-200 bg-white shadow-xl`) sit on the app's dark background and don't respect the dark theme. These should use project CSS tokens (`bg-card`, `text-foreground`, `border-border`, `shadow-sm`).
   - **WCAG/Standard:** WCAG 1.4.1 (Use of Color) — the theme incompatibility could cause contrast issues in dark mode.
   - **Recommendation:** Replace all `bg-white`, `bg-slate-*`, `text-slate-*`, `border-slate-*` on *outer* elements with project tokens. The A4 sheet internals retain their fixed colors.
   - **Suggested command:** `$impeccable colorize resume-canvas`

#### P2 — Minor

3. **TechBadge missing keyboard Enter/Space handler**
   - **Location:** `a4-blocks.tsx:114-121`
   - **Category:** Accessibility
   - **Impact:** TechBadge has `tabIndex={0}` and `role="button"`, appearing in the tab order. But there's no `onKeyDown` handler for Enter/Space. Keyboard users can focus the badge but cannot activate it — the cross-highlighting only works via mouse hover/focus-within.
   - **WCAG/Standard:** WCAG 2.1.1 (Keyboard) — failure to provide keyboard activation for a focusable interactive element.
   - **Recommendation:** Add `onKeyDown` handler that triggers `onTechFocus?.(tag)` on Enter/Space.
   - **Suggested command:** `$impeccable harden a4-blocks`

4. **SkillStatCard missing `aria-expanded` on collapsible**
   - **Location:** `skill-stat-card.tsx:165`
   - **Category:** Accessibility
   - **Impact:** The collapsible section toggles between "Show details" and "Hide details" visually, but the `<button>` has no `aria-expanded` attribute. Screen reader users cannot determine whether the section is open or closed.
   - **WCAG/Standard:** WCAG 4.1.2 (Name, Role, Value) — missing ARIA state.
   - **Recommendation:** Add `aria-expanded={isVisible}` to the toggle button.
   - **Suggested command:** `$impeccable harden skill-stat-card`

5. **Contribution Heatmap tooltip over-triggers on mouse sweep**
   - **Location:** `contribution-heatmap.tsx:228-240`
   - **Category:** Performance
   - **Impact:** Each cell's `onMouseEnter` calls `setTooltip()`, causing a React re-render. Sweeping the mouse across the 53×7 grid triggers up to 371 setState calls in rapid succession. This can cause visible jank on low-end devices.
   - **Recommendation:** Throttle `setTooltip` with a 50ms debounce, or use CSS-based tooltip (`::after` pseudo-element + `:hover`) instead of React state.
   - **Suggested command:** `$impeccable optimize contribution-heatmap`

6. **Language Chart variant toggle remounts entire chart**
   - **Location:** `language-chart.tsx:221-229`
   - **Category:** Performance
   - **Impact:** Switching between "Bars" and "Donut" variant conditionally renders different components. Both components have internal `useState` (hovered index), which is lost on toggle. The chart briefly flashes as it remounts.
   - **Recommendation:** Render both charts with CSS `display: none / block` or `opacity: 0 / 1` so the active variant is just visibility toggling, not remounting.
   - **Suggested command:** `$impeccable optimize language-chart`

#### P3 — Polish

7. **Resume uses indigo accent instead of design system's Bio Emerald**
   - **Location:** All resume components
   - **Category:** Anti-Pattern (Theming)
   - **Impact:** The resume's primary interactive color is indigo-500 (`#6366f1`), while the project's design system specifies Bio Emerald (`#3ee5a4`) as the single accent. The "Improve with AI" button and TechBadge active states use indigo. This creates a second accent color in the visual system.
   - **Note:** This was likely intentional to keep the resume visually distinct from the chat UI. But it violates the design system's "one accent" rule.
   - **Recommendation:** Either (a) align with the design system by replacing indigo with `text-primary` / `bg-primary` token usage, or (b) document indigo as the resume's register-specific accent in DESIGN.md.

8. **CredentialTimeline uses color-only type indicators**
   - **Location:** `credential-timeline.tsx:86-87`
   - **Category:** Accessibility
   - **Impact:** Degree types use indigo dot color, certification types use amber. The icons (GraduationCap vs Award) do provide some differentiation, but the primary visual distinction is color alone.
   - **WCAG/Standard:** WCAG 1.4.1 (Use of Color)
   - **Recommendation:** Add a text label (e.g., "Degree" / "Certification") as a badge or prefix to supplement the color coding.

9. **ClaimDensityVisualizer animates `width` property on hover**
   - **Location:** `claim-density.tsx:90`
   - **Category:** Performance
   - **Impact:** The bar width animation uses `transition-all duration-200`. Width animations trigger layout recalculations. This is barely perceptible at 140px max width but creates unnecessary layout work.
   - **Recommendation:** Use `transform: scaleX()` instead of `width` for the animation, or keep the transition on `opacity`/`background-color` only.
   - **Suggested command:** `$impeccable optimize claim-density`

## Patterns & Systemic Issues

1. **Fixed-size SVGs across all visualization components** — Every custom SVG component (TechRadar, Heatmap, LanguageChart, Architecture Explorer) has hard-coded `width` and `height`. This is a systemic responsive design gap. None of these components adapt to the viewport.

2. **Zero project design token usage** — Across `resume-canvas.tsx` and `a4-blocks.tsx`, there are zero instances of `bg-background`, `text-foreground`, `border-border`, or other CSS variable tokens. All styling uses hard-coded Tailwind slate colors. The A4 sheet internals should keep fixed colors (print), but the outer shell (container, tag row, buttons, popover) should use tokens.

3. **All SVG interactive elements below touch target minimum** — TechRadar vertex dots (4px radius = 8×8mm), LanguageChart bars (18px height), Heatmap cells (10px). None approach 44×44px. This is acceptable for mouse/trackpad use but fails on touch devices.

## Positive Findings

1. **Excellent print support** — All components include `print:` variant overrides. The Architecture Explorer, TechRadar, and Heatmap all have print-specific styles (`print:border-black`, `print:ring-0`, `print:bg-transparent`). The A4 pager's measurement system is well-engineered.

2. **Good memoization discipline** — `useMemo` used for derived data in TechRadar (angles, grid polys), Heatmap (month/day labels, stats), LanguageChart (default data), CredentialTimeline (sorted), ArchitectureExplorer (node positions). The A4 pager's ResizeObserver uses proper debouncing.

3. **Semantic ARIA labels on SVGs** — All SVG components include `role="img"` with descriptive `aria-label`. Interactive elements have `role="button"`, `tabIndex={0}`, and descriptive `aria-label` text.

4. **Evidence popover accessibility** — Uses `onClose` handler with outside-click detection and proper `z-50` stacking. The popover self-positions within viewport bounds.

5. **Intentional print-first strategy** — The decision to use fixed slate colors for the A4 sheet is architecturally sound. The sheet renders identically on screen and in print, which is the correct trade-off for a document that users will print/export.

## Recommended Actions

1. **[P1] `$impeccable adapt resume-components`** — Make all SVG visualizations responsive by wrapping in viewport-aware containers. Use `max-width: 100%` + `overflow-visible` on SVGs, or adopt the A4Pager's `ResizeObserver` pattern for dynamic sizing.

2. **[P1] `$impeccable colorize resume-canvas`** — Replace hard-coded slate colors on OUTER UI elements (resume container, tag row, Improve with AI button, Evidence popover) with project CSS tokens. The A4 sheet internals retain fixed print-optimized colors.

3. **[P2] `$impeccable harden a4-blocks`** — Add keyboard Enter/Space handlers to TechBadge; add `aria-expanded` to collapsible toggles; add text labels to CredentialTimeline color indicators.

4. **[P2] `$impeccable optimize contribution-heatmap`** — Throttle tooltip setState or switch to CSS-based tooltip. Fix LanguageChart variant toggle to avoid remounting.

5. **[P3] Document indigo as resume register accent** — Either align with Bio Emerald or add a DESIGN.md note: "The resume visualizer uses indigo as its interactive accent to distinguish the A4 document surface from the app's chat surface."

---

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `$impeccable audit` after fixes to see your score improve.
