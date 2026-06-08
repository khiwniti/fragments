# Codebase Structure

**Analysis Date:** 2026-06-08
**Previous:** 2026-06-07

## Directory Layout

```
fragments/
├── app/                    # Next.js App Router pages + API routes
├── components/            # React UI components
│   ├── ui/                 # shadcn/ui primitive components
│   ├── landing/            # Landing page section components
│   ├── resume/             # Resume-specific components
│   ├── blog/               # Blog components
│   ├── admin/              # Admin components
│   └── kg/                 # Knowledge graph components
├── lib/                    # Business logic, clients, utilities
│   ├── auth/               # Auth submodules
│   ├── blog/               # Blog logic
│   ├── embeddings/         # Embedding utilities
│   └── kg/                 # Knowledge graph logic
├── e2e/                    # Playwright E2E tests
├── data/                   # Static data files
├── docs/                   # Documentation
├── public/                 # Static assets
├── sandbox-templates/      # Template files for sandbox
├── supabase/               # Supabase migrations/config
├── .env.template           # Environment template
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── playwright.config.ts    # Playwright configuration
├── package.json            # NPM dependencies
└── components.json         # shadcn/ui component registry
```

## Directory Purposes

**`app/` (Page Layer):**
- Purpose: Next.js App Router pages and API route handlers
- Contains: `page.tsx` (landing), `chat/page.tsx` (main chat), `about/`, `blog/`, `admin/`, `projects/`, `kg/`, and API route subdirectories
- Key files: `app/page.tsx`, `app/chat/page.tsx`, `app/layout.tsx`

**`components/` (UI Layer):**
- Purpose: Reusable React components
- Contains: Chat UI, preview panels, auth dialogs, landing widgets, resume artifacts
- Key files: `components/chat.tsx`, `components/chat-input.tsx`, `components/preview.tsx`, `components/resume-preview.tsx`, `components/navbar.tsx`

**`components/landing/` (Landing Page Widgets):**
- Purpose: Individual sections of the landing page
- Contains: HeroChat, ProjectsWidget, DomainsWidget, SkillsWidget, CareerWidget, OpenSourceWidget, ContactWidget, data.ts
- Key files: `components/landing/hero-chat.tsx`, `components/landing/data.ts`

**`components/ui/` (Primitive Components):**
- Purpose: shadcn/ui base components (Button, Dialog, etc.)
- Contains: Generated shadcn components
- Key files: `components/ui/button.tsx`, `components/ui/dialog.tsx`

**`lib/` (Business Logic Layer):**
- Purpose: Core business logic, API clients, utilities
- Contains: Auth, storage, schema, models, prompts, messages, knowledge
- Key files: `lib/auth.ts`, `lib/storage.ts`, `lib/schema.ts`, `lib/models.ts`, `lib/resume-agent-client.ts`, `lib/knowledge.ts`

**`lib/auth/` (Auth Submodule):**
- Purpose: Authentication helpers
- Contains: `admin-session.ts`
- Key files: `lib/auth/admin-session.ts`

**`e2e/` (End-to-End Tests):**
- Purpose: Playwright E2E test specifications
- Contains: Test files like `resume-a4.spec.ts`
- Key files: `e2e/resume-a4.spec.ts`

## Key File Locations

**Entry Points:**
- `/`: `app/page.tsx` — Landing page
- `/chat`: `app/chat/page.tsx` — Main chat interface
- `/about`, `/blog`, `/admin`, `/projects`, `/kg`: Respective page directories

**API Routes:**
- `/api/chat/route.ts` — Fragment generation endpoint
- **`/api/copilotkit/[[...slug]]/route.ts`** — CopilotKit runtime endpoint for resume agent
- `/api/sandbox/route.ts` — Sandbox execution
- `/api/ai/edit/route.ts`, `/api/ai/image/route.ts` — AI sub-endpoints
- `/api/profile/route.ts` — Profile data
- `/api/domains/route.ts`, `/api/skills/route.ts`, `/api/projects/route.ts` — Portfolio APIs

