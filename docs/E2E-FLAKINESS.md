# E2E Flakiness & Pre-Existing Failures

**Status: 9 pre-existing failures in `e2e/home.spec.ts` (7) and `e2e/resume-a4.spec.ts` (2). Not regressions from the sandbox / chat-polish work shipped in commits `e72ffc5`, `eaed0ec`, `ffc63bd`, `8b462f3`.**

This document is the action plan to make CI green. Land as a separate PR — it is unrelated to the resume sandbox architecture or chat polish.

## TL;DR

- `e2e/home.spec.ts` has 7 strict-mode violations in the `scrollToSection` helper. The helper uses `page.locator('text=...')` which matches every element containing the text, then calls `scrollIntoViewIfNeeded` which fails in strict mode when there are multiple matches.
- `e2e/resume-a4.spec.ts` has 2 failures from upstream NVIDIA API 500s + slow streaming. Tests are model-driven (no API mock), so they flake when the provider hiccups.

The new `e2e/resume-sandbox.spec.ts` (7/7 green) avoids both problems by (a) using strict-mode-safe selectors and (b) mocking the API with `page.route`.

## `e2e/home.spec.ts` — 7 strict-mode failures

### Root cause

`e2e/home.spec.ts:24-28` defines:

```ts
async function scrollToSection(page: Page, sectionTestId: string) {
  const el = page.locator(`text=${sectionTestId}`)
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800) // wait for reveal animation
}
```

`page.locator('text=...')` matches every element whose text contains the substring. When the page renders the same word in multiple places (e.g. a "Rainmaking" project card AND a "Rainmaking" label in a meta line AND a "Rainmaking" tag in a sidebar), strict mode kicks in and `scrollIntoViewIfNeeded` fails.

### Failures and fixes

| # | Test | `sectionTestId` | Match count | Root cause | Suggested fix |
|---|------|-----------------|------------:|-----------|--------------|
| 1 | Projects Section | `"Rainmaking"` | 5 | Project card heading + meta tags + skill list all contain "Rainmaking" | Use `getByRole('heading', { name: 'Rainmaking', exact: true })` or a `data-testid` on the card heading |
| 2 | Career Section | `"Full-Stack"` | 4 | Hero line + career cards + skills widget | Same pattern: `getByRole('heading', { name: /full-stack/i })` scoped to a specific section |
| 3 | Career Section (click) | `"Full-Stack"` | 4 | (same as #2) | Same |
| 4 | Career Section | `"Education"` | 2 | Career widget has both a section title and an Education card heading | Use `getByRole('heading', { name: 'Education', level: 2 })` |
| 5 | Open Source Section | `"kidpen.org"` | 2 | Side project card title + URL link | Use `getByRole('link', { name: /kidpen\.org/ })` |
| 6 | Career Section | `"Resume"` | 2 | Career widget's "Resume" call-to-action + sidebar profile | Use `getByRole('link', { name: 'Resume' })` |
| 7 | scrollToSection | `"Forward-Deployed Full Stack Developer"` | 2 | Hero subtitle + footer attribution | Either don't assert the hero text in scrollToSection, or use a more specific locator |

### Recommended refactor

Replace the helper at `e2e/home.spec.ts:24-28` with a `data-testid`-driven version:

```ts
async function scrollToSection(page: Page, testId: string) {
  const el = page.getByTestId(testId)
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
}

// Usage:
// <section data-testid="section-projects" id="projects">…</section>
await scrollToSection(page, 'section-projects')
```

Then add `data-testid` to each section in `app/page.tsx` (or wherever the sections live). This makes the helper robust to copy changes and eliminates the strict-mode violations permanently.

### Migration checklist

- [ ] Add `data-testid="section-hero"` to the HeroChat wrapper
- [ ] Add `data-testid="section-projects"` to `<ProjectsWidget />`
- [ ] Add `data-testid="section-domains"` to `<DomainsWidget />`
- [ ] Add `data-testid="section-skills"` to `<SkillsWidget />`
- [ ] Add `data-testid="section-career"` to `<CareerWidget />`
- [ ] Add `data-testid="section-open-source"` to `<OpenSourceWidget />`
- [ ] Add `data-testid="section-contact"` to `<ContactWidget />`
- [ ] Rewrite `scrollToSection` to use `getByTestId`
- [ ] Update all 7 failing tests to use the new pattern
- [ ] Verify `npx playwright test e2e/home.spec.ts` returns 21/21

### Estimated effort

~30 minutes. Pure test infrastructure change. Zero app-code risk (only adding `data-testid` attributes, no behavior change).

## `e2e/resume-a4.spec.ts` — 2 model-flake failures

### Root cause

The two tests at `e2e/resume-a4.spec.ts:6-25` and `:27-43` hit the NVIDIA `meta/llama-3.1-70b-instruct` endpoint via `/api/resume-chat` and wait up to 90s for a real model response. Observed upstream behavior:

- `NVIDIA API error: 500 Internal Server Error` on intermittent calls (provider-side).
- Single full-resume prompt took 89 seconds on a healthy call (model + network latency).

The tests are model-driven, so any provider hiccup or latency spike fails them. They are not testing the chat UI's correctness — they are testing the model's ability to emit a valid patch, which is the upstream provider's responsibility.

### Failure modes (from latest run)

```
[chromium] › e2e/resume-a4.spec.ts:6:7 › A4 Resume Artifact Panel ›
  generates resume into A4 sheets with correct aspect ratio
  → fails: timed out waiting for .a4-sheet to be visible (90s)

[chromium] › e2e/resume-a4.spec.ts:27:7 › A4 Resume Artifact Panel ›
  long content paginates into multiple sheets
  → fails: count is 1, not > 1, after 20s post-streaming wait
```

### Recommended fix: pin to a deterministic model or a fixture

Two paths, in order of preference:

**Option A (preferred): Mock the API the way `e2e/resume-sandbox.spec.ts` does**

```ts
test('generates resume into A4 sheets with correct aspect ratio', async ({ page }) => {
  await page.route('**/api/resume-chat', async (route) => {
    const body = JSON.stringify({
      commentary: 'Seeding a resume.',
      intent: 'Seed',
      focus: 'General resume',
      patch: {
        add: [
          { id: 'summary', type: 'summary', title: 'Summary', items: [{ label: 'FS eng' }] },
          { id: 'highlights-key', type: 'highlights', title: 'Highlights', items: [
            { label: 'LLM platform', detail: '60% reduction', tags: ['AI'] },
          ]},
        ],
      },
    })
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'text/plain' }, body })
  })
  await page.goto('/chat?prompt=foo')
  // ... rest of the test, no waiting for NVIDIA
})
```

This makes the test deterministic and ~10x faster. The new `e2e/resume-sandbox.spec.ts` already does this; the pattern is proven.

**Option B (if you want to keep model-driven): Mock only at the /api/resume-chat boundary, not the model**

Add a test-mode flag to `app/api/resume-chat/route.ts` that returns a fixed patch when `?fixture=resume` is in the request URL, gated by `process.env.PLAYWRIGHT_FIXTURES === 'true'`. The test sets the env var in `playwright.config.ts` and the route returns a deterministic response. This keeps the model pipeline intact for the live `/chat` flow but pins the test to a known shape.

### Migration checklist (Option A)

- [ ] Copy the `page.route` pattern from `e2e/resume-sandbox.spec.ts:200-220`
- [ ] Replace the real `/api/resume-chat` call in `e2e/resume-a4.spec.ts:6-25` with a mock that emits 2+ sections
- [ ] Same for `e2e/resume-a4.spec.ts:27-43` (mock that emits 6+ sections to force pagination)
- [ ] Verify `npx playwright test e2e/resume-a4.spec.ts` returns 2/2 in <15s

### Estimated effort

~20 minutes. Pure test refactor. No app-code change.

## Combined CI impact

After both fixes, `npx playwright test` returns:

- `e2e/home.spec.ts`: 21/21
- `e2e/resume-a4.spec.ts`: 2/2
- `e2e/resume-sandbox.spec.ts`: 7/7 (already green)

**Total: 30/30, ~60s end-to-end** (down from 90s+ per `resume-a4` test, plus the 7 false-positive failures).

## PR checklist (when this lands)

- [ ] Branch: `fix/e2e-flakiness`
- [ ] Title: "test: eliminate strict-mode violations + mock model API in resume-a4 spec"
- [ ] Description: link this doc, summarize both fixes
- [ ] `npx playwright test` returns 30/30 in CI
- [ ] No app-code changes outside adding `data-testid` attributes
- [ ] Re-run `/impeccable critique /chat` to confirm the sandbox work remains intact (was 32/40 at the time of writing)

## Related

- `e2e/resume-sandbox.spec.ts` — the green spec that demonstrates the patterns to apply
- `.impeccable/critique/2026-06-07T10-29-34Z__app-chat-page-tsx.md` — last `/chat` critique (32/40, 0 P0s)
- `app/chat/page.tsx:24-28` — `seedSession` helper in resume-sandbox.spec.ts (worth porting to a shared `e2e/helpers.ts` if more specs land)
