# Codebase Concerns

**Analysis Date:** 2026-06-07

## Tech Debt

**Authentication - Hardcoded JWT fallback secret:**
- Issue: Default fallback JWT secret `'fragments-admin-fallback-secret-change-me'` used when `ADMIN_JWT_SECRET` is not set
- Files: `lib/auth/admin-session.ts:6`
- Impact: Admin sessions can be forged if environment variable is not configured
- Fix approach: Fail fast at startup if `ADMIN_JWT_SECRET` is not set, or generate a random secret on first startup

**Authentication - Simple password comparison:**
- Issue: `adminLogin()` uses direct string equality `password === ADMIN_PASSWORD`
- Files: `lib/auth/admin-session.ts:47`
- Impact: Vulnerable to timing attacks; no password policy enforcement
- Fix approach: Use constant-time comparison (`crypto.timingSafeEqual`) and enforce strong passwords

**Rate limiting - Silent bypass:**
- Issue: `ratelimit()` returns `undefined` when KV is not configured, allowing all requests through
- Files: `lib/ratelimit.ts`
- Impact: Rate limiting is effectively disabled without Vercel KV credentials
- Fix approach: Return a proper拒绝 response or log a warning when rate limiting cannot be enforced

**Knowledge base - Hardcoded static data:**
- Issue: All experience, projects, skills, education, and certifications are hardcoded in `lib/knowledge.ts`
- Files: `lib/knowledge.ts:36-319`
- Impact: Every update requires code changes and deployment; cannot be updated by non-developers
- Fix approach: Move to database or CMS; currently partially mitigated by live resume-agent backend

**Graph index - unbounded memory cache:**
- Issue: `_index` is a module-level singleton cached forever with no TTL or size limit
- Files: `lib/kg/graph.ts:14`
- Impact: Memory grows unbounded as graph data increases; no cache invalidation
- Fix approach: Add TTL-based expiration or LRU eviction; expose `clearGraphCache()` for manual invalidation

## Known Bugs

**No bugs identified through static analysis.** No TODO/FIXME comments found in codebase. Tests in `e2e/` provide coverage for critical paths.

## Security Considerations

**Admin route proxy - missing auth on public routes:**
- Risk: `/admin/login` is excluded from auth check, but `/admin` redirect logic sends users there
- Files: `proxy.ts:6-16`
- Current mitigation: Redirect to `/admin/login` when no valid session
- Recommendations: Add rate limiting to login attempts; implement account lockout

**Auth component - metadata type unsafe:**
- Risk: `metadata?: Record<string, any>` accepts any value; could leak sensitive data to Supabase
- Files: `components/auth.tsx:39`
- Current mitigation: None
- Recommendations: Type-strict metadata interface; validate all fields before sending

**Publish action - URL validation:**
- Risk: Only checks hostname ends with `.e2b.app`; could allow subdomain attacks
- Files: `app/actions/publish.ts:18`
- Current mitigation: Domain suffix check
- Recommendations: Use URL parsing with explicit allowlist of exact domains

**API errors - logs sensitive info:**
- Risk: `handleAPIError` logs full error object including potential stack traces
- Files: `lib/api-errors.ts:44,69`
- Current mitigation: None visible
- Recommendations: Sanitize error messages before logging; never log secrets or full objects

**Admin session - no CSRF protection:**
- Risk: Cookie-based session with no CSRF token
- Files: `lib/auth/admin-session.ts`
- Current mitigation: None visible
- Recommendations: Implement CSRF tokens for admin actions

## Performance Bottlenecks

**Large auth component:**
- Problem: `components/auth.tsx` is 748 lines with multiple sub-components
- Files: `components/auth.tsx`
- Cause: All auth views (sign in, sign up, magic link, password reset, update password) in single file
- Improvement path: Split into separate files per view; use dynamic imports for less common views

**Graph index rebuild on startup:**
- Problem: `buildIndex()` fetches entire graph from Neo4j on first access
- Files: `lib/kg/graph.ts:85-158`
- Cause: No lazy loading or pagination; `MATCH (n)` returns all nodes
- Improvement path: Implement pagination; cache index in KV; use incremental updates

**Knowledge context filtering:**
- Problem: Simple keyword scoring iterates over entire knowledge base on each request
- Files: `lib/knowledge.ts:355-368`
- Cause: No indexing; O(n) scan for each context request
- Improvement path: Pre-build inverted index on data load

## Fragile Areas

**Resume agent client - silent fallback:**
- Files: `lib/resume-agent-client.ts`
- Why fragile: Falls back to static context on ANY error (network, timeout, non-2xx); users may not realize they are getting stale data
- Safe modification: Add explicit logging when falling back; consider a config flag to require live data
- Test coverage: Limited - no unit tests for fallback behavior

**Supabase initialization:**
- Files: `lib/supabase.ts`
- Why fragile: Returns `undefined` when env vars missing; many components call methods on `supabase!` with non-null assertion
- Safe modification: Add a wrapper that throws on uninitialized access
- Test coverage: Demo mode handles null but not explicitly tested

**E2B sandbox timeout:**
- Files: `app/actions/publish.ts:27`
- Why fragile: `Sandbox.setTimeout` called without error handling; failures silently ignored
- Safe modification: Wrap in try-catch; notify user of timeout setting failures

## Scaling Limits

**LocalStorage session storage:**
- Current capacity: Browser-dependent, typically 5-10MB per domain
- Limit: Sessions stored as JSON strings; no pagination or archival
- Scaling path: Migrate to IndexedDB; implement session archival; server-side session storage

**Graph knowledge - full load:**
- Current capacity: Entire graph loaded into memory as Map objects
- Limit: Memory-constrained; ~50k nodes/edges before issues
- Scaling path: Virtual scrolling in UI; server-side pagination for graph queries

## Dependencies at Risk

**simple-icons (indirect):**
- Risk: Entire `simple-icons` package imported for just GitHub and Google icons
- Impact: 748+KB bundle impact if tree-shaking fails
- Migration path: Use inline SVGs for just the two icons needed

**nanoid in publish action:**
- Risk: `customAlphabet` with small alphabet could theoretically collide
- Impact: Duplicate short URLs overwrite each other
- Migration plan: Use nanoid's default alphabet (more entropy) or add collision checking

## Missing Critical Features

**No error boundaries:**
- Problem: React components throw errors without recovery
- Blocks: Graceful degradation; users see white screens on errors

**No request deduplication:**
- Problem: Concurrent identical API calls not deduplicated
- Blocks: Wasted bandwidth; potential race conditions in chat

**No offline support:**
- Problem: App requires network for core features
- Blocks: Use in poor connectivity environments

## Test Coverage Gaps

**API routes:**
- What's not tested: Error handling paths in publish, validate-email actions
- Files: `app/actions/publish.ts`, `app/actions/validate-email.ts`
- Risk: Invalid input could crash or behave unexpectedly
- Priority: Medium

**Auth flow:**
- What's not tested: Password reset flow, magic link, OAuth callback errors
- Files: `lib/auth.ts`, `components/auth.tsx`
- Risk: Auth edge cases unhandled in production
- Priority: High

**Graph knowledge:**
- What's not tested: Keyword relevance scoring, fallback behavior
- Files: `lib/knowledge.ts`
- Risk: Poor context quality without visibility
- Priority: Medium

---

*Concerns audit: 2026-06-07*