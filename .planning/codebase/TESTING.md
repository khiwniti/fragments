# Testing Patterns

**Analysis Date:** 2026-06-07

## Test Framework

**Runner:**
- Playwright `@playwright/test` v1.60.0
- Config: `playwright.config.ts`

**Assertion Library:**
- Built-in Playwright `expect` with matchers

**Run Commands:**
```bash
npx playwright test              # Run all tests
npx playwright test --ui          # Interactive UI mode
npx playwright test --grep NAME  # Run specific tests
npx playwright show-report       # View HTML report
```

## Test File Organization

**Location:**
- E2E tests: `e2e/*.spec.ts`
- No unit tests detected in project

**Naming:**
- Pattern: `*.spec.ts` suffix
- Examples: `home.spec.ts`, `resume-a4.spec.ts`

**Structure:**
```
fragments/
├── e2e/
│   ├── home.spec.ts
│   ├── resume-a4.spec.ts
│   └── playwright.config.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect, type Page } from '@playwright/test'

test.describe('Suite Name', () => {
  test('test description', async ({ page }) => {
    // Test implementation
  })

  test.describe('Nested Suite', () => {
    test('nested test', async ({ page }) => {
      // ...
    })
  })
})
```

**Common Patterns:**
- `test.describe()` groups related tests
- `test()` is the test case
- `async ({ page })` destructures Playwright page fixture

## Mocking

**Framework:** No mocking library detected (Playwright E2E tests only)

**Approach:**
- Playwright intercepts network requests if needed
- No `vi.mock()`, `jest.mock()`, or similar unit test mocks

**Console Error Capture:**
```typescript
let consoleErrors: { message: string; source: string }[] = []

async function setupPage(page: Page) {
  consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({ message: msg.text(), source: msg.location().url })
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push({ message: err.message, source: '' })
  })
}
```

## Fixtures and Factories

**Test Data:**
- Source data imported from application modules (e.g., `import { starterChips } from '@/lib/profile'`)
- Static data from `lib/profile.ts` and `components/landing/data.ts`
- No dynamic test data factories

**Setup Pattern:**
```typescript
async function setupPage(page: Page) {
  consoleErrors = []
  // Attach listeners
  await page.goto('/')
  await page.waitForLoadState('networkidle')
}
```

## Coverage

**Requirements:** None enforced

**Reporting:**
- HTML reporter: `playwright-report/`
- Trace on first retry: `trace: 'on-first-retry'`

**Command to view:**
```bash
npx playwright show-report
```

## Test Types

**Unit Tests:**
- Not present in this codebase
- No Jest, Vitest, or other unit test frameworks

**Integration Tests:**
- Not present (E2E only)

**E2E Tests:**
- Full browser testing via Playwright
- Tests located in `e2e/` directory
- Covers: landing page, navigation, interactive elements, artifact generation

## Common Patterns

**Page Navigation:**
```typescript
await page.goto('/')
await page.goto('/chat?prompt=' + encodeURIComponent('query'))
```

**Wait for Element:**
```typescript
await expect(sheet).toBeVisible({ timeout: 90_000 })
await page.waitForLoadState('networkidle')
await page.waitForTimeout(3000)  // Wait for streaming/animations
```

**Assertions:**
```typescript
await expect(page.locator('nav')).toBeVisible()
await expect(page.getByText('Sign in')).toBeVisible()
await expect(textarea).toHaveAttribute('placeholder', /Ask about/)
expect(Math.abs(box!.width / box!.height - A4_RATIO)).toBeLessThan(0.01)
```

**Scroll and Interact:**
```typescript
const el = page.locator(`text=${sectionTestId}`)
await el.scrollIntoViewIfNeeded()
await page.waitForTimeout(800)
await page.getByText(chip.label).click()
```

**Console Error Filtering:**
```typescript
const appErrors = consoleErrors.filter((e) => {
  const msg = e.message.toLowerCase()
  return !msg.includes('metamask') &&
         !msg.includes('moz-extension') &&
         !msg.includes('fullscreen') &&
         !msg.includes('deprecated')
})
expect(appErrors).toEqual([])
```

## Playwright Configuration

**File:** `playwright.config.ts`

**Key Settings:**
```typescript
testDir: './e2e'
forbidOnly: !!process.env.CI
retries: process.env.CI ? 1 : 0
workers: 1  // Sequential to avoid test interference
timeout: 90_000
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  actionTimeout: 15_000,
}
```

**CI Behavior:**
- Skips `webServer` config in CI (expects pre-running server)
- Uses `BASE_URL` env var when specified

---

*Testing analysis: 2026-06-07*