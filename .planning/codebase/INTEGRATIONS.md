# External Integrations

**Analysis Date:** 2026-06-07

## APIs & External Services

**AI/LLM Providers:**
- OpenAI - Primary LLM provider (GPT models)
- Anthropic - Claude models via `@ai-sdk/anthropic`
- Google AI / Google Vertex - Gemini models (both direct and Vertex auth)
- Mistral - Mistral AI models
- Fireworks AI - Fireworks inference
- Groq - Groq Cloud inference
- Together AI - Together.xyz inference
- xAI - xAI Grok models
- DeepSeek - DeepSeek models
- NVIDIA - NVIDIA NIM inference
- Ollama - Local model support
- E2B - Cloud-based code interpreter sandbox (`@e2b/code-interpreter`)

## Data Storage

**PostgreSQL:**
- Supabase - Primary database
- Connection: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Client: `@supabase/supabase-js`
- Migrations: `lib/migrations/`
- Seed data: `supabase/seed.sql`

**Graph Database:**
- Neo4j - Knowledge graph storage
- Client: `neo4j-driver`
- Used in: `lib/knowledge.ts`, `app/kg/` routes

**Vector Storage:**
- Implied for embeddings (used in AI features)

**File Storage:**
- Supabase Storage (implied for user assets)

**Local Storage (Client):**
- `lib/storage.ts` - Resume session storage in browser localStorage

**Caching:**
- Vercel KV (`@vercel/kv`) - Rate limiting counters, short URLs
- Connection: `KV_REST_API_URL`, `KV_REST_API_TOKEN`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
- Implementation: `lib/supabase.ts`, `lib/auth.ts`, `components/auth/`
- Uses JWT (jose library for admin sessions)
- Admin session verification: `lib/auth/admin-session.ts`

## Monitoring & Observability

**Analytics:**
- PostHog - Product analytics
- Client: `posthog-js`
- Env vars: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- Usage: User identification, sign in/out events

**Error Tracking:**
- Not explicitly configured (no Sentry, etc.)

**Logs:**
- Vercel built-in logging (deployed on Vercel)

## CI/CD & Deployment

**Hosting:**
- Vercel - Primary deployment platform
- Configuration: `.vercel/` directory, `.env.vercel`

**CI Pipeline:**
- Vercel auto-deploy on git push
- GitHub Actions: `.github/` directory present

**Testing:**
- Playwright - E2E testing
- Config: `playwright.config.ts`
- Tests: `e2e/` directory

## Environment Configuration

**Required env vars:**
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access
- `GROQ_API_KEY`, `TOGETHER_API_KEY`, `FIREWORKS_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY` - Alternative LLM providers
- `GOOGLE_AI_API_KEY`, `GOOGLE_VERTEX_CREDENTIALS` - Google AI / Vertex
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` - Vercel KV for rate limiting
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` - PostHog analytics
- `E2B_API_KEY` - E2B code execution sandbox

**Optional env vars:**
- `NEXT_PUBLIC_SITE_URL` - Site domain
- `NEXT_PUBLIC_NO_API_KEY_INPUT` - Disable API key input UI
- `NEXT_PUBLIC_NO_BASE_URL_INPUT` - Disable base URL input UI
- `NEXT_PUBLIC_HIDE_LOCAL_MODELS` - Hide Ollama from model list
- `RESUME_AGENT_URL` - Optional backend for resume chat

## Webhooks & Callbacks

**Incoming:**
- Supabase Auth webhooks - Auth state changes
- Implemented via `supabase.auth.onAuthStateChange` in `lib/auth.ts`

**Outgoing:**
- None explicitly configured (no Stripe, webhook emitters, etc.)

---

*Integration audit: 2026-06-07*