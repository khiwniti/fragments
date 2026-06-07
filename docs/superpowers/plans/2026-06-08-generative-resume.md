# Generative Resume (CopilotKit Shared State) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/chat` resume mode (useObject patch streaming) with a CopilotKit Built-in Agent shared-state generative resume: auto-created on load, clickable components that drive chat, hierarchical drill-down, highlight pings, anonymous fresh session per refresh, print outputs only the artifact.

**Architecture:** CopilotKit runtime v2 endpoint at `/api/copilotkit` hosts a TypeScript `BuiltInAgent` named `resume` with two server tools: `update_resume` (whole-state rewrite, recipe-example pattern) and `query_knowledge_graph` (wraps existing `lib/resume-agent-client.ts`). Frontend uses `useAgent` from `@copilotkit/react-core/v2`; resume canvas renders `agent.state.resume` with existing A4 renderers.

**Tech Stack:** Next.js 16 App Router, React 18.3, `@copilotkit/react-core` + `@copilotkit/runtime` 1.59.x, hono, zod, AI SDK model provider (existing env config), Supabase anonymous auth.

**Spec:** `docs/superpowers/specs/2026-06-08-generative-resume-design.md`

**Doc reference:** Use the `copilotkit-mcp` MCP server (`search-docs`, `explore-docs`) whenever an API signature is uncertain. Key pages: `integrations/built-in-agent` (quickstart + advanced-configuration), `integrations/built-in-agent/shared-state`, `reference/v2/hooks/useAgent`, `useConfigureSuggestions`.

---

### Task 1: Install CopilotKit dependencies, verify React 18 compatibility

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @copilotkit/react-core@1.59.5 @copilotkit/runtime@1.59.5 @ag-ui/client@0.0.53 hono @hono/node-server
```

If npm reports a peer-dependency conflict with `react@18.3.1`, find the newest 1.5x version supporting React 18 (check with `npm info @copilotkit/react-core@1.59.5 peerDependencies`, walk versions down) and install that instead. Record the pinned version in the commit message.

- [ ] **Step 2: Verify typecheck still clean**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add copilotkit runtime + react-core deps"
```

---

### Task 2: Extend resume schema with id/children + agent state type

**Files:**
- Modify: `lib/schema.ts` (ResumeItemSchema area, ~lines 79-120)

- [ ] **Step 1: Add recursive item schema and agent state**

In `lib/schema.ts`, replace the existing `ResumeItemSchema` definition with a recursive version and add agent-state types (keep all existing exports intact — other files import them):

```ts
export type ResumeItem = {
  id?: string
  label: string
  value?: string
  detail?: string
  tags?: string[]
  url?: string
  children?: ResumeItem[]
}

export const ResumeItemSchema: z.ZodType<ResumeItem> = z.lazy(() =>
  z.object({
    id: z.string().optional().describe('Stable kebab-case id for this item'),
    label: z.string(),
    value: z.string().optional(),
    detail: z.string().optional(),
    tags: z.array(z.string()).optional(),
    url: z.string().optional(),
    children: z
      .array(ResumeItemSchema)
      .optional()
      .describe('Hierarchical drill-down details for this item'),
  })
)
```

Then add below the existing `ResumeContentSchema`:

```ts
export const ResumeAgentStateSchema = z.object({
  resume: ResumeContentSchema,
  highlights: z
    .array(z.string())
    .default([])
    .describe('Ids of sections/items changed or expanded in the last turn'),
})

export type ResumeAgentState = z.infer<typeof ResumeAgentStateSchema>
```

Ensure section objects inside `ResumeContentSchema` include `id: z.string()` (the spec requires stable section ids; if the existing `ResumeSectionSchema` lacks `id`, add `id: z.string().describe('Stable kebab-case id')`). Update any construction sites that now fail typecheck by generating ids via the existing kebab-case helper in `lib/resume-sandbox.ts` (or `label.toLowerCase().replace(/[^a-z0-9]+/g, '-')` if none exists).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (fix any construction sites that now require `id`).

- [ ] **Step 3: Commit**

