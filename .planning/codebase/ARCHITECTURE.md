<!-- refreshed: 2026-06-07 -->
# Architecture

**Analysis Date:** 2026-06-07

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Browser / Client                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router (Server + Client Components)            │
│  `app/`                                                     │
├──────────────┬──────────────────────────┬──────────────────┤
│   Landing    │       Chat Page           │    API Routes    │
│  `app/page` │   `app/chat/page.tsx`     │   `app/api/*`    │
└──────┬───────┴──────────┬───────────────┴────────┬─────────┘
       │                  │                        │
       ▼                  ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     Component Layer                          │
│   `components/`  +  `components/landing/`                   │
│   Chat UI · Preview · Resume · Auth · Blog · Admin          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       Library Layer                          │
│                     `lib/`                                  │
│  auth.ts · storage.ts · messages.ts · schema.ts · models    │
│  resume-agent-client.ts · knowledge.ts · utils.ts           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  Supabase (Auth + Database) · Vercel AI SDK · Resume Agent  │
│  Graph-RAG Backend                                          │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Landing Page | Portfolio landing with widgets | `app/page.tsx` |
| Chat Page | Chat interface with session management | `app/chat/page.tsx` |
| Chat UI | Message rendering + starter chips | `components/chat.tsx` |
| Chat Input | Message composition + file upload | `components/chat-input.tsx` |
| Preview Panel | Fragment code/preview rendering | `components/preview.tsx` |
| Resume Preview | Resume artifact rendering | `components/resume-preview.tsx` |
| Auth Hook | Supabase session + team management | `lib/auth.ts` |
| Storage | localStorage session persistence | `lib/storage.ts` |
| Schema | Zod validation schemas | `lib/schema.ts` |
| Resume Agent Client | Graph-RAG backend integration | `lib/resume-agent-client.ts` |
| Knowledge | Static resume context | `lib/knowledge.ts` |

## Pattern Overview

**Overall:** Next.js App Router with client-side AI SDK, dual-mode operation (fragment generation vs resume chat)

**Key Characteristics:**
- App Router with `'use client'` directive for interactive components
- Vercel AI SDK `streamObject` for LLM-structured output
- Supabase Auth for authentication
- localStorage for session persistence (anonymous-first, auth-enhanced)
- Dual endpoint routing: `/api/chat` (fragments) vs `/api/resume-chat` (resume content)
- Static knowledge fallback when resume-agent backend is unavailable

## Layers

**App Layer (`app/`):**
- Purpose: Route handlers and page components
- Location: `app/`
- Contains: Page components, API routes, layout
- Depends on: `lib/`, `components/`
- Used by: Browser router

**API Routes Layer (`app/api/`):**
- Purpose: Server-side request handlers
- Location: `app/api/*/route.ts`
- Contains: Chat endpoints, AI endpoints, profile/domains/skills/projects APIs
- Depends on: `lib/` (models, prompt, ratelimit, schema)
- Used by: Client components via fetch

**Component Layer (`components/`):**
- Purpose: Reusable UI primitives and page sections
- Location: `components/`, `components/landing/`, `components/ui/`, `components/resume/`
- Contains: Chat, Preview, Auth, NavBar, Landing widgets
- Depends on: `lib/`, `components/ui/` (shadcn)
- Used by: `app/page.tsx`, `app/chat/page.tsx`

**Library Layer (`lib/`):**
- Purpose: Business logic, data fetching, utilities
- Location: `lib/`
- Contains: Auth, storage, schema, models, prompts, API clients, knowledge
- Depends on: External services (Supabase, resume-agent)
- Used by: All layers above

## Data Flow

### Primary Fragment Generation Path (Default)

1. **User submits** (`app/chat/page.tsx:229`) via `handleSubmit`
2. **Message state updated** — user message appended to `messages[]`
3. **`useObject` hook submits** to `/api/chat` endpoint
4. **API route handler** (`app/api/chat/route.ts:19`) validates + rate-limits
5. **AI SDK `streamObject`** calls LLM with template prompt
6. **Streamed response** returns to client
7. **`onFinish` callback** (`app/chat/page.tsx:166`) triggers sandbox execution
8. **Sandbox result** fetched from `/api/sandbox`
9. **Fragment preview panel** displays code + live preview

### Resume Chat Path (RESUME_MODE)

1. **User submits** to `/api/resume-chat` endpoint
2. **API route** (`app/api/resume-chat/route.ts`) builds knowledge context
3. **`resume-agent-client.ts`** fetches from graph-rag backend OR static fallback
4. **LLM streams structured `ResumeContentSchema`** via AI SDK
5. **Client `useObject` hook** receives parsed resume content
6. **`setResumeContent` state** triggers artifact panel display
7. **Session persisted** to localStorage via `persistSession`

