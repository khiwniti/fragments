# UX/UI Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Truly headless CopilotKit chat on `useAgent`, app-wide design-token consistency, and audit fixes (responsive/a11y/perf).

**Architecture:** Token foundation in `globals.css` first; new `components/chat-panel/` built on v2 `useAgent` + `runAgent` (same pattern as `resume-canvas.tsx:56`); then token sweep; then audit fixes. Zero CopilotKit CSS ships.

**Tech Stack:** Next.js App Router, Tailwind v4 (`@theme`), CopilotKit `@copilotkit/react-core/v2`, Playwright (+ `@axe-core/playwright`), react-markdown.

**Spec:** `docs/superpowers/specs/2026-06-09-ux-ui-enhancement-design.md`

---

### Task 1: Token foundation

**Files:** Modify `app/globals.css`, `DESIGN.md`

- [ ] **Step 1:** In `app/globals.css` `@theme` block (after line 31's radius vars), add:

```css
  --color-surface-elevated: hsl(var(--surface-elevated));
```

In both `:root` and `.dark` blocks add:

```css
  --surface-elevated: 216 30% 13%; /* #161e2a */
```

- [ ] **Step 2:** Replace the drifted rgba utilities (globals.css lines 123-126) with primary-derived ones:

```css
.text-accent-dim { color: hsl(var(--primary) / 0.5); }
.bg-accent-surface { background: hsl(var(--primary) / 0.05); }
.border-accent-hover { border-color: hsl(var(--primary) / 0.2); }
.glow-accent { box-shadow: 0 0 10px hsl(var(--primary) / 0.5); }
```

Also update `::selection` (line 105-108) to `background: hsl(var(--primary) / 0.3); color: hsl(var(--foreground));`.

- [ ] **Step 3:** Append a "Token Contract" section to DESIGN.md: components may use only semantic Tailwind classes (`bg-background|card|popover|secondary|accent|input|primary|destructive`, `text-foreground|muted-foreground|primary|…-foreground`, `border-border`, `ring`, `surface-elevated`); raw hex / `slate-*` / `indigo-*` forbidden except inside the A4 sheet print region (marked `/* A4 PRINT PALETTE — fixed by design */`).

- [ ] **Step 4:** Run `npm run build` — expect success. Visual smoke `npm run dev`, check `/`.

- [ ] **Step 5:** Commit: `git commit -m "feat(tokens): surface-elevated token, primary-derived accent utilities, token contract"`

### Task 2: Headless chat panel components

**Files:** Create `components/chat-panel/chat-panel.tsx`, `message-list.tsx`, `chat-input.tsx`, `suggestions.tsx`, `tool-render.tsx`. Run `npm i react-markdown`.

- [ ] **Step 1:** `components/chat-panel/tool-render.tsx` — generative-UI slot:

```tsx
'use client'
import type { Message } from '@copilotkit/react-core/v2'

type ToolCall = { id: string; function: { name: string; arguments: string } }

export function ToolRender({ toolCall }: { toolCall: ToolCall }) {
  let args: Record<string, unknown> = {}
  try { args = JSON.parse(toolCall.function.arguments || '{}') } catch {}
  return (
    <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-mono text-muted-foreground animate-fade-in">
      <span className="text-primary">{toolCall.function.name}</span>
      {Object.keys(args).length > 0 && (
        <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] opacity-80">{JSON.stringify(args, null, 2)}</pre>
      )}
    </div>
  )
}

export function extractToolCalls(m: Message): ToolCall[] {
  return ((m as { toolCalls?: ToolCall[] }).toolCalls ?? [])
}
```

- [ ] **Step 2:** `components/chat-panel/message-list.tsx` — mirror `components/chat.tsx` bubble tokens:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { LoaderIcon } from 'lucide-react'
import type { Message } from '@copilotkit/react-core/v2'
import { ToolRender, extractToolCalls } from './tool-render'

export function MessageList({ messages, isRunning, error, onRetry }: {
  messages: Message[]; isRunning: boolean; error: string | null; onRetry: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }) }, [messages.length, isRunning])
  return (
    <div ref={ref} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" aria-live="polite" aria-label="Chat messages">
      {messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => {
        const isUser = m.role === 'user'
        const text = typeof m.content === 'string' ? m.content : ''
        const tools = isUser ? [] : extractToolCalls(m)
        return (
          <div key={m.id} className={`flex flex-col gap-2 max-w-[90%] ${isUser ? 'self-end' : 'self-start'}`}>
            {text && (
              <div className={`px-4 py-3 rounded-2xl text-sm ${isUser
                ? 'bg-primary/10 text-foreground border border-primary/20'
                : 'bg-secondary text-secondary-foreground border border-border'}`}>
                {isUser ? <span className="whitespace-pre-wrap break-words">{text}</span>
                  : <div className="prose prose-sm prose-invert max-w-none [&_code]:text-primary"><ReactMarkdown>{text}</ReactMarkdown></div>}
              </div>
            )}
            {tools.map(tc => <ToolRender key={tc.id} toolCall={tc} />)}
          </div>
        )
      })}
      {isRunning && (
        <div className="flex items-center gap-2 self-start text-sm text-muted-foreground" role="status">
          <LoaderIcon className="w-4 h-4 animate-spin motion-reduce:animate-none" /><span>Thinking…</span>
        </div>
      )}
      {error && (
        <div className="self-stretch rounded-lg border border-destructive/40 bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground">
          {error}
          <button onClick={onRetry} className="ml-2 underline decoration-dotted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded">Retry</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3:** `components/chat-panel/chat-input.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function ChatInput({ onSend, disabled }: { onSend: (t: string) => void; disabled: boolean }) {
  const [value, setValue] = useState('')
  function submit() {
    const t = value.trim()
    if (!t || disabled) return
    onSend(t); setValue('')
  }
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
        <textarea
          rows={1} value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          placeholder="Ask about this resume…" aria-label="Chat message"
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-32"
        />
        <button onClick={submit} disabled={disabled || !value.trim()} aria-label="Send message"
          className="rounded-lg bg-primary text-primary-foreground p-1.5 disabled:opacity-30 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4:** `components/chat-panel/suggestions.tsx` (static starter prompts):

```tsx
'use client'
const STARTERS = [
  'Summarize this resume in 3 bullets',
  'What are the strongest AI/agent projects?',
  'Improve the experience section',
]
export function Suggestions({ onPick, visible }: { onPick: (t: string) => void; visible: boolean }) {
  if (!visible) return null
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {STARTERS.map(s => (
        <button key={s} onClick={() => onPick(s)}
          className="rounded-full border border-border bg-transparent px-4 py-2 text-xs text-foreground hover:border-primary/30 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring">
          {s}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5:** `components/chat-panel/chat-panel.tsx` — the useAgent wiring (mirrors `resume-canvas.tsx:56` + react-native `CopilotChat.tsx` submit pattern):

```tsx
'use client'
import { useCallback, useState } from 'react'
import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { Suggestions } from './suggestions'
import { MessageSquare, X } from 'lucide-react'

export function ChatPanel() {
  const { agent } = useAgent({ agentId: 'resume' })
  const { copilotkit } = useCopilotKit()
  const [error, setError] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isRunning = agent.isRunning

  const send = useCallback(async (text: string) => {
    if (!text || isRunning) return
    setError(null)
    agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: text })
    try { await copilotkit.runAgent({ agent }) }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') }
  }, [agent, copilotkit, isRunning])

  const retry = useCallback(() => {
    setError(null)
    copilotkit.runAgent({ agent }).catch(e =>
      setError(e instanceof Error ? e.message : 'Something went wrong'))
  }, [agent, copilotkit])

  const panel = (
    <div className="flex h-full w-full flex-col bg-card">
      <MessageList messages={agent.messages ?? []} isRunning={isRunning} error={error} onRetry={retry} />
      <Suggestions visible={(agent.messages ?? []).length === 0} onPick={send} />
      <ChatInput onSend={send} disabled={isRunning} />
    </div>
  )

  return (
    <>
      {/* Desktop: fixed right column */}
      <aside className="hidden md:flex w-[380px] shrink-0 border-l border-border h-dvh sticky top-0">{panel}</aside>
      {/* Mobile: slide-over */}
      <button onClick={() => setMobileOpen(true)} aria-label="Open chat"
        className="md:hidden fixed bottom-4 right-4 z-40 rounded-full bg-primary text-primary-foreground p-3 shadow-lg focus-visible:ring-2 focus-visible:ring-ring">
        <MessageSquare className="w-5 h-5" />
      </button>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-background/60" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="w-[88%] max-w-[380px] border-l border-border relative">
            <button onClick={() => setMobileOpen(false)} aria-label="Close chat"
              className="absolute top-3 right-3 z-10 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              <X className="w-4 h-4" />
            </button>
            {panel}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 6:** `npm i react-markdown` then `npm run build` → success. Commit: `feat(chat): headless chat-panel components on useAgent`

### Task 3: Rewire /chat page, delete CopilotKit CSS

**Files:** Modify `app/chat/page.tsx`, `app/layout.tsx`, `package.json`; Delete `app/copilotkit-overrides.css`

- [ ] **Step 1:** Replace `app/chat/page.tsx` entirely:

```tsx
'use client'

import { CopilotKit } from '@copilotkit/react-core/v2'
import { ResumeCanvas } from '@/components/resume-canvas'
import { ChatPanel } from '@/components/chat-panel/chat-panel'

export default function ChatPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="resume">
      <div className="flex min-h-dvh w-full bg-background">
        <div className="flex-1 overflow-y-auto print:p-0">
          <div className="mx-auto max-w-[210mm] pt-4 pb-8">
            <ResumeCanvas />
          </div>
        </div>
        <ChatPanel />
      </div>
    </CopilotKit>
  )
}
```

- [ ] **Step 2:** In `app/layout.tsx` remove line 2 (`import './copilotkit-overrides.css'`). Delete file `app/copilotkit-overrides.css`. In `app/globals.css` remove the `.copilotKitSidebarContentWrapper` print rule (lines 192-195) — panel is ours now; instead the print CSS already hides everything outside `#resume-print-root`.

- [ ] **Step 3:** `npm uninstall @copilotkit/react-ui`. Gate: `grep -rn "@copilotkit/react-ui" app components lib package.json` → zero hits.

- [ ] **Step 4:** `npm run build` → success. Manual smoke: `/chat` sends a message, response streams, ResumeCanvas still updates via shared state.

- [ ] **Step 5:** Commit: `feat(chat): truly headless /chat — remove react-ui sidebar, overrides CSS, v1 dep`

### Task 4: Token sweep — resume-canvas + a4-blocks (audit P1 #2)

**Files:** Modify `components/resume-canvas.tsx` (≈lines 157-167, 209-221, 229-253), `components/resume/a4-blocks.tsx` (≈lines 75-85)

- [ ] **Step 1:** Apply mapping to all **outer** (non-A4-sheet) elements in both files:

| From | To |
|---|---|
| `bg-white` | `bg-card` |
| `bg-slate-50` | `bg-secondary` |
| `text-slate-500`/`text-slate-400` | `text-muted-foreground` |
| `text-slate-700`/`text-slate-900` | `text-foreground` |
| `border-slate-200`/`border-slate-300` | `border-border` |
| `indigo-*` (any) | `primary` equivalents (`bg-primary`, `text-primary`, `border-primary/30`, `bg-primary/10`) |
| `shadow-xl` on popover | `shadow-lg border border-border bg-popover` |

Locate every instance: `grep -n 'slate-\|indigo-\|bg-white' components/resume-canvas.tsx components/resume/a4-blocks.tsx`. A4-sheet-internal styles (inside the sheet render tree) keep fixed colors — add comment `{/* A4 PRINT PALETTE — fixed by design */}` at the sheet root in each file.

- [ ] **Step 2:** Gate: re-run the grep — remaining hits must all be inside the commented A4 region. `npm run build` → success. Visual check `/chat` dark theme: no white outer panels, accent is emerald only.

- [ ] **Step 3:** Commit: `fix(theme): resume outer UI on project tokens, kill indigo accent`

### Task 5: Token sweep — landing, navbar, remaining components

**Files:** Modify any hits in `components/landing/*`, `components/navbar.tsx`, `components/auth*.tsx`, `components/resume/*.tsx`, `app/**/*.tsx`

- [ ] **Step 1:** `grep -rn 'slate-\|indigo-\|#[0-9a-f]\{6\}\|rgba(52' components app --include='*.tsx' | grep -v 'A4 PRINT'` — apply Task 4's mapping table to each hit. For SVG chart colors in `components/resume/*.tsx` on-screen UI use `hsl(var(--primary))`, `hsl(var(--muted-foreground))`, `hsl(var(--border))`, or `hsl(var(--chart-1..5))`; print-side stays fixed.

- [ ] **Step 2:** Final gate: same grep returns only documented A4 exceptions. `npm run build` → success.

- [ ] **Step 3:** Commit: `fix(theme): app-wide token sweep — zero raw colors outside A4 print palette`

### Task 6: Responsive SVGs (audit P1 #1)

**Files:** Modify `components/resume/tech-radar.tsx:106`, `contribution-heatmap.tsx:155`, `language-chart.tsx:81`, `architecture-explorer.tsx:148`

- [ ] **Step 1:** For each fixed-size SVG, adopt the `a4-pager.tsx` pattern: wrap in a measured container and scale via viewBox. Template (adapt SIZE per component — 240, 270, 260, 252):

```tsx
const wrapRef = useRef<HTMLDivElement>(null)
const [w, setW] = useState(SIZE)
useLayoutEffect(() => {
  const el = wrapRef.current; if (!el) return
  const ro = new ResizeObserver(([e]) => setW(Math.min(SIZE, e.contentRect.width)))
  ro.observe(el); return () => ro.disconnect()
}, [])
// render:
<div ref={wrapRef} className="w-full max-w-full">
  <svg width={w} height={w * (H / SIZE)} viewBox={`0 0 ${SIZE} ${H}`} className="max-w-full">
```

Heatmap exception: keep natural width, wrap in `<div className="overflow-x-auto">` (52-week grid can't shrink).

- [ ] **Step 2:** For each interactive SVG element (radar points, heatmap cells, chart bars, explorer nodes) add an invisible hit target: `<rect x={cx-22} y={cy-22} width="44" height="44" fill="transparent" />` sharing the same handlers (or `pointerEvents="all"` padding shape).

- [ ] **Step 3:** Verify: dev server, viewport 375px (devtools) on `/chat` — no horizontal overflow except heatmap's own scroll container. Commit: `fix(responsive): measured-width SVGs + 44px hit targets`

### Task 7: A11y fixes (audit P2 #3-4)

**Files:** Modify `components/resume/a4-blocks.tsx:114-121`, `components/resume/skill-stat-card.tsx:165`

- [ ] **Step 1:** TechBadge keyboard activation — add to the `role="button"` element:

```tsx
onKeyDown={e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTechFocus?.(tag) }
}}
```

- [ ] **Step 2:** SkillStatCard toggle: add `aria-expanded={isVisible}` (match the actual state var name at line 165) and `aria-controls` pointing to the details container's `id`.

- [ ] **Step 3:** Sweep other collapsibles/popovers found in Task 5's grep for the same two patterns (popover triggers get `aria-expanded` + Escape-to-close if missing). Commit: `fix(a11y): keyboard activation + aria-expanded on resume interactives`

### Task 8: Perf fixes (audit P2 #5-7)

**Files:** Modify `components/resume/contribution-heatmap.tsx:228-240`, `language-chart.tsx:221-229`, `claim-density.tsx`

- [ ] **Step 1:** Heatmap → CSS tooltip: remove `tooltip` state + `onMouseEnter`/`onMouseLeave`; give each cell `data-tip={`${count} contributions · ${date}`}` and add scoped CSS (component-level `<style>` or globals):

```css
.heatmap-cell { position: relative; }
.heatmap-cell:hover::after {
  content: attr(data-tip); position: absolute; bottom: 125%; left: 50%; transform: translateX(-50%);
  white-space: nowrap; padding: 4px 8px; border-radius: 6px; font-size: 11px;
  background: hsl(var(--popover)); color: hsl(var(--popover-foreground));
  border: 1px solid hsl(var(--border)); pointer-events: none; z-index: 10;
}
```

(SVG variant: wrap cells in `<foreignObject>`-free approach — if cells are `<rect>`, move tooltip to a sibling HTML layer using CSS anchor on a per-cell `<div>` grid instead; simplest: render the grid as HTML divs, which also helps Task 6.)

- [ ] **Step 2:** Language chart: render both variants, toggle visibility — `<div className={variant === 'bars' ? '' : 'hidden'}>` / inverse for donut; lift `hoveredIndex` state to the parent so it survives toggle.

- [ ] **Step 3:** ClaimDensity bar: change animated style from `width: X%` to fixed `width: 100%` + `transform: scaleX(X/100); transform-origin: left;` with `transition-transform`.

- [ ] **Step 4:** `npm run build` → success. Commit: `perf(resume): CSS heatmap tooltip, persistent chart variants, transform-based bar`

### Task 9: e2e tests + final gates

**Files:** Create `e2e/chat.spec.ts`; run `npm i -D @axe-core/playwright`

- [ ] **Step 1:** Write `e2e/chat.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('chat panel renders and sends', async ({ page }) => {
  await page.goto('/chat')
  const input = page.getByLabel('Chat message')
  await expect(input).toBeVisible()
  await input.fill('hello')
  await page.getByLabel('Send message').click()
  await expect(page.getByLabel('Chat messages')).toContainText('hello')
})

test('no horizontal overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  for (const path of ['/', '/chat']) {
    await page.goto(path)
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})

test('chat panel a11y scan', async ({ page }) => {
  await page.goto('/chat')
  const results = await new AxeBuilder({ page }).include('aside').analyze()
  expect(results.violations).toEqual([])
})
```

- [ ] **Step 2:** `npx playwright test e2e/chat.spec.ts` → 3 passed (send test needs runtime env keys; mark `test.skip` on missing `process.env.E2B_API_KEY`-style guard consistent with `resume-sandbox.spec.ts` conventions).

- [ ] **Step 3:** Final gates, all must pass:

```bash
grep -rn 'slate-\|indigo-\|#[0-9a-f]\{6\}' components app --include='*.tsx' | grep -v 'A4 PRINT'   # → empty
grep -rn '@copilotkit/react-ui' app components lib package.json                                    # → empty
npm run build                                                                                       # → success
npx playwright test                                                                                 # → pass
```

- [ ] **Step 4:** Commit: `test(e2e): chat smoke, mobile overflow, axe scan + final token gates`
