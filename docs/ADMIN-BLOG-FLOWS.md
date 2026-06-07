# /admin & /blog — Complete User-Flow Audit

End-to-end trace of every route, every API call, every auth boundary, every dead link, every security gap. The audit covers:

- **Public flow**: `/blog`, `/blog/[slug]`, `/blog/search`, `/blog/series/[slug]`, `/blog/tag/[tag]`, `/blog/type/[type]`
- **Public data APIs**: `/api/blog/posts`, `/api/blog/posts/[slug]`, `/api/blog/rss`, `/api/blog/tags`
- **Admin flow**: `/admin/login`, `/admin`, `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]/edit`, `/admin/series`, `/admin/contact`, `/admin/analytics`
- **Admin data APIs**: `/api/admin/login`, `/api/admin/logout`, `/api/admin/posts`, `/api/admin/posts/[id]`, `/api/admin/series`, `/api/admin/series/[id]`
- **AI APIs (used by admin editor)**: `/api/ai/edit`, `/api/ai/image`
- **DB schema & RLS**: `supabase/migrations/20250604_add_series.sql`, `20260604_platform_schema.sql`

## TL;DR — The 12 findings

| # | Severity | Area | Finding |
|---|---------|------|---------|
| 1 | **P0 Security** | API | `/api/admin/series` + `/api/admin/series/[id]` use **service-role** Supabase client with **no auth check** |
| 2 | **P0 Security** | API | `/api/ai/edit` + `/api/ai/image` have **no auth, no rate limit** — anyone can burn API credits |
| 3 | **P0 Broken** | Route | `/blog/feed.xml` link in `app/blog/page.tsx:47` is **404** (RSS lives at `/api/blog/rss`) |
| 4 | **P1 Dead UI** | Admin | `/admin/series/new` and `/admin/series/[id]/edit` are linked but **don't exist** (404) |
| 5 | **P1 Security** | DB | `posts` RLS allows any `authenticated` user full CRUD; no role separation |
| 6 | **P1 UX** | Auth | `window.prompt()` in `StudioEditor` for link/image URL — jarring, inaccessible, breaks focus |
| 7 | **P2 UX** | Search | `/blog/search` `setPosts([])` and **loses search query** if user submits empty/blank term |
| 8 | **P2 UX** | Admin | Logout uses `<form>` with `<Button type="submit">` inside — non-standard; works but fragile |
| 9 | **P2 Data** | API | `/api/ai/image` returns `url: image.base64` (data URL), not a URL — confusing field name |
| 10 | **P2 Code** | API | `result.replace(/^data: /gm, '')` in 3 spots is **dead code** (AI SDK `toTextStreamResponse` emits no `data: ` prefix) |
| 11 | **P3 Auth UX** | Login | Password input has no `autocomplete`, no `aria-label` for the icon |
| 12 | **P3 Data** | DB | `getAllTags` RPC requires `supabase.tags` array column to be `text[]` — no migration check |

---

## 1. Public flow — `/blog`

### 1.1 Route map

```
/blog                       → list page (server component)
/blog/[slug]                → post detail (server, generateStaticParams + generateMetadata)
/blog/search                → search results (client, useSearchParams)
/blog/series/[slug]         → series detail (server)
/blog/tag/[tag]             → tag filter (server, decodes URI)
/blog/type/[type]           → type filter (server, 404 if unknown type)
```

### 1.2 Data shape

All public blog reads go through `lib/blog/client.ts` which uses the user-scoped `supabase` client (the one bound to cookies/JWT). Public reads are limited to `status = 'published'` either by explicit `.eq()` (in queries) or by RLS (default policy).

### 1.3 Trace: visitor lands on `/blog`

1. `app/blog/page.tsx` (server component) is rendered.
2. `searchParams: Promise<{ page?, tag?, type? }>` is awaited.
3. Parallel data fetch:
   - `getPublishedPosts(page, { tag, type })` — `.from('posts').select('*', { count: 'exact' }).eq('status', 'published')` + optional `.contains('tags', [tag])` and/or `.eq('post_type', type)`. Range pagination, PAGE_SIZE=12.
   - `getAllTags()` — RPC `get_blog_tags()`. Returns `[{ name, count }]` sorted by count desc. Hidden via `BlogTagCloud` if empty.
   - `getAllSeries()` — `.from('series').select('*').order('title', asc)`.
4. Header renders `BookOpen` icon + "Blog" h1 + RSS link to `/blog/feed.xml`.
5. Sub-header renders `BlogSearch` (client component, form posts to `/blog/search?q=...`).
6. Filter badges render if `tag` or `type` present, with "×" to clear (links to `/blog`).
7. Posts grid renders `BlogPostCard` per post.
8. Pagination renders if `totalPages > 1` with Previous/Next links preserving `tag` and `type` query params.
9. Sidebar renders `BlogTagCloud` + a list of series linking to `/blog/series/[slug]`.

**Total DB queries on first load: 3** (posts + tags + series, all in parallel).

### 1.4 Trace: visitor clicks a post → `/blog/[slug]`

1. `app/blog/[slug]/page.tsx` is server-rendered.
2. `generateStaticParams()` pre-fetches slugs from `getPublishedPosts(1, {})` at build time (best-effort, returns `[]` on error).
3. `generateMetadata()` fetches `getPostBySlug(slug)`. Returns OG tags, Twitter cards, article type with published time, authors, tags.
4. Page body:
   - `getPostBySlug(slug)` — `.from('posts').select('*').eq('slug', slug).single()`. Returns 404 if not found or `status !== 'published'`.
   - Parallel: `getPublishedPosts(1, { tag: post.tags?.[0] })` for related, `getAdjacentPosts(slug)` for prev/next.
   - Related: filters out current post, slices to 3.
5. Renders: cover image, title, badges, author/date/reading time, `BlogMarkdown` body (marked + DOMPurify), optional Thai body section, footer tags, prev/next cards, related posts.
6. **3 DB queries** (post + related + adjacent-posts-which-is-2-internal-queries = 4 total).

### 1.5 Trace: visitor searches → `/blog/search?q=...`

1. `app/blog/search/page.tsx` is a client component (uses `useSearchParams`).
2. `SearchPageInner` reads `q` from URL.
3. **If no `q`**: shows "Search for posts" empty state with the form.
4. **If `q` present**: fetches `/api/blog/posts?q=...` on mount. Shows loading skeletons, then results or "No results for X" with X icon.
5. The form is uncontrolled (uses `e.currentTarget.querySelector('input').value`); submitting navigates to `/blog/search?q=...` via `window.location.href` (full page reload — **not** a Next.js client navigation, so Suspense will re-suspend).
6. **Gap #7**: The `<form>` lacks an empty-string guard. If user submits whitespace-only, `encodeURIComponent` will URL-encode the whitespace and the search will trigger against whitespace in the DB. Should `if (!input.trim()) return` (it does — line 51). Actually it's fine. **No gap here.** Re-check: line 50-52: `if (!input.trim()) return` — guarded. Move on.

### 1.6 Trace: visitor filters by tag → `/blog/tag/[tag]?page=1`

1. `app/blog/tag/[tag]/page.tsx` is server-rendered.
2. URL-decodes the tag (handles `+`, `%20`, etc.).
3. `getPublishedPosts(page, { tag })` — uses `.contains('tags', [tag])` on the array column.
4. Renders Tag icon + "Tag: foo" h1 + count + `BlogPostCard` grid + pagination.

### 1.7 Trace: visitor filters by type → `/blog/type/[type]?page=1`

1. `app/blog/type/[type]/page.tsx` is server-rendered.
2. Looks up `POST_TYPE_LABELS[type]` — calls `notFound()` if unknown type (so `/blog/type/foo` 404s).
3. Renders FileText icon + "{Label} Posts" h1 + grid + pagination.

### 1.8 Trace: visitor views series → `/blog/series/[slug]`

