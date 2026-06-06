# A4 Resume Artifact Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the resume artifact as print-ready, multi-page A4 sheets (white paper on dark canvas, no within-page scrolling) in a ~60%-width panel, with print output matching screen exactly.

**Architecture:** Decompose the resume into measurable blocks (header / section heading / section item). A new `A4Pager` component measures blocks in a hidden off-screen container at exact A4 content width, packs them into pages with a pure greedy `packBlocks` function (headings never orphaned from their first item), renders stacked white `.a4-sheet` divs scaled to fit the panel, and re-paginates (debounced) as content streams. Print CSS strips chrome and scale so each sheet prints as one A4 page.

**Tech Stack:** Next.js 14 App Router, React, Tailwind, Playwright (e2e at `e2e/`), no new dependencies.

**Working directory:** `/Users/admin/tmp-khiw.dev/fragments/` (its own git repo, branch `main`). All paths below are relative to it.

**Spec:** `docs/superpowers/specs/2026-06-06-a4-resume-artifact-design.md`

**Testing note:** This repo has no unit-test framework — only Playwright e2e (which hits the live dev server and real LLM API). Strict test-first TDD per task is impractical here; instead each task ends with `npx tsc --noEmit` as the fast verification gate, and Task 6 adds the Playwright coverage required by the spec.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `components/resume/a4-blocks.tsx` | Create | Print-palette block components: `ResumeHeaderBlock`, `SectionHeadingBlock`, `SectionItemBlock`, `SheetSkeletonBlock`, `SheetEmptyBlock` |
| `components/resume/a4-pager.tsx` | Create | A4 constants, pure `packBlocks()`, `A4Pager` component (measure → pack → render → scale) |
| `components/resume-artifact.tsx` | Rewrite | Decompose content into blocks, feed `A4Pager`, handle skeleton/empty states |
| `components/resume/resume-section.tsx` | Delete | Superseded by `a4-blocks.tsx` (only importer was `resume-artifact.tsx`) |
| `app/globals.css` | Modify | `@media print` rules: visibility isolation, `@page` size A4, un-scale sheets |
| `app/chat/page.tsx` | Modify | Right panel `w-[480px]` → `w-[60%]`; chat column `flex-1 min-w-[360px] max-w-[800px]` |
| `e2e/resume-a4.spec.ts` | Create | Playwright: `.a4-sheet` exists, aspect ratio ≈ 794/1123, multi-sheet for long content |

Unchanged (verify only): `components/resume-preview.tsx` (panel chrome), `lib/schema.ts`, `lib/profile.ts`, `/api/resume-chat`, sessions/sidebar/chips/`?prompt=`, `/admin`, `/blog`.

---

### Task 1: Print-palette block components — `components/resume/a4-blocks.tsx`

**Files:**
- Create: `components/resume/a4-blocks.tsx`

The print palette is **fixed colors** (not theme tokens) so screen == paper: white background, `slate-900` text, `slate-600` muted, `sky-800` accent, `slate-200` rules. Typography is tuned for A4 (~10–11 pt equivalents).

- [ ] **Step 1: Create the file with all five block components**