### Session Persistence Flow

1. **`restoreActiveSession`** on mount loads saved session from localStorage
2. **Auto-persist on message change** — debounced 1s via `useEffect`
3. **Immediate persist on resume content change** — no debounce
4. **`startNewSession`** clears active ID for fresh session

## Key Abstractions

**Message abstraction (`lib/messages.ts`):**
- Purpose: Unified message shape for chat, supporting text/images/code
- Examples: `app/chat/page.tsx`, `components/chat.tsx`
- Pattern: Array of content blocks with discriminated union

**Fragment schema (`lib/schema.ts`):**
- Purpose: Zod schema for structured LLM output in fragment mode
- Examples: `app/api/chat/route.ts`, `components/preview.tsx`
- Pattern: Zod object with `streamObject` from AI SDK

**Session storage (`lib/storage.ts`):**
- Purpose: localStorage-based session persistence
- Examples: `app/chat/page.tsx`
- Pattern: Index + individual session keys, UUID-based

**Resume agent client (`lib/resume-agent-client.ts`):**
- Purpose: Fetch from graph-rag-resume-agent OR fallback to static
- Examples: `app/api/resume-chat/route.ts`
- Pattern: Parallel fetches with independent error handling, keyword-based routing

## Entry Points

**Landing page:**
- Location: `app/page.tsx`
- Triggers: Direct URL navigation (`/`)
- Responsibilities: Portfolio showcase, widget rendering, auth dialog

**Chat page:**
- Location: `app/chat/page.tsx`
- Triggers: Navigation to `/chat` or landing page CTA
- Responsibilities: Full chat interface, session management, dual-mode rendering

**API routes:**
- Location: `app/api/*/route.ts`
- Triggers: Client fetch calls
- Responsibilities: Request handling, validation, rate limiting, AI SDK integration

## Architectural Constraints

- **Threading:** Node.js event loop (Next.js serverless functions). No worker threads detected.
- **Global state:** Supabase client singleton (`lib/supabase.ts`), auth session in React state
- **Circular imports:** Not detected in explored paths
- **Session storage:** localStorage only (no server-side session store). Anonymous-first design.
- **Rate limiting:** IP-based via `lib/ratelimit.ts`. Respects user's own API keys to bypass.

## Anti-Patterns

### Inline Session Restore Guard

**What happens:** `app/chat/page.tsx:102` checks `messages.length > 0` to prevent URL prompt override, but this guard may miss restored sessions that have empty messages initially.
**Why it's wrong:** The restore effect runs on mount, but the URL prompt effect also runs on mount — race condition if `messages.length === 0` during restoration.
**Do this instead:** Use a ref (`promptAppliedRef`) as already implemented (line 97), but verify it covers restored session path correctly.

### Environment Variable for Resume Mode

**What happens:** `app/chat/page.tsx:36` uses `NEXT_PUBLIC_RESUME_MODE !== 'false'` as a string comparison, making the env var effectively a boolean string rather than a proper boolean.
**Why it's wrong:** `process.env.NEXT_PUBLIC_RESUME_MODE` is always a string. Comparison works but is fragile — any value other than exactly `'false'` enables resume mode.
**Do this instead:** Use `process.env.NEXT_PUBLIC_RESUME_MODE !== 'false'` is acceptable but document the contract, or normalize with `String(process.env.NEXT_PUBLIC_RESUME_MODE) === 'true'`.

### Debounce Race on Resume Content

**What happens:** Resume content persists immediately but messages persist with 1s debounce (`app/chat/page.tsx:138-154`). If user submits new message during debounce, the old messages array overwrites with stale session.
**Why it's wrong:** Resume content is newer but messages might be stale on persist.
**Do this instead:** Ensure `persistSession` always merges with existing session data rather than replacing, or use a single `useEffect` that persists both together.

## Error Handling

**Strategy:** Try-finally with typed error responses

**Patterns:**
- API routes use `handleAPIError` (`lib/api-errors.ts`) to return structured JSON errors
- Client `onError` callback in `useObject` sets `errorMessage` state
- Rate limit responses return 429 with retry info via `createRateLimitResponse`
- Resume agent client silently falls back to static context on any fetch failure

## Cross-Cutting Concerns

**Logging:** `console.log` in API routes for debugging. `console.warn` for expected failures (rate limit, backend unavailable).
**Validation:** Zod schemas for all structured data (fragment, resume content). Runtime validation on API payloads.
**Authentication:** Supabase Auth. Session passed via `useAuth` hook. Optional `userID`/`teamID` sent to API routes.
**Rate Limiting:** IP-based via `lib/ratelimit.ts`. Configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW` env vars.

---

*Architecture analysis: 2026-06-07*