**Core Libraries:**
- `lib/auth.ts` — Supabase auth hook
- `lib/storage.ts` — localStorage session management
- `lib/schema.ts` — Zod validation schemas
- `lib/messages.ts` — Message type definitions
- `lib/models.ts` — LLM model configuration
- **`lib/resume-agent.ts`** — CopilotKit BuiltInAgent definition (NVIDIA NIM)
- `lib/resume-agent-client.ts` — Graph-RAG backend client (`getEnrichedContext`)
- `lib/knowledge.ts` — Static knowledge context builder

**Configuration:**
- `app/layout.tsx` — Root layout with providers
- `app/providers.tsx` — Theme + PostHog providers
- `next.config.mjs` — Next.js config
- `tailwind.config.ts` — Tailwind theme
- `tsconfig.json` — TypeScript paths (`@/` alias)

## Naming Conventions

**Files:**
- PascalCase for components: `ChatInput.tsx`, `ResumePreview.tsx`, `AuthDialog.tsx`
- kebab-case for directories: `components/landing/`, `lib/auth/`, `app/api/chat/`
- camelCase for utilities: `storage.ts`, `messages.ts`, `ratelimit.ts`
- kebab-case for API route directories: `app/api/chat/route.ts`

**Directories:**
- Lowercase for lib subdirs: `lib/auth/`, `lib/blog/`
- Lowercase for page directories: `app/chat/`, `app/blog/`
- kebab-case for route subdirs: `app/api/resume-chat/`

**Types/Functions:**
- camelCase for functions/hooks: `useAuth`, `getOrCreateAnonId`, `persistSession`
- PascalCase for types/schemas: `FragmentSchema`, `ResumeContentSchema`, `Message`
- PascalCase for React components: `Chat`, `Preview`, `ResumeArtifact`
- Uppercase for constants: `ANON_ID_KEY`, `SESSION_PREFIX`

## Where to Add New Code

**New Feature/Page:**
- Page component: `app/<feature>/page.tsx`
- API routes: `app/api/<feature>/route.ts`
- Components: `components/<feature>/`
- Lib utilities: `lib/<feature>.ts` or `lib/<feature>/`

**New Chat Mode (e.g., Interview Mode):**
- Primary code: `lib/schema.ts` (add new Zod schema), `app/api/<mode>/route.ts`
- Tests: `e2e/<mode>.spec.ts`

**New API Endpoint:**
- Implementation: `app/api/<resource>/route.ts`
- Client helper: `lib/<resource>.ts` (if needed)

**New UI Component:**
- Primitive: `components/ui/<component>.tsx` (via shadcn)
- Composite: `components/<feature>/<Component>.tsx`
- Tests: `e2e/<component>.spec.ts` (if E2E)

**Utilities/Helpers:**
- Shared helpers: `lib/utils.ts`
- Specific helpers: `lib/<domain>.ts` (e.g., `lib/ratelimit.ts`, `lib/duration.ts`)

## Special Directories

**`components/ui/`:**
- Purpose: shadcn/ui component registry
- Generated: Yes (via `npx shadcn@latest add`)
- Committed: Yes

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (via `next build`)
- Committed: No (in `.gitignore`)

**`public/`:**
- Purpose: Static assets served as `/<file>`
- Generated: No
- Committed: Yes

**`sandbox-templates/`:**
- Purpose: Template files for code sandbox execution
- Generated: No
- Committed: Yes

**`supabase/`:**
- Purpose: Supabase migrations and config
- Generated: No
- Committed: Yes

**`.planning/codebase/` (GSD Planning):**
- Purpose: GSD codebase mapping documents
- Generated: Yes (by GSD map-codebase agent)
- Committed: Yes (version-controlled planning docs)

---

*Structure analysis: 2026-06-07*