```tsx
'use client'

import { ResumeItemSchema } from '@/lib/schema'
import { DeepPartial } from 'ai'
import { profile } from '@/lib/profile'
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
} from 'lucide-react'

// ── Print palette ────────────────────────────────────────────────────────
// Fixed colors (NOT theme tokens) so the on-screen sheet is identical to
// the printed page: white paper, near-black text, one accent (sky-800).

/** Profile header — always the first block of page 1. */
export function ResumeHeaderBlock() {
  return (
    <header className="border-b border-slate-200 pb-4">
      <h1 className="text-[26px] leading-tight font-bold tracking-tight text-slate-900">
        {profile.fullName}
      </h1>
      <p className="text-[13px] text-slate-600 mt-0.5 font-medium">
        {profile.headline}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[11px] text-slate-600">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {profile.location}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="h-3 w-3" />
          <a href={`mailto:${profile.email}`} className="hover:text-sky-800">
            {profile.email}
          </a>
        </span>
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {profile.phone}
        </span>
        <span className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          <a href={profile.portfolio} target="_blank" rel="noreferrer" className="hover:text-sky-800">
            {profile.portfolio.replace('https://', '')}
          </a>
        </span>
        <span className="flex items-center gap-1">
          <Github className="h-3 w-3" />
          <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-sky-800">
            github.com/getintheQ
          </a>
        </span>
        <span className="flex items-center gap-1">
          <Linkedin className="h-3 w-3" />
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-sky-800">
            linkedin.com/in/getintheq
          </a>
        </span>
      </div>

      {profile.openToWork && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
          <span className="inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          Open to work · {profile.workPreferences}
        </div>
      )}
    </header>
  )
}

/** Section heading — packed so it is never orphaned from its first item. */
export function SectionHeadingBlock({ title }: { title?: string }) {
  return (
    <h2 className="text-[14px] font-semibold text-sky-800 tracking-tight border-b border-slate-200 pb-1 pt-2">
      {title}
    </h2>
  )
}

/** One resume item (one job, one project, …). */
export function SectionItemBlock({
  item,
}: {
  item: DeepPartial<ResumeItemSchema>
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[12px] text-slate-900">
            {item.label}
          </span>
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 rounded bg-slate-100 text-slate-600 border border-slate-200 leading-4"
            >
              {tag}
            </span>
          ))}
        </div>
        {item.value && (
          <p className="text-[10px] text-slate-500 mt-0.5">{item.value}</p>
        )}
        {item.detail && (
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            {item.detail}
          </p>
        )}
      </div>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-slate-400 hover:text-sky-800 mt-0.5"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

/** Loading skeleton, restyled for the white sheet. */
export function SheetSkeletonBlock() {
  return (
    <div className="space-y-8 animate-pulse pt-4">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="h-3 w-4/6 rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  )
}

/** Empty state shown on a single white sheet before any generation. */
export function SheetEmptyBlock() {
  return (
    <div className="text-center text-slate-500 py-12">
      <p className="text-sm">Ask a question to generate a tailored resume view.</p>
      <p className="text-xs mt-1 opacity-60">The content here adapts to your prompt.</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors. (Pre-existing errors unrelated to these files, if any, are out of scope — there should be none; the repo compiled cleanly at spec time.)

- [ ] **Step 3: Commit**

```bash
git add components/resume/a4-blocks.tsx
git commit -m "feat: print-palette resume block components for A4 sheets"
```

---

### Task 2: Pagination engine — `components/resume/a4-pager.tsx`

**Files:**
- Create: `components/resume/a4-pager.tsx`

Three concerns in one focused file: (a) A4 constants, (b) pure `packBlocks()` (greedy packing + orphan control + oversized-block fallback), (c) `A4Pager` React component (hidden measurement container → heights map → pack → render scaled sheets).

- [ ] **Step 1: Create the file**

```tsx
'use client'

