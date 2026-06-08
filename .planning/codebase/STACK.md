# Technology Stack

**Analysis Date:** 2026-06-08
**Previous:** 2026-06-07

## Languages

**Primary:**
- TypeScript 5.5.4 - All application code (Next.js, React components, API routes, lib utilities)

**Secondary:**
- CSS 8 - Styling with Tailwind CSS via PostCSS
- SQL - Database migrations and seed data

## Runtime

**Environment:**
- Node.js 22.2.0+ (Next.js 16.2.7 requires Node 18+)
- Next.js 16.2.7 runtime

**Package Manager:**
- npm 10+ (package-lock.json present)
- Lockfile: `package-lock.json` (v3, 474KB)

## Frameworks

**Core:**
- Next.js 16.2.7 - Full-stack React framework with App Router
- React 18.3.1 - UI library
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- Radix UI 1.x - Unstyled, accessible UI component primitives

**Testing:**
- Playwright 1.60.0 - E2E testing
- ESLint 8 - Code linting

**Build/Dev:**
- TypeScript 5.5.4 - Type checking and compilation
- PostCSS 8 - CSS processing
- Prettier - Code formatting (trivago plugin for import sorting)
- tsx 4.20.3 - TypeScript execution for scripts

## Key Dependencies

**AI/ML:**
- `ai` 6.0.195 - AI SDK for streaming LLM responses
- `@ai-sdk/react` 3.0.198 - React hooks for AI
- `@ai-sdk/openai` 3.0.67, `@ai-sdk/anthropic` 3.0.81, `@ai-sdk/google` 3.0.80, `@ai-sdk/google-vertex` 4.0.141, `@ai-sdk/mistral` 3.0.37, `@ai-sdk/fireworks` 2.0.53 - Multi-provider LLM integrations
- `ollama-ai-provider` 1.2.0 - Local Ollama models
- `openai` 6.42.0 - OpenAI client
- **NVIDIA: `createOpenAI` from `@ai-sdk/openai`** - For NVIDIA NIM inference (used in resume agent)
- `marked` 18.0.4 - Markdown parsing
- `neo4j-driver` 6.0.1 - Neo4j graph database
- `@e2b/code-interpreter` 1.0.2, `e2b` 2.8.4 - Code execution sandbox
- **`@copilotkit/runtime` 1.59.5** - CopilotKit runtime for shared agent state (v2 API with BuiltInAgent)
- **`@copilotkit/react-core` 1.59.5** - CopilotKit React hooks

**Rich Text Editing:**
- `@tiptap/react` 3.25.0, `@tiptap/starter-kit` 3.25.0 - Rich text editor
- Multiple Tiptap extensions for code blocks, images, links, tasks, etc.
- `tiptap-markdown` 0.9.0 - Markdown serialization
- `lowlight` 3.3.0, `prismjs` 1.30.0 - Syntax highlighting

**Database & Storage:**
- `@supabase/supabase-js` 2.50.0 - PostgreSQL via Supabase
- `jose` 6.2.3 - JWT handling

**Caching & Rate Limiting:**
- `@upstash/ratelimit` 2.0.1 - Rate limiting
- `@vercel/kv` 2.0.0 - Vercel KV for Redis-like storage

**Analytics:**
- `posthog-js` 1.158.3 - Product analytics

**UI Utilities:**
- `lucide-react` 0.396.0 - Icons
- `class-variance-authority` 0.7.0 - Variant handling
- `clsx` 2.1.1, `tailwind-merge` 2.5.2 - Class merging
- `tailwindcss-animate` 1.0.7 - Animation utilities
- **`tailwindcss` 4.3.0** - Upgraded from v3 for CopilotKit CSS compatibility
- **`@tailwindcss/postcss` 4.3.0** - Required for Tailwind v4
- `react-textarea-autosize` 8.5.3 - Auto-resize textarea

**Validation & Types:**
- `zod` 3.23.8 - Schema validation
- `hono` 4.12.23 - Hono backend (used for CopilotKit endpoint)
- `isomorphic-dompurify` 3.15.0 - XSS sanitization
- `nanoid` 5.1.6 - ID generation

**Other:**
- `core-js` 3.38.0 - JavaScript polyfills
- `dotenv` 17.2.0 - Environment variables
- `simple-icons` 14.12.3 - Icon library
- `next-themes` 0.3.0 - Dark mode support

## Configuration

**Environment:**
- `.env.template` - Template for required environment variables
- `.env.vercel` - Vercel deployment config
- `.env.local` - Local overrides (not committed)
- `next.config.mjs` - Next.js configuration

**Build:**
- `tsconfig.json` - TypeScript with path alias `@/*` -> `./`
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - Component generation config
- `postcss.config.mjs` - PostCSS setup

**Code Quality:**
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier with import sorting

## Platform Requirements

**Development:**
- Node.js 18+
- npm 10+

**Production:**
- Vercel deployment (`.vercel/` directory present)
- Environment: Vercel Edge Network

---

*Stack analysis: 2026-06-07*