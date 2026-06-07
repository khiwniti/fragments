# Generative Resume with Shared State (CopilotKit Built-in Agent)

**Date:** 2026-06-08
**Status:** Approved design

## Goal

Replace the `/chat` resume mode (useObject + `/api/resume-chat` patch streaming) with a fully generative, interactive resume built on CopilotKit shared state, modeled on the `share-state-gen-ui/` recipe example. Pure TypeScript — no Python/Google ADK; CopilotKit's **Built-in Agent** replaces the external ADK agent from `portfolio-mcp-ui/`.

## Decisions

1. **TypeScript-only** Built-in Agent (`@copilotkit/runtime` v2). No Python sidecar.
2. **Replaces** the existing `/chat` resume mode; old flow deleted once new one works.
3. **Click → auto-send**: clicking any resume component sends "Tell me more about <label>" to the agent; agent answers in chat and expands that item with `children` hierarchy in the resume.
4. **Knowledge graph as data source**: agent server tool wraps `lib/resume-agent-client.ts` (`getEnrichedContext`), which calls the graph-rag backend at `RESUME_AGENT_URL` and falls back to static knowledge context.
5. **Fresh session every refresh**: anonymous Supabase sign-in; no localStorage resume persistence; new CopilotKit thread per load.
6. **Print/Save outputs only the resume artifact**, never the surrounding page chrome.

## Architecture

### Server

- **`app/api/copilotkit/[[...slug]]/route.ts`** — CopilotKit runtime v2 endpoint (Hono `handle`, pattern from `portfolio-mcp-ui/src/app/api/copilotkit/[[...slug]]/route.ts`), `InMemoryAgentRunner`.
- **Agent `resume`** — `BuiltInAgent`, model via AI SDK (existing provider config; NVIDIA/Gemini), `maxSteps: 5`, system prompt instructing: always call `update_resume` for any resume change; consult `query_knowledge_graph` before inventing facts; on drill-down requests, add `children` to the targeted item and set `highlights`.
- **Server tools:**
  - `update_resume(state)` — writes the whole `ResumeAgentState` (recipe-example pattern: whole-state rewrite, not patches). Zod schema shared with frontend.
  - `query_knowledge_graph(question)` — wraps `getEnrichedContext()` from `lib/resume-agent-client.ts`; static fallback preserved.

### Shared state shape

```ts
type ResumeAgentState = {
  resume: {
    commentary: string
    focus: string
    sections: Array<{
      id: string            // stable kebab-case
      type: ResumeSectionType
      title: string
      items: ResumeItem[]   // ResumeItem gains: id?: string, children?: ResumeItem[]
    }>
  }
  highlights: string[]      // ids of items/sections the last turn touched
}
```

`ResumeItemSchema` in `lib/schema.ts` is extended with optional `id` and recursive `children` (zod `z.lazy`). Existing A4 renderers gain children rendering (indented sub-items).

### Frontend (`app/chat/page.tsx` rebuild, resume mode)

- Wrap in `<CopilotKit runtimeUrl="/api/copilotkit" agent="resume">`.
- Resume canvas (left/main): renders `agent.state.resume` using existing `components/resume/a4-pager.tsx` + `a4-blocks.tsx` renderers.
- Chat: `CopilotSidebar` on desktop, pull-up sheet on mobile (pattern from `share-state-gen-ui/page.tsx`).
- `useAgent({ agentId: "resume", updates: [OnStateChanged, OnRunStatusChanged] })`.
- **Auto-create:** on mount, if no resume in state, `agent.addMessage("Create my resume with all necessary information")` + `copilotkit.runAgent(...)` — resume generates without user action.
- **Highlight ping:** diff incoming state keys/ids against current (recipe-example `changedKeysRef` pattern) plus agent-provided `highlights[]`; matched components get a glow/ping animation while `agent.isRunning` or briefly after.
- **Click → chat:** every section heading and item is a button; click sends `agent.addMessage("Tell me more about \"<label>\" (<section title>)")` + run. Agent responds in chat and writes expanded `children` for that item + its id into `highlights`.
- **Suggestions:** `useConfigureSuggestions` with chips like "Focus on AI projects", "Make it one page", "Highlight leadership".

### Session

- On load: `supabase.auth.signInAnonymously()` if no session (anonymous sign-ins enabled in Supabase).
- No resume/sandbox localStorage persistence; CopilotKit thread is in-memory → every refresh starts a clean session and re-generates.
- Old `restoreActiveSession` / `seedSandboxFromSnapshot` / sandbox persistence removed.

### Print / Save

- Print button calls `window.print()`.
- Global print CSS: hide all page chrome, show only the A4 artifact positioned at the page origin:

```css
@media print {
  body * { visibility: hidden; }
  #resume-print-root, #resume-print-root * { visibility: visible; }
  #resume-print-root { position: absolute; inset: 0 auto auto 0; width: 100%; }
}
```

- The A4 pager keeps page-break behavior; outcome of Print/Save-as-PDF is the resume artifact only.

## New dependencies

- `@copilotkit/react-core` (v2 API + styles), `@copilotkit/runtime` (v2), `hono` + `@hono/node-server` (runtime endpoint handler). Versions aligned with `portfolio-mcp-ui/package.json` (`1.59.x`), verified compatible with the repo's React 18.3 — if the v2 UI components require React 19, pin the newest CopilotKit version that supports React 18 and note the constraint in the plan.

## Removal list (after new flow verified)

- `app/api/resume-chat/route.ts`
- `useObject` wiring + `resumePatchSchema` client flow in `app/chat/page.tsx`
- Sandbox localStorage persistence (`lib/resume-sandbox.ts` persistence parts; patch op machinery if unused)
- `components/resume-preview.tsx` tab shell (replaced by canvas; Print kept)

## Error handling

- `query_knowledge_graph` failure → tool returns static fallback context (existing behavior in `resume-agent-client.ts`); agent proceeds.
- Agent/tool error mid-run → chat shows the error message; resume keeps last good state (state only changes via `update_resume`).
- Anonymous sign-in failure → page still works (auth is non-blocking for resume generation), consistent with current demo-session fallback.

## Testing

- `npx tsc --noEmit` clean.
- Manual: auto-generate on load; click item → chat reply + children appear + highlight ping; suggestion chips work; print preview shows only the artifact; hard refresh yields a fresh session/resume.
- Existing e2e for removed flows updated or deleted.