```bash
git add lib/schema.ts lib/resume-sandbox.ts
git commit -m "feat(schema): recursive resume items + ResumeAgentState"
```

---

### Task 3: CopilotKit runtime endpoint with Built-in Agent + tools

**Files:**
- Create: `app/api/copilotkit/[[...slug]]/route.ts`
- Create: `lib/resume-agent.ts`

- [ ] **Step 1: Confirm BuiltInAgent API via MCP docs**

Run `copilotkit-mcp` `search-docs` query: "BuiltInAgent quickstart tools createServerTool" and `explore-docs` for `integrations/built-in-agent/quickstart`. Confirm: import path, tool definition shape, how state-writing tools update shared state (the Built-in Agent docs show the canonical pattern). Adjust Step 2 code to match the documented API exactly — the code below is the expected shape, the docs are authoritative.

- [ ] **Step 2: Create the agent definition**

`lib/resume-agent.ts`:

```ts
import { BuiltInAgent } from '@copilotkit/runtime/v2'
import { z } from 'zod'
import { ResumeAgentStateSchema } from '@/lib/schema'
import { getEnrichedContext } from '@/lib/resume-agent-client'

const SYSTEM_PROMPT = `You are a resume agent for this portfolio site.
Rules:
1. ALWAYS call update_resume to create or modify the resume. Never describe changes without calling it.
2. Call query_knowledge_graph BEFORE writing facts (experience, projects, skills) — never invent facts.
3. On first run, generate a complete resume: summary, highlights, experience, projects, skills, education, certifications.
4. When the user asks about a specific item ("Tell me more about X"), answer in chat AND call update_resume adding a children[] hierarchy under that item with concrete sub-details, and set highlights to that item's id.
5. Give every section and item a stable kebab-case id. Preserve existing ids when updating.
6. Keep chat replies brief; the resume is the primary surface.`

export function createResumeAgent() {
  return new BuiltInAgent({
    model: process.env.COPILOT_MODEL ?? 'google/gemini-2.5-flash',
    prompt: SYSTEM_PROMPT,
    maxSteps: 5,
    tools: [
      {
        name: 'update_resume',
        description:
          'Write the ENTIRE resume state (full resume object + highlights array of changed ids). Always pass the complete resume, not a fragment.',
        parameters: ResumeAgentStateSchema,
        handler: async (state, { setState }) => {
          setState(ResumeAgentStateSchema.parse(state))
          return { status: 'success' }
        },
      },
      {
        name: 'query_knowledge_graph',
        description:
          'Query the portfolio knowledge graph for facts about the candidate (career, projects, skills, education). Call before writing resume facts.',
        parameters: z.object({
          question: z.string().describe('What you need to know'),
        }),
        handler: async ({ question }) => {
          const ctx = await getEnrichedContext(question)
          return ctx
        },
      },
    ],
  })
}
```

Note: the tool `handler` signature for state writing must match what Step 1's doc check found (some versions expose `setState` via a context arg, others have the agent merge a returned `state` field). Use the documented mechanism; keep schema parse before writing.

- [ ] **Step 3: Create the endpoint**

`app/api/copilotkit/[[...slug]]/route.ts` (pattern from `portfolio-mcp-ui/src/app/api/copilotkit/[[...slug]]/route.ts`):

```ts
import {
  CopilotRuntime,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from '@copilotkit/runtime/v2'
import { handle } from 'hono/vercel'
import { createResumeAgent } from '@/lib/resume-agent'

const runtime = new CopilotRuntime({
  agents: { resume: createResumeAgent() },
  runner: new InMemoryAgentRunner(),
})

const app = createCopilotEndpoint({ runtime, basePath: '/api/copilotkit' })

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
```

- [ ] **Step 4: Verify endpoint boots**

Run: `npm run dev` then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/copilotkit`
Expected: non-500 (200/404/405 acceptable — route mounted, no module errors in dev console).

- [ ] **Step 5: Commit**

```bash
git add app/api/copilotkit lib/resume-agent.ts
git commit -m "feat(agent): copilotkit runtime endpoint with resume BuiltInAgent"
```

---

### Task 4: Resume canvas component (render state, clicks, pings, children)

**Files:**
- Create: `components/resume-canvas.tsx`
- Modify: `components/resume/a4-blocks.tsx` (add children rendering + click/highlight props)

- [ ] **Step 1: Extend a4-blocks item renderer**

In `components/resume/a4-blocks.tsx`, give `SectionItemBlock` (and the section heading block) optional props:

```ts
interface InteractiveProps {
  onSelect?: (id: string, label: string) => void
  highlighted?: boolean
}
```

- Wrap item content in a `<button type="button">` (full-width, `text-left`, `cursor-pointer`, hover ring) calling `onSelect?.(item.id ?? item.label, item.label)`.
- When `highlighted`, add classes `ring-2 ring-amber-400 animate-pulse rounded-sm` (match repo Tailwind idiom).
- Render `item.children` recursively as an indented list (`pl-4 border-l border-muted`) of the same block, depth-limited to 3.
- Print safety: buttons must not introduce default styling in print — add `print:ring-0 print:animate-none`.

- [ ] **Step 2: Create the canvas**

`components/resume-canvas.tsx`:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import {
  useAgent,
  UseAgentUpdate,
  useCopilotKit,
  useConfigureSuggestions,
} from '@copilotkit/react-core/v2'
import type { ResumeAgentState } from '@/lib/schema'
// reuse the existing A4 pager/blocks the way components/resume-artifact.tsx does today

export function ResumeCanvas() {
  const { agent } = useAgent({
    agentId: 'resume',
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  })
  const { copilotkit } = useCopilotKit()
  const state = agent.state as ResumeAgentState | undefined
  const bootstrapped = useRef(false)

  useConfigureSuggestions({
    suggestions: [
      { title: 'Focus on AI projects', message: 'Rewrite the resume focused on AI/ML projects.' },
      { title: 'Make it one page', message: 'Condense the resume to one page.' },
      { title: 'Highlight leadership', message: 'Emphasize leadership and impact.' },
    ],
    available: 'always',
  })

  // Auto-create on first load (fresh session every refresh)
  useEffect(() => {
    if (bootstrapped.current || state?.resume?.sections?.length) return
    bootstrapped.current = true
    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Create my resume with all necessary information.',
    })
    copilotkit.runAgent({ agent })
  }, [agent, copilotkit, state?.resume?.sections?.length])

  const ask = (id: string, label: string) => {
    if (agent.isRunning) return
    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: `Tell me more about "${label}". Expand it in the resume with sub-details.`,
    })
    copilotkit.runAgent({ agent })
  }

  const highlights = new Set(state?.highlights ?? [])

  if (!state?.resume?.sections?.length) {
    return <ResumeSkeleton /> // simple pulse skeleton, defined in this file
  }

  return (
    <div id="resume-print-root" className="mx-auto w-full max-w-[210mm]">
      {/* Render via existing A4 pager, passing onSelect={ask} and
          highlighted={highlights.has(item.id ?? item.label)} down to blocks */}
    </div>
  )
}
```

Fill in the A4 rendering by lifting the body of `components/resume-artifact.tsx` (it already maps `sections` → pager blocks); thread `onSelect`/`highlighted` through. Define `ResumeSkeleton` as a few `animate-pulse` gray bars plus the text "Generating your resume…".

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/resume-canvas.tsx components/resume/a4-blocks.tsx
git commit -m "feat(resume): interactive shared-state canvas with drill-down + pings"
```

---

### Task 5: Rebuild chat page resume mode on CopilotKit

**Files:**
- Modify: `app/chat/page.tsx`
- Modify: `lib/auth.ts` (anonymous sign-in)

- [ ] **Step 1: Anonymous sign-in on load**

In `lib/auth.ts`, where the session is fetched (`supabase.auth.getSession()`, ~line 45), add: if no session and supabase is configured, call `await supabase.auth.signInAnonymously()` and use the returned session. Keep the existing demo-session fallback when env vars are missing. Non-blocking: failures log a warning and fall through to the demo session.

- [ ] **Step 2: Replace resume mode UI**

In `app/chat/page.tsx`, when `isResumeMode`:
- Delete: `useObject` wiring (~line 266), `/api/resume-chat` endpoint use, `applyPatch` on-finish handler (~283-296), sandbox restore/seed/persist effects (~163-261), `showArtifactPanel` plumbing for resume, `ResumePreview` usage.
- Render instead:

```tsx
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-core/v2'
import '@copilotkit/react-core/v2/styles.css'
import { ResumeCanvas } from '@/components/resume-canvas'