import {
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

// ── A4 geometry (210 × 297 mm @ 96 dpi) ─────────────────────────────────
export const A4_WIDTH = 794
export const A4_HEIGHT = 1123
export const A4_PADDING = 48 // ~12 mm margins
export const A4_CONTENT_WIDTH = A4_WIDTH - A4_PADDING * 2 // 698
export const A4_CONTENT_HEIGHT = A4_HEIGHT - A4_PADDING * 2 // 1027

/** Vertical gap inserted between blocks within a page. */
const BLOCK_GAP = 12

export interface PagerBlock {
  /** Stable unique key — also used to look up measured height. */
  key: string
  kind: 'header' | 'heading' | 'item'
  element: ReactNode
}

/**
 * Greedy packing of blocks into A4 pages.
 *
 * Rules:
 * - Blocks fill a page top-down until the next block would overflow.
 * - A `heading` is never orphaned: if heading + its first item don't both
 *   fit on the current page, the heading moves to the next page.
 * - A single block taller than a full page gets its own page and clips at
 *   the page edge (pathological case — never crash).
 */
export function packBlocks(
  blocks: PagerBlock[],
  heights: Map<string, number>,
): PagerBlock[][] {
  const pages: PagerBlock[][] = []
  let current: PagerBlock[] = []
  let used = 0

  const gapFor = () => (current.length > 0 ? BLOCK_GAP : 0)
  const fits = (h: number) => used + gapFor() + h <= A4_CONTENT_HEIGHT

  const push = (block: PagerBlock, h: number) => {
    used += gapFor() + h
    current.push(block)
  }

  const breakPage = () => {
    if (current.length > 0) pages.push(current)
    current = []
    used = 0
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const h = heights.get(block.key) ?? 0

    if (block.kind === 'heading') {
      const next = blocks[i + 1]
      const nextH =
        next && next.kind === 'item' ? (heights.get(next.key) ?? 0) : 0
      const pairH = h + (nextH > 0 ? BLOCK_GAP + nextH : 0)
      if (!fits(pairH) && current.length > 0) breakPage()
      push(block, h)
      continue
    }

    if (!fits(h)) {
      if (current.length === 0) {
        // Oversized block on an empty page: keep it alone, let it clip.
        push(block, h)
        breakPage()
        continue
      }
      breakPage()
    }
    push(block, h)
  }
  breakPage()

  return pages.length > 0 ? pages : [[]]
}

/**
 * Renders blocks as stacked, print-ready A4 sheets.
 *
 * - Measures every block in a hidden container at exact A4 content width
 *   (debounced 150 ms via ResizeObserver, so streaming re-paginates live).
 * - Scales sheets with `transform: scale(n)` to fit the panel width; an
 *   explicit-size wrapper compensates because transforms don't affect
 *   layout.
 */
export function A4Pager({ blocks }: { blocks: PagerBlock[] }) {
  const measureRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState<Map<string, number>>(new Map())
  const [scale, setScale] = useState(1)

  // ── Measure block heights (re-runs on content change, debounced on
  //    resize of the hidden container, e.g. fonts/images settling) ──────
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const measure = () => {
      const next = new Map<string, number>()
      el.querySelectorAll<HTMLElement>('[data-block-key]').forEach((node) => {
        next.set(node.dataset.blockKey as string, node.offsetHeight)
      })
      setHeights((prev) => {
        if (
          prev.size === next.size &&
          [...next].every(([k, v]) => prev.get(k) === v)
        ) {
          return prev // no change → no re-render loop
        }
        return next
      })
    }

    measure()
    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(measure, 150)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [blocks])

  // ── Scale-to-fit panel width ──────────────────────────────────────────
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const available = el.clientWidth - 48 // canvas breathing room
      setScale(Math.min(1, Math.max(0.2, available / A4_WIDTH)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pages = useMemo(() => packBlocks(blocks, heights), [blocks, heights])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-y-auto a4-print-root"
    >
      {/* Hidden measurement container at exact A4 content width */}
      <div
        ref={measureRef}
        aria-hidden
        className="absolute -left-[9999px] top-0 pointer-events-none bg-white text-slate-900 print:hidden"
        style={{ width: A4_CONTENT_WIDTH }}
      >
        {blocks.map((b) => (
          <div key={b.key} data-block-key={b.key}>
            {b.element}
          </div>
        ))}
      </div>

      {/* Stacked sheets on the dark canvas */}
      <div className="flex flex-col items-center py-6 print:py-0">
        {pages.map((page, pageIndex) => (
          <div key={pageIndex} className="mb-8 print:mb-0">
            <div
              className="a4-sheet-wrap"
              style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}
            >
              <div
                className="a4-sheet bg-white text-slate-900 shadow-2xl overflow-hidden"
                style={{
                  width: A4_WIDTH,
                  height: A4_HEIGHT,
                  padding: A4_PADDING,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <div className="flex flex-col" style={{ gap: BLOCK_GAP }}>
                  {page.map((b) => (
                    <div key={b.key}>{b.element}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center text-[11px] text-muted-foreground mt-2 print:hidden">
              {pageIndex + 1} / {pages.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/resume/a4-pager.tsx
git commit -m "feat: A4 pagination engine (measure, greedy pack, scale-to-fit)"
```

---

### Task 3: Rewire `ResumeArtifact` to the pager; delete `resume-section.tsx`

**Files:**
- Rewrite: `components/resume-artifact.tsx`
- Delete: `components/resume/resume-section.tsx` (its only importer was `resume-artifact.tsx`)

- [ ] **Step 1: Replace the full contents of `components/resume-artifact.tsx`**

```tsx
'use client'

import { ResumeContentSchema } from '@/lib/schema'
import { DeepPartial } from 'ai'
import { useMemo } from 'react'
import { A4Pager, PagerBlock } from './resume/a4-pager'
import {
  ResumeHeaderBlock,
  SectionHeadingBlock,
  SectionItemBlock,
  SheetSkeletonBlock,
  SheetEmptyBlock,
} from './resume/a4-blocks'

export function ResumeArtifact({
  content,
  isLoading,
}: {
  content?: DeepPartial<ResumeContentSchema>
  isLoading?: boolean
}) {
  const blocks: PagerBlock[] = useMemo(() => {
    const out: PagerBlock[] = [
      { key: 'header', kind: 'header', element: <ResumeHeaderBlock /> },
    ]

    const sections = (content?.sections ?? []).filter(
      (section) => section?.items?.length,
    )

    if (sections.length === 0) {
      out.push({
        key: 'placeholder',
        kind: 'item',
        element: isLoading ? <SheetSkeletonBlock /> : <SheetEmptyBlock />,
      })
      return out
    }

    sections.forEach((section, si) => {
      out.push({
        key: `s${si}-heading`,
        kind: 'heading',
        element: <SectionHeadingBlock title={section!.title} />,
      })
      ;(section!.items ?? [])
        .filter((item): item is NonNullable<typeof item> => !!item)
        .forEach((item, ii) => {
          out.push({
            key: `s${si}-item${ii}`,
            kind: 'item',
            element: <SectionItemBlock item={item} />,
          })
        })
    })
    return out
  }, [content, isLoading])

  return <A4Pager blocks={blocks} />
}
```

- [ ] **Step 2: Delete the superseded section renderer**

```bash
git rm components/resume/resume-section.tsx
```

- [ ] **Step 3: Verify no dangling imports and it compiles**

Run: `grep -rn "resume-section" --include="*.tsx" --include="*.ts" app/ components/ lib/`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/resume-artifact.tsx
git commit -m "feat: render resume artifact as paginated A4 sheets"
```

---

### Task 4: Print path — `app/globals.css`

**Files:**
- Modify: `app/globals.css` (append at end of file)

The visibility-isolation pattern prints **only** the sheets: everything is hidden, then the `a4-print-root` subtree (set on the pager root in Task 2) is re-shown and pinned to the page origin. The scale transform and the explicit-size wrapper (both inline styles) are overridden with `!important`.

- [ ] **Step 1: Append print rules to `app/globals.css`**

```css
/* ── A4 resume print path ─────────────────────────────────────────────
   Print only the .a4-sheet pages: hide everything, re-show the pager
   subtree, strip the screen scale transform, one sheet per A4 page. */
@media print {
  body * {
    visibility: hidden;
  }
  .a4-print-root,
  .a4-print-root * {
    visibility: visible;
  }
  .a4-print-root {
    position: absolute;
    inset: 0;
    overflow: visible !important;
  }
  .a4-sheet-wrap {
    width: auto !important;
    height: auto !important;
  }
  .a4-sheet {
    transform: none !important;
    box-shadow: none !important;
    break-after: page;
  }
  @page {
    size: A4;
    margin: 0;
  }
}
```

- [ ] **Step 2: Verify build sanity**

Run: `npx tsc --noEmit`
Expected: exit 0. (CSS isn't type-checked; this guards against accidental file damage. The real print check is the manual print preview in Task 7.)

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: print stylesheet — A4 page-per-sheet, chrome hidden"
```

---

### Task 5: Panel layout — `app/chat/page.tsx`

**Files:**
- Modify: `app/chat/page.tsx` (chat column ~line 411, right panel ~line 446)

Two surgical edits. Slide-in animation, `ResumePreview` chrome, sidebar, sessions, chips, `?prompt=`, streaming, and the non-resume `Preview` flow all stay untouched.

- [ ] **Step 1: Widen the right panel from fixed 480px to 60%**

In `app/chat/page.tsx`, change:

```tsx
          {showRightPanel && (
            <div className="w-[480px] border-l border-border animate-slide-in-right flex-shrink-0">
```

to:

```tsx
          {showRightPanel && (
            <div className="w-[60%] border-l border-border animate-slide-in-right flex-shrink-0">
```

- [ ] **Step 2: Give the chat column flex bounds**

Change:

```tsx
          <div className={`flex flex-col flex-1 max-w-[800px] mx-auto px-4 overflow-hidden ${showRightPanel ? '' : 'w-full'}`}>
```

to:

```tsx
          <div className={`flex flex-col flex-1 min-w-[360px] max-w-[800px] mx-auto px-4 overflow-hidden ${showRightPanel ? '' : 'w-full'}`}>
```

(On `< md` viewports the panel already overlays full-width via `absolute md:relative` in `ResumePreview` — no change needed.)

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/chat/page.tsx
git commit -m "feat: widen resume artifact panel to 60% of content area"
```

---

### Task 6: Playwright e2e — `e2e/resume-a4.spec.ts`

**Files:**
- Create: `e2e/resume-a4.spec.ts`

Uses the `?prompt=` auto-submit flow (real `/api/resume-chat` LLM call — needs `ANTHROPIC_API_KEY` in `.env.local` and the dev server, which `playwright.config.ts` starts automatically). `boundingBox()` reflects CSS transforms, so the aspect ratio assertion holds at any scale.

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'

const A4_RATIO = 794 / 1123

test.describe('A4 Resume Artifact Panel', () => {
  test('generates resume into A4 sheets with correct aspect ratio', async ({
    page,
  }) => {
    await page.goto(
      '/chat?prompt=' +
        encodeURIComponent('What is your cloud architecture experience?'),
    )

    // Streaming opens the artifact panel; first sheet appears once
    // sections start arriving.
    const sheet = page.locator('.a4-sheet').first()
    await expect(sheet).toBeVisible({ timeout: 90_000 })

    const box = await sheet.boundingBox()
    expect(box).not.toBeNull()
    expect(Math.abs(box!.width / box!.height - A4_RATIO)).toBeLessThan(0.01)

    // Page badge renders under the sheet.
    await expect(page.getByText(/^1 \/ \d+$/).first()).toBeVisible()
  })

  test('long content paginates into multiple sheets', async ({ page }) => {
    await page.goto(
      '/chat?prompt=' +
        encodeURIComponent(
          'Show me your complete full resume with every section: highlights, experience, projects, skills, education, certifications, and summary, in full detail.',
        ),
    )

    await expect(page.locator('.a4-sheet').first()).toBeVisible({
      timeout: 90_000,
    })
    // Wait for streaming to finish growing pages.
    await page.waitForTimeout(20_000)

    const count = await page.locator('.a4-sheet').count()
    expect(count).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test e2e/resume-a4.spec.ts`
Expected: 2 passed. If the multi-sheet test yields 1 sheet because the model answered briefly, re-run once; if still 1, strengthen the prompt rather than weakening the assertion.

- [ ] **Step 3: Commit**

```bash
git add e2e/resume-a4.spec.ts
git commit -m "test: e2e coverage for A4 resume sheets and pagination"
```

---

### Task 7: Manual verification + regression sweep

**Files:** none (verification only — spec scope for /admin and /blog is verify-only, no redesign)

- [ ] **Step 1: Manual artifact checks** (dev server: `npm run dev`)

1. Open `/chat`, click a starter chip → panel slides in at ~60% width; white sheets on dark canvas; pages grow live while streaming.
2. Panel chrome: close `»` hides panel; Preview/Data tabs switch; Print button opens print dialog.
3. Print preview (Cmd+P): only white A4 pages, one per sheet, matching screen page-for-page; no app chrome; no scale shrinkage.
4. New chat → empty state renders inside a single white sheet; during generation the skeleton renders inside a single white sheet.
5. Narrow the window: sheets scale down to fit; below `md` the panel overlays full-width.
6. Reload → session restores with sheets intact; sidebar conversation switching works.

- [ ] **Step 2: Regression sweep — /admin and /blog**

Click through and confirm render + navigation (no visual change expected):
- `/admin`: login, blog CRUD, analytics, series, contact
- `/blog`: index, post page, tag, type, series, search

- [ ] **Step 3: Full check + existing e2e**

Run: `npx tsc --noEmit && npx playwright test`
Expected: tsc exit 0; all Playwright specs pass (including pre-existing `e2e/home.spec.ts`).

- [ ] **Step 4: Final commit if any fixups were needed**

```bash
git add -A && git commit -m "fix: A4 panel polish from manual verification"
```

(Skip if working tree is clean.)

---

## Self-Review (completed)

- **Spec coverage:** layout 60% (Task 5), pager + constants + orphan rule + scale + 150 ms debounce (Task 2), print palette restyle + header-as-block + A4 typography (Tasks 1, 3), print path (Task 4), error handling — oversized block clips on own page (Task 2 `packBlocks`), empty/skeleton on single sheet (Tasks 1, 3) — tests: tsc gates every task, Playwright sheet/ratio/multi-sheet (Task 6), manual + regression (Task 7). ✓
- **Placeholder scan:** every code step contains complete code; no TBDs. ✓
- **Type consistency:** `PagerBlock { key, kind, element }` defined in Task 2, consumed identically in Task 3; block component names match between Tasks 1 and 3; `.a4-sheet` / `.a4-sheet-wrap` / `.a4-print-root` class names match between Tasks 2, 4, and 6. ✓