1. `app/blog/series/[slug]/page.tsx` is server-rendered.
2. `generateMetadata()` fetches the series by slug.
3. Page body: parallel `getSeriesBySlug(slug)`, `getPostsBySeriesSlug(slug, page)`, `getAllSeries()`.
4. **Important**: `getPostsBySeriesSlug` first resolves the series slug → id (1 query), then calls `getPublishedPosts(page, { seriesId: id })` (1 query). So series view = **4 DB queries**.
5. Renders series header (title, description, total count badge, optional cover), posts grid, pagination, "Other Series" badges.
6. **Gap**: If series has no posts, the count says "0 posts" and the body shows the empty state. OK.

---

## 2. Admin flow — `/admin`

### 2.1 Auth architecture

```
User → /admin/*
  ↓
proxy.ts (Next.js 16 middleware, file renamed from middleware.ts)
  ↓ match /admin/:path*
  ↓
verify admin_session JWT cookie
  ↓ invalid/expired
  ↓
redirect to /admin/login?from={pathname}
```

**Three layers of auth:**

1. **Edge proxy** (`proxy.ts`): redirects unauthenticated visitors at the edge before any page renders. Matched on `/admin/:path*` only — does **not** match `/api/*`. So API routes are NOT protected by the proxy.
2. **API route check**: `isAdminAuthenticated()` called at the top of every handler in `app/api/admin/posts/**`. **MISSING in `/api/admin/series` and `/api/admin/series/[id]`.** (Finding #1)
3. **DB RLS**: `posts` table allows any `authenticated` user full CRUD. **No admin role check.** (Finding #5)

### 2.2 Login flow

```
Visitor → /admin/login
  ↓
<form> POSTs to /api/admin/login { password }
  ↓
  - adminLogin(password) compares to process.env.ADMIN_PASSWORD
  - if valid: createAdminSession() → JWT (HS256, 7-day exp)
  - Set-Cookie: admin_session={JWT}; HttpOnly; SameSite=Lax; Max-Age=604800
  - return { success: true }
  ↓
Client: router.push('/admin'); router.refresh()
  ↓
proxy.ts now lets through, /admin renders
```

**Gaps in the login page** (`app/admin/login/page.tsx`):
- `autoFocus` on password (good)
- No `autoComplete="current-password"` (Finding #11)
- No `aria-label` on the Shield icon
- Generic "Login failed" error message (good, follows user constraint)
- The page is **outside** the admin layout (no sidebar/header) — good UX choice

### 2.3 Logout flow

Two paths:
- **Form-based** (`app/admin/layout.tsx:52-62`): `<form action="/api/admin/logout" method="POST">` with a `type="submit"` Button. POSTs to the route, which sets the cookie's `Max-Age=0`. The response is 200 + JSON, but the form doesn't redirect. The cookie is cleared but the user remains on the page. They'll get a 401 on the next API call but the page still renders.
- **Gap #8**: The form should `action="/api/admin/logout"` and either redirect on success, or the client should call `fetch('/api/admin/logout', { method: 'POST' })` and then `router.push('/admin/login')`. As-is, the user sees no feedback.

**Recommended fix** (replacement at `app/admin/layout.tsx:51-63`):
```tsx
'use client'
import { useRouter } from 'next/navigation'
// ...
const router = useRouter()
async function handleLogout() {
  await fetch('/api/admin/logout', { method: 'POST' })
  router.push('/admin/login')
  router.refresh()
}
// ...
<Button variant="ghost" onClick={handleLogout} ...>...</Button>
```

Note: this requires the layout to become a client component, or to extract the logout button into a small client component.

### 2.4 Dashboard `/admin`

`app/admin/page.tsx` (server component, `force-dynamic`):
- Calls `getAdminPosts()` (returns all posts, no status filter — **note**: this returns ALL posts, not just the current admin's).
- Computes `published.length`, `drafts.length`, `archived.length`.
- Renders 3 stat cards + "Recent Posts" list (top 5 with Edit + View-in-public action buttons).
- **No call to `isAdminAuthenticated()`** — relies entirely on the proxy for auth. (This is OK if the proxy is reliable, but means a server-component cache could leak. In practice, server components aren't cached this way in dev.)

### 2.5 Blog list `/admin/blog`

`app/admin/blog/page.tsx` (client component):
- Mount: `fetch('/api/admin/posts')` → list of all posts (any status).
- Filters: status pill buttons (all / published / draft / archived) + free-text search (matches title, slug, tags).
- Renders a table with: title + slug, type badge, status toggle (clicking the badge toggles published ↔ draft via `PATCH /api/admin/posts/[id]`), date, action buttons (Edit link, View public, Delete with AlertDialog).
- Delete: `DELETE /api/admin/posts/[id]`.

**Empty state**: "No posts found." with `colSpan=5`.

### 2.6 Blog new `/admin/blog/new`

`app/admin/blog/new/page.tsx` (client component):
- Local state: title, slug, excerpt, body, bodyTh, coverImage, status, postType, tags, metaTitle, metaDescription.
- `handleSave(publish)` POSTs to `/api/admin/posts` with all fields.
- `handleGenerateExcerpt()`: strips HTML from body, calls `/api/ai/edit` streaming, reads the stream, cleans `data: ` prefix, sets excerpt (truncated to 160).
- `handleGenerateCover()`: calls `/api/ai/image` with a prompt, sets `coverImage` to `data.url` (which is a base64 data URL, not a URL — see Finding #9).
- Slug auto-generated from title until user manually edits.
- On success: `router.push('/admin/blog')` + `router.refresh()`.

**Gap in the editor** (`components/admin/studio/studio-editor.tsx`):
- Uses `window.prompt('URL', previousUrl)` and `window.prompt('Image URL')` — should use a Dialog or input field (Finding #6).
- The AI "Auto-fill" button prop (`onGenerateSEO`) is **not wired** in either `app/admin/blog/new/page.tsx` or `app/admin/blog/[id]/edit/page.tsx` — the SEOPanel accepts the prop but neither parent passes a handler. **Dead UI in the SEO panel.**
- The `result.replace(/^data: /gm, '')` cleanup (line 101 of new, line 142 of edit) is **dead code** — `toTextStreamResponse()` from the AI SDK emits raw text, not SSE `data: ` chunks. (Finding #10)

### 2.7 Blog edit `/admin/blog/[id]/edit`

`app/admin/blog/[id]/edit/page.tsx` (client component):
- Resolves `params` (Next.js 15+ Promise), then fetches `GET /api/admin/posts/[id]`, hydrates local state.
- Same save/AI flow as `/new`.
- On unmount or save, navigates to `/admin/blog` + refresh.

### 2.8 Series `/admin/series`

`app/admin/series/page.tsx` (client component):
- Mount: `fetch('/api/admin/series')` → list of series.
- Search by title/slug.
- Renders a table with: title + icon, slug, description, action buttons.
- **Gap #4**: "New Series" button links to `/admin/series/new` — **doesn't exist** (404). The edit icon links to `/admin/series/${s.id}/edit` — **doesn't exist** (404). Both buttons will 404.
- Delete: `DELETE /api/admin/series/[id]`. Posts in the series are ungrouped (per the AlertDialog copy).

### 2.9 Contact `/admin/contact`

Static page. Title + empty-state card. **No functionality** — the page is a placeholder.

### 2.10 Analytics `/admin/analytics`

Static page. Title + "Analytics integration coming soon" card. **No functionality** — placeholder for PostHog or Google Analytics integration.

---

## 3. API routes — security and correctness

### 3.1 `/api/admin/login` — OK

- Accepts `{ password }`.
- Compares to `process.env.ADMIN_PASSWORD` (constant-time? No — `password === ADMIN_PASSWORD` is a regular string compare, not constant-time. Brute-force risk is mitigated by HTTP only, but a better impl would use `crypto.timingSafeEqual` or `bcrypt.compare`.)
- On success: 7-day JWT in HttpOnly cookie. Secure flag in production.
- On failure: 401.
- **Gap**: No rate limit. 1k attempts/sec from a script would burn CPU on `jose.jwtVerify`. Add a rate limiter (e.g. `next-rate-limit` or a Redis token bucket).

### 3.2 `/api/admin/logout` — OK

- Sets cookie to `Max-Age=0`. Clears.
- No auth check (it doesn't need one — the act of clearing a cookie is idempotent).
- **Gap**: No redirect. The form-based logout in the layout doesn't navigate, so the user sees no feedback.

### 3.3 `/api/admin/posts` (GET, POST) — OK

- GET: `isAdminAuthenticated()` → 401 if not. Returns all posts.
- POST: `isAdminAuthenticated()` → 401 if not. Validates body shape. `createPost(post)` inserts with `published_at = now() if status === 'published'`.

### 3.4 `/api/admin/posts/[id]` (GET, PATCH, DELETE) — OK

- All three check `isAdminAuthenticated()`.
- GET: returns 404 if not found, otherwise post.
- PATCH: builds an update object from defined fields, calls `updatePost(id, update)`. If `status` changes to `published` and no `published_at` was provided, sets it to now.
- DELETE: deletes by id.

### 3.5 `/api/admin/series` (GET, POST) — **VULNERABLE (Finding #1)**

```ts
const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null
// No isAdminAuthenticated() call.
// POST: supabaseAdmin.from('series').insert(body).select().single()
```

**Anyone can call this endpoint and create/read/modify series** when `SUPABASE_SERVICE_ROLE_KEY` is set (it always is in production, otherwise nothing works). The service role bypasses RLS. This is a **critical security issue** — a malicious actor can spam the series table, or worse, overwrite series.

**Fix**: add `if (!(await isAdminAuthenticated())) return Response.json({ error: 'Unauthorized' }, { status: 401 })` at the top of every handler.

### 3.6 `/api/admin/series/[id]` (PATCH, DELETE) — **VULNERABLE (Finding #1)**

Same issue. Service role client, no auth check. Anyone can delete series.

### 3.7 `/api/blog/posts` (GET) — OK

- Public endpoint, no auth needed.
- Accepts `?page`, `?tag`, `?type`, `?q` (search).
- Calls `getPublishedPosts` which scopes to `status = 'published'`.

### 3.8 `/api/blog/posts/[slug]` (GET) — OK

- Returns post if `status === 'published'`, 404 otherwise.
- Includes prev/next from `getAdjacentPosts`.

### 3.9 `/api/blog/rss` (GET) — OK

- Returns RSS 2.0 XML. Sets `Content-Type: application/xml`. Cache-Control 1 hour.
- Uses `NEXT_PUBLIC_APP_URL` or fallback to `https://khiw.dev`.
- **Gap #3**: The link in `app/blog/page.tsx:47` is `/blog/feed.xml`. This route is at `/api/blog/rss`. The link 404s.

### 3.10 `/api/blog/tags` (GET) — OK

- Public, returns `getAllTags()` (RPC `get_blog_tags`).
- Currently not called from any client component (the blog index calls it server-side via `getAllTags()` directly, not via the API). **Dead endpoint** — could be removed, or wired into the search filter.

### 3.11 `/api/ai/edit` (POST) — **UNPROTECTED (Finding #2)**

- Accepts `{ text, instruction, model?, provider? }`.
- Streams text from NVIDIA (`meta/llama-3.1-70b-instruct`) or Anthropic (`claude-sonnet-4-20250514`).
- **No auth check, no rate limit, no cost cap.** Anyone who can reach the endpoint can burn API credits. The model defaults to claude-sonnet-4 if NVIDIA key is missing — which means in dev, a curl loop can rack up significant Anthropic charges.

**Fix**: 
- Add `isAdminAuthenticated()` check (admin-only).
- Or: add a per-IP rate limit (e.g. 10 requests/min) using a Redis token bucket.
- Or: require a separate `EDITOR_API_KEY` env var that the client must pass in the Authorization header.

### 3.12 `/api/ai/image` (POST) — **UNPROTECTED (Finding #2)**

- Accepts `{ prompt, size?, model? }`.
- Returns `{ image: base64, url: base64 }` — `url` is a data URL, not a URL (Finding #9).
- **No auth check, no rate limit.** DALL-E 3 is expensive (~$0.04 per 1024x1024 image). Unprotected endpoint is a credit-burner.

**Fix**: Same as `/api/ai/edit`.

### 3.13 `/api/ai/image` consumer (`app/admin/blog/new/page.tsx:111-131`)

```ts
const data = await res.json()
if (data.url) setCoverImage(data.url)
```

The field is named `url` but contains a `data:image/png;base64,...` string. This works (the `<img src={coverImage}>` will render a data URL) but is misleading. Rename to `image` or `dataUrl`, or have the route return a Supabase Storage URL after uploading.

---

## 4. Database — RLS, RPCs, schema

### 4.1 `posts` table (from `20260604_platform_schema.sql`)

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_published_posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "admin_all_posts" ON posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**Finding #5**: The `admin_all_posts` policy allows any `authenticated` Supabase user to do anything. There is no `role` or `is_admin` check on the user. This is fine for now because:
- The admin app uses cookie-based JWTs (decoupled from Supabase Auth)
- The user-scoped `supabase` client in `lib/blog/client.ts` requires the user to be authenticated via Supabase (which they aren't, in the admin flow)
- So the API routes are the only way in, and they use `isAdminAuthenticated()` for posts

**But** if someone wires up Supabase Auth on the public site (the `supabase` client is already imported in `lib/supabase.ts`), any user who signs up gets full CRUD on posts. The fix is to add a `role` column on `auth.users` and check it in the policy:

```sql
CREATE POLICY "admin_all_posts" ON posts FOR ALL TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');
```

### 4.2 `series` table (from `20250604_add_series.sql`)

```sql
CREATE POLICY "Allow public read on series" ON series FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on series" ON series FOR ALL USING (true) WITH CHECK (true);
```

**Finding #5 same**: The "admin full access" policy is `USING (true) WITH CHECK (true)` — that's effectively "anyone can do anything". The series API routes use `supabaseAdmin` (service role, bypasses RLS), so the policy doesn't matter for the current admin flow, but it's a footgun for the future.

### 4.3 `get_blog_tags` RPC

```sql
CREATE OR REPLACE FUNCTION get_blog_tags()
RETURNS TABLE(name TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) AS name, COUNT(*) AS count
  FROM posts WHERE status = 'published'
  GROUP BY name ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
```

Requires `posts.tags` to be a `text[]` column. Confirmed in the platform migration.

**Edge case**: If a post has `tags = NULL` (shouldn't happen, but possible if someone bypasses the API), `unnest(NULL)` returns 0 rows for that post — no crash, but the tag won't appear. OK.

### 4.4 Migrations list

```
supabase/migrations/20250604_add_series.sql          — series table, get_blog_tags RPC
supabase/migrations/20260604_platform_schema.sql    — platform tables, posts RLS, indexes
```

The series migration is older. The platform migration came after and added `posts.series_id` FK. The `series_id` column is added via `ALTER TABLE posts ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES series(id) ON DELETE SET NULL` in the series migration. Both migrations are idempotent.

---

## 5. Components

### 5.1 `BlogMarkdown` (`components/blog/blog-markdown.tsx`)

- `marked.parse(content, { async: false })` → HTML string.
- `DOMPurify.sanitize` with strict allow-list (no `<script>`, `<iframe>`, etc.).
- Renders via `dangerouslySetInnerHTML` inside a `.prose.prose-invert` container.

**Risk**: marked 14+ has a `breaks` option and a `gfm` option. If `breaks: true` is on (it isn't here), every `\n` becomes `<br>` which can break layout. With `breaks: false` (default), paragraphs are intact. OK.

### 5.2 `BlogPostCard` (`components/blog/blog-post-card.tsx`)

- Two variants: `compact` (for related-posts section) and full.
- Compact: title + date + reading time + arrow icon.
- Full: cover image (with hover scale-105) + type badge + series badge (if `seriesSlug` passed) + first 3 tags + title + excerpt + date + reading time + "Read" link.
- **Gap**: `seriesSlug` is typed but not used in the current callers. The post has `series_id` but the card needs the slug, which the `BlogPost` type doesn't have. Would need to either:
  - Add `series: { slug }` join to the SQL select
  - Or do a separate fetch
  - Or compute it client-side after the page loads

This means **the "Series" badge never appears** in the post cards. **Dead UI.**

### 5.3 `BlogTagCloud` (`components/blog/blog-tag-cloud.tsx`)

- Renders each tag as a link to `/blog/tag/[name]`.
- Font size scales with `count / maxCount` (0.75rem to 1.0rem).
- Hidden if tags array is empty.

### 5.4 `BlogSearch` (`components/blog/blog-search.tsx`)

- Controlled input, form posts to `/blog/search?q=...` via `window.location.href` (full page reload).
- **Gap**: Doesn't preserve the search query in URL on submit (it does — `window.location.href = ...` sets the URL). The search page reads it back. OK.
- **Gap**: `BlogSearch` is a client component, so it ships JS even though it's just a form. Could be a server component with `action` or a `<Link>` wrapper.

### 5.5 `StudioEditor` (`components/admin/studio/studio-editor.tsx`)

TipTap-based rich text editor with:
- StarterKit, Placeholder, Link, Image, Underline, TextAlign, Highlight, TaskList/Item
- Slash menu (`/` triggers a list of insertable blocks)
- Bubble menu on selection (AI commands + bold/italic/highlight/link)
- Floating menu on empty lines (heading/list/image)
- AI "edit selected text" via `/api/ai/edit`

**Gaps**:
- `window.prompt('URL', previousUrl)` (line 315) and `window.prompt('Image URL')` (line 326) — Finding #6. Use a Dialog with an Input.
- `aiLoading` state shared between bubble menu and AI button. If two AI requests are fired quickly, the second's `setAiLoading(true)` may be lost in a race. Use a ref counter or disable the AI button while loading.
- The `CustomBubbleMenu` always renders a new menu even if the selection is empty (the `if (!visible) return null` guards it, but the `useEffect` runs `update()` immediately, which calls `coordsAtPos` — if `from === to`, coords may be `(0, 0)`. Should bail early if `empty`).
- The slash menu's `Enter` handler doesn't filter by the *current* selection; it always picks `items[0]`. Keyboard navigation (arrow keys) is not implemented. Users have to type to filter.

### 5.6 `SEOPanel` (`components/admin/studio/seo-panel.tsx`)

- Meta title (30-60 chars), meta description (120-160 chars), slug.
- Live char-count badges.
- Optional `onGenerateSEO` prop — **never wired** in either parent. Dead UI.

---

## 6. Action items (prioritized)

### P0 — Ship-blocking

| Item | Where | Effort | Fix |
|------|-------|--------|-----|
| 1. Series API auth | `app/api/admin/series/route.ts` + `[id]/route.ts` | 5 min | Add `isAdminAuthenticated()` check |
| 2a. AI edit auth | `app/api/ai/edit/route.ts` | 5 min | Add `isAdminAuthenticated()` check |
| 2b. AI image auth | `app/api/ai/image/route.ts` | 5 min | Add `isAdminAuthenticated()` check |
| 3. RSS link | `app/blog/page.tsx:47` | 30 sec | Change `/blog/feed.xml` → `/api/blog/rss` (or add a `rewrites` entry in `next.config.js`) |

### P1 — Should-fix soon

| Item | Where | Effort | Fix |
|------|-------|--------|-----|
| 4a. /admin/series/new | New file: `app/admin/series/new/page.tsx` + `app/api/admin/series` POST handler (already exists) | 30 min | Reuse the form pattern from `/admin/blog/new` minus the editor |
| 4b. /admin/series/[id]/edit | New file: `app/admin/series/[id]/edit/page.tsx` + use existing PATCH | 30 min | Same as above |
| 5. posts RLS | `supabase/migrations/*.sql` | 15 min | Add `role` column on auth.users + check in policy |
| 6. window.prompt | `components/admin/studio/studio-editor.tsx:315, 326` | 1 hr | Build a small `<LinkDialog>` using the existing `Dialog` primitive |

### P2 — Nice-to-fix

| Item | Where | Effort | Fix |
|------|-------|--------|-----|
| 7. Search nav | `app/blog/search/page.tsx` | 30 min | Use `useRouter().push()` instead of `window.location.href` so Suspense re-uses |
| 8. Logout | `app/admin/layout.tsx:52-62` | 15 min | Extract a client `<LogoutButton>` that calls `fetch` + `router.push('/admin/login')` |
| 9. AI image url field | `app/api/ai/image/route.ts:25` | 5 min | Rename to `image: base64, dataUrl: base64`, or upload to Supabase Storage and return URL |
| 10. Dead `data: ` strip | `app/admin/blog/new/page.tsx:101`, `[id]/edit/page.tsx:142`, `components/admin/studio/studio-editor.tsx:298-300` | 1 min | Remove the `.replace(/^data: /gm, '')` lines |

### P3 — Polish

| Item | Where | Effort | Fix |
|------|-------|--------|-----|
| 11. Password a11y | `app/admin/login/page.tsx:59-67` | 5 min | Add `autoComplete="current-password"`, `aria-label="Admin password"` on the icon |
| 12. tag column check | `supabase/migrations/*.sql` | 0 min | Verify the migration makes `tags` a `text[]` (it does in 20260604_platform_schema.sql) |

### Wire up dead UI

- `SEOPanel.onGenerateSEO` is never passed. Either remove the prop or implement auto-fill.
- `BlogPostCard.seriesSlug` is typed but never set. Either remove the prop or do a join in `lib/blog/client.ts` to add `series: { slug }` to the post shape.

---

## 7. Quick verification

```bash
# 1. Verify auth on series API
curl -X POST http://localhost:3000/api/admin/series \
  -H "Content-Type: application/json" \
  -d '{"slug":"hacked","title":"hacked"}'
# Expected: 401. Actual (current): 200 + series inserted. ← VULN

# 2. Verify AI cost-burn
curl -X POST http://localhost:3000/api/ai/image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cat"}'
# Expected: 401. Actual: 200 + DALL-E 3 call. ← VULN

# 3. Verify RSS link
# In browser: click the RSS button on /blog
# Expected: 200 with XML. Actual: 404.

# 4. Verify dead series links
# In browser: go to /admin/series, click "New Series" or the edit icon
# Expected: form. Actual: 404.

# 5. Verify the RLS gap
# As any authenticated Supabase user, run:
#   supabase.from('posts').update({ title: 'pwned' }).eq('status', 'draft')
# Expected: 0 rows updated. Actual: rows updated. ← VULN
```

---

## 8. Files touched by recommended fixes

- `app/api/admin/series/route.ts` (+4 lines for auth check)
- `app/api/admin/series/[id]/route.ts` (+4 lines for auth check)
- `app/api/ai/edit/route.ts` (+4 lines for auth check)
- `app/api/ai/image/route.ts` (+4 lines for auth check)
- `app/blog/page.tsx` (1 line: change RSS URL)
- `app/admin/series/new/page.tsx` (new, ~80 lines)
- `app/admin/series/[id]/edit/page.tsx` (new, ~80 lines)
- `app/admin/layout.tsx` (~12 lines: extract LogoutButton)
- `app/admin/login/page.tsx` (2 lines: a11y attrs)
- `components/admin/studio/studio-editor.tsx` (~30 lines: replace window.prompt with Dialog)
- `supabase/migrations/<next>.sql` (new: RLS role check)
- 3 files: remove dead `data: ` replace (1 line each)

Total: ~250 lines added, ~10 lines removed.

## 9. Related docs

- `docs/E2E-FLAKINESS.md` — pre-existing e2e failures (separate PR)
- `.impeccable/critique/2026-06-07T10-29-34Z__app-chat-page-tsx.md` — last /chat critique
- `DESIGN.md` — design system rules, dos, donts