// inside ChatPageInner, resume mode branch:
return (
  <CopilotKit runtimeUrl="/api/copilotkit" agent="resume" showDevConsole={false}>
    <main className="flex min-h-screen flex-col">
      <NavBar /* keep existing props; add Print button calling window.print() */ />
      <div className="flex-1 overflow-auto py-8 print:overflow-visible print:py-0">
        <ResumeCanvas />
      </div>
      <CopilotSidebar
        agentId="resume"
        defaultOpen
        labels={{ modalHeaderTitle: 'Resume Assistant' }}
      />
    </main>
  </CopilotKit>
)
```

Mobile: acceptable to ship `CopilotSidebar` for all viewports in this pass (it collapses); the share-state example's pull-up sheet is a follow-up, not in scope.
- Keep the non-resume chat mode untouched.
- No localStorage persistence for resume state — verify no `localStorage` writes remain in the resume branch.

- [ ] **Step 3: Typecheck + boot**

Run: `npx tsc --noEmit` then `npm run dev`; open `/chat`.
Expected: resume auto-generates; clicking an item sends a chat message and expands it with children + highlight ping; refresh starts over.

- [ ] **Step 4: Commit**

```bash
git add app/chat/page.tsx lib/auth.ts
git commit -m "feat(chat): resume mode on copilotkit shared state, anonymous sessions"
```

---

### Task 6: Print only the artifact

**Files:**
- Modify: `app/globals.css` (or the global stylesheet imported in `app/layout.tsx`)

- [ ] **Step 1: Add print rules**

```css
@media print {
  body * { visibility: hidden; }
  #resume-print-root, #resume-print-root * { visibility: visible; }
  #resume-print-root {
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    margin: 0; padding: 0;
  }
}
```

- [ ] **Step 2: Verify**

In the browser: Cmd+P on `/chat`. Expected: print preview shows ONLY the A4 resume pages — no navbar, chat, or buttons. Page breaks fall where the A4 pager places them.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(print): print/save outputs resume artifact only"
```

---

### Task 7: Remove dead legacy flow

**Files:**
- Delete: `app/api/resume-chat/route.ts`
- Modify: `lib/resume-sandbox.ts` (remove persistence + patch machinery if now unreferenced)
- Delete: `components/resume-preview.tsx` (if unreferenced)
- Modify: e2e specs referencing removed flows under `e2e/`

- [ ] **Step 1: Find references**

Run: `grep -rn "resume-chat\|resumePatchSchema\|applyPatch\|restoreActiveSession\|seedSandboxFromSnapshot\|ResumePreview" app components lib e2e --include='*.ts*'`
Delete each dead file/function only after confirming zero remaining imports. Keep anything the new flow still uses (e.g. kebab-id helper, A4 renderers).

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx next lint` — Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove legacy resume patch-streaming flow"
```

---

### Task 8: Final verification

- [ ] **Step 1: Full manual checklist** (use superpowers:verification-before-completion)

1. Hard refresh `/chat` → anonymous session created (check Supabase auth user is anonymous), resume auto-generates with all sections.
2. Click a project item → chat shows question + answer; item gains `children` sub-items; ping/glow on that item only.
3. Suggestion chips appear and work.
4. Cmd+P → only the resume artifact in preview.
5. Hard refresh again → brand-new resume session (no carried-over state).
6. Stop the knowledge-graph backend (or unset `RESUME_AGENT_URL`) → resume still generates from static fallback.

- [ ] **Step 2: Run e2e**

Run: `npx playwright test`
Expected: suites pass (excluding the pre-existing flaky tests catalogued in docs; update/remove specs tied to deleted flows).

- [ ] **Step 3: Final commit if fixes were needed**
