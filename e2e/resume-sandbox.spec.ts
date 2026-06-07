import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'

// ── Helpers ──────────────────────────────────────────────────────────────

let consoleErrors: { message: string; source: string }[] = []

function isNoise(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes('moz-extension') ||
    m.includes('installhook') ||
    m.includes('metamask') ||
    m.includes('fullscreen') ||
    m.includes('maxlisteners') ||
    m.includes('orphaned data') ||
    m.includes('malformed chunk') ||
    m.includes('the resource at') ||
    m.includes('deprecated') ||
    // Browser extension noise we saw during the sandbox e2e
    m.includes('intercept-console-error')
  )
}

async function captureErrors(page: Page) {
  consoleErrors = []
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') consoleErrors.push({ message: msg.text(), source: '' })
  })
  page.on('pageerror', (err) => {
    consoleErrors.push({ message: err.message, source: '' })
  })
}

async function goToChat(page: Page) {
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')
}

async function getSandbox(page: Page, conversationId: string) {
  return page.evaluate((id) => {
    const raw = localStorage.getItem(`fragments-sandbox-${id}`)
    return raw ? JSON.parse(raw) : null
  }, conversationId)
}

async function setSandbox(page: Page, sandbox: unknown) {
  await page.evaluate((sb) => {
    const id = (sb as { conversationId: string }).conversationId
    localStorage.setItem(`fragments-sandbox-${id}`, JSON.stringify(sb))
  }, sandbox)
}

async function setActiveConversation(page: Page, conversationId: string) {
  await page.evaluate((id) => {
    localStorage.setItem('resume-active-session', id)
  }, conversationId)
}

/**
 * Seed the full localStorage layout that the chat page's restore effect
 * expects: an anonymous id, a sessions index, a session record, an active
 * session id, and (optionally) a sandbox. The session record is required
 * because `restoreActiveSession` reads `resume-session-{id}` to find the
 * conversation id; without it the sandbox is never loaded.
 */
async function seedSession(
  page: Page,
  conversationId: string,
  options: { title?: string; sandbox?: unknown } = {},
) {
  const title = options.title ?? 'Test session'
  await page.evaluate(
    ({ id, title, sandbox }) => {
      if (!localStorage.getItem('resume-anon-id')) {
        localStorage.setItem('resume-anon-id', crypto.randomUUID())
      }
      const index = JSON.parse(localStorage.getItem('resume-sessions-index') ?? '[]') as string[]
      if (!index.includes(id)) {
        index.unshift(id)
        localStorage.setItem('resume-sessions-index', JSON.stringify(index))
      }
      const session = {
        id,
        title,
        createdAt: 0,
        updatedAt: 0,
        messages: [],
      }
      localStorage.setItem(`resume-session-${id}`, JSON.stringify(session))
      localStorage.setItem('resume-active-session', id)
      if (sandbox) {
        localStorage.setItem(`fragments-sandbox-${id}`, JSON.stringify(sandbox))
      }
    },
    { id: conversationId, title, sandbox: options.sandbox },
  )
}

function makeSandbox(
  conversationId: string,
  sections: Array<{ id: string; type: string; title: string; items: unknown[] }>,
  focus = 'Test focus',
) {
  return {
    conversationId,
    focus,
    sections: sections.map((s, i) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      items: s.items,
      order: i,
      createdAt: 0,
      updatedAt: 0,
    })),
    history: [],
    version: 1,
    createdAt: 0,
    updatedAt: 0,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────

test.describe('Resume Sandbox — E2E', () => {

  test.beforeEach(async ({ page }) => {
    await captureErrors(page)
  })

  test('seeds the right panel from a sandbox in localStorage (no model needed)', async ({ page }) => {
    const convId = 'e2e-seed-' + Date.now()
    await page.goto('/')
    await seedSession(page, convId, {
      sandbox: makeSandbox(convId, [
        { id: 'summary', type: 'summary', title: 'Summary', items: [{ label: 'Full-stack engineer' }] },
        { id: 'highlights-key', type: 'highlights', title: 'Highlights', items: [
          { label: 'Shipped LLM agent platform', detail: '60% reduction.', tags: ['AI'] },
          { label: 'Built AWS data pipeline', detail: '10M+ events/day.', tags: ['AWS'] },
        ]},
      ]),
    })

    await goToChat(page)

    // The right panel should open automatically and show A4 sheets.
    const sheets = page.locator('.a4-sheet')
    await expect(sheets.first()).toBeVisible({ timeout: 10_000 })
    expect(await sheets.count()).toBeGreaterThanOrEqual(1)

    // The seeded section titles must be present. The A4 pager duplicates
    // content into an off-screen measurement root, so scope queries to a
    // single visible sheet to avoid strict-mode violations.
    const sheet = page.locator('.a4-sheet').first()
    await expect(sheet.getByText('Summary').first()).toBeVisible()
    await expect(sheet.getByText('Highlights').first()).toBeVisible()
    await expect(sheet.getByText('Shipped LLM agent platform').first()).toBeVisible()
    await expect(sheet.getByText('Built AWS data pipeline').first()).toBeVisible()
  })

  test('renders multiple sections of the same type without React key collisions', async ({ page }) => {
    // This is the regression guard for the projects-heading / projects-item-N
    // duplicate-key bug. Two projects-type sections in the same sandbox
    // previously collided because the key was derived from `type`.
    const convId = 'e2e-keys-' + Date.now()
    await page.goto('/')
    await seedSession(page, convId, {
      sandbox: makeSandbox(convId, [
        { id: 'projects-personal', type: 'projects', title: 'Personal Projects', items: [
          { label: 'Home automation', detail: 'Self-hosted dashboard.' },
        ]},
        { id: 'projects-work', type: 'projects', title: 'Work Projects', items: [
          { label: 'KYC platform', detail: 'AML + IDV.' },
          { label: 'Pricing engine', detail: 'Real-time.' },
        ]},
        // Add a third one for good measure.
        { id: 'projects-side', type: 'projects', title: 'Side Projects', items: [
          { label: 'Graph RAG POC', detail: 'Neo4j + LLM.' },
        ]},
      ]),
    })

    await goToChat(page)

    const sheets = page.locator('.a4-sheet')
    await expect(sheets.first()).toBeVisible({ timeout: 10_000 })

    // All three titles must be visible. Scope to a single visible sheet
    // because the A4 pager duplicates content into a measurement root.
    const sheet = page.locator('.a4-sheet').first()
    await expect(sheet.getByText('Personal Projects').first()).toBeVisible()
    await expect(sheet.getByText('Work Projects').first()).toBeVisible()
    await expect(sheet.getByText('Side Projects').first()).toBeVisible()

    // The block keys (data-block-key) should all be unique. Two same-type
    // sections must NOT collapse to the same key.
    const keys = await page.locator('[data-block-key]').evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).getAttribute('data-block-key')),
    )
    const unique = new Set(keys)
    expect(keys.length).toBeGreaterThan(0)
    expect(unique.size).toBe(keys.length)
    // We expect at least 3 headings + 4 items = 7 unique block keys
    expect(unique.size).toBeGreaterThanOrEqual(7)
  })

  test('does not error on an empty sandbox', async ({ page }) => {
    const convId = 'e2e-empty-' + Date.now()
    await page.goto('/')
    await seedSession(page, convId, { sandbox: makeSandbox(convId, []) })

    await goToChat(page)

    // The page should still render; the right panel stays closed (no sections).
    // The chat area is the main surface.
    await expect(page.getByPlaceholder(/Ask about/)).toBeVisible({ timeout: 10_000 })
    // No A4 sheets because no sections.
    expect(await page.locator('.a4-sheet').count()).toBe(0)
  })

  test('renders the diff summary card after a patch response (mocked API)', async ({ page }) => {
    const convId = 'e2e-diff-' + Date.now()
    await page.goto('/')
    // Start with a sandbox that has one section.
    await seedSession(page, convId, {
      sandbox: makeSandbox(convId, [
        { id: 'summary', type: 'summary', title: 'Summary', items: [{ label: 'FS eng' }] },
      ]),
    })

    // Mock the resume-chat API to return a deterministic patch that adds
    // two sections. The shape matches the new ResumePatchSchema.
    await page.route('**/api/resume-chat', async (route) => {
      const body = JSON.stringify({
        commentary: 'Adding a highlights section and an experience section.',
        intent: 'Seed highlights and experience',
        focus: 'AI + cloud',
        patch: {
          add: [
            {
              id: 'highlights-key',
              type: 'highlights',
              title: 'Highlights',
              items: [
                { label: 'LLM agent platform', detail: '60% reduction.', tags: ['AI'] },
              ],
            },
            {
              id: 'experience-acme-2023',
              type: 'experience',
              title: 'Senior Backend @ Acme',
              items: [
                { label: 'AWS Lambda + S3', detail: '10M+ events/day.', tags: ['AWS'] },
              ],
            },
          ],
        },
      })
      // Stream the body in 1 chunk to simulate the model's behavior.
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body,
      })
    })

    await goToChat(page)

    // Click a chip to trigger the API call (auto-uses a starter prompt).
    const firstChip = page.locator('button.rounded-full').first()
    await firstChip.click()

    // The diff card should show: 2 added, intent label.
    await expect(page.getByText(/2 added/)).toBeVisible({ timeout: 15_000 })

    // The right panel should now have 2 new sections (Summary + 2 added = 3 sections).
    // Wait for the sandbox to update.
    await expect.poll(async () => {
      const sb = await getSandbox(page, convId)
      return sb?.sections?.length ?? 0
    }, { timeout: 10_000 }).toBe(3)
  })

  test('persists a new sandbox to localStorage on conversation creation', async ({ page }) => {
    const convId = 'e2e-persist-' + Date.now()
    await page.goto('/')
    // No active conversation; we'll start a new one by submitting a prompt.
    await goToChat(page)

    // Mock the API to return an empty patch.
    await page.route('**/api/resume-chat', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: JSON.stringify({
          commentary: 'Hi there.',
          intent: 'Greeting',
          focus: 'General resume',
          patch: {},
        }),
      })
    })

    // Type a message and submit.
    const textarea = page.getByPlaceholder(/Ask about/)
    await textarea.fill('Hello')
    await textarea.press('Enter')

    // After submit, an active session id should be set.
    const activeId = await page.evaluate(() => localStorage.getItem('resume-active-session'))
    expect(activeId).toBeTruthy()

    // A session should exist (with messages).
    const session = await page.evaluate((id) => {
      const raw = localStorage.getItem(`resume-session-${id}`)
      return raw ? JSON.parse(raw) : null
    }, activeId)
    expect(session).toBeTruthy()
    expect(session.messages.length).toBeGreaterThanOrEqual(1)
  })

  test('clears the sandbox on new conversation', async ({ page }) => {
    const convId = 'e2e-clear-' + Date.now()
    await page.goto('/')
    await seedSession(page, convId, {
      sandbox: makeSandbox(convId, [
        { id: 'summary', type: 'summary', title: 'Summary', items: [{ label: 'Test' }] },
      ]),
    })

    await goToChat(page)

    // Verify the seeded section is visible. Scope to the first visible
    // A4 sheet to avoid the measurement-root duplicate.
    const sheet = page.locator('.a4-sheet').first()
    await expect(sheet.getByText('Summary').first()).toBeVisible({ timeout: 10_000 })

    // Click the "New chat" button in the sidebar.
    const newChatBtn = page.getByRole('button', { name: /New chat/i }).first()
    await newChatBtn.click()

    // The sandbox should be cleared from localStorage.
    const cleared = await getSandbox(page, convId)
    expect(cleared).toBeNull()
  })

  test('no React key warnings across renders with multi-type sandbox', async ({ page }) => {
    const convId = 'e2e-warn-' + Date.now()
    await page.goto('/')
    await seedSession(page, convId, {
      sandbox: makeSandbox(convId, [
        { id: 'highlights-a', type: 'highlights', title: 'Highlights A', items: [
          { label: 'Item A1' },
          { label: 'Item A2' },
        ]},
        { id: 'highlights-b', type: 'highlights', title: 'Highlights B', items: [
          { label: 'Item B1' },
          { label: 'Item B2' },
          { label: 'Item B3' },
        ]},
        { id: 'projects-a', type: 'projects', title: 'Projects A', items: [
          { label: 'Proj 1' },
        ]},
        { id: 'projects-b', type: 'projects', title: 'Projects B', items: [
          { label: 'Proj 2' },
          { label: 'Proj 3' },
        ]},
        { id: 'experience-a', type: 'experience', title: 'Experience A', items: [
          { label: 'Job 1', value: '2020-2022', detail: 'Built things.' },
        ]},
      ]),
    })

    await goToChat(page)
    await expect(page.locator('.a4-sheet').first()).toBeVisible({ timeout: 10_000 })

    // Filter the captured errors: none of the duplicate-key warnings should fire.
    const keyErrors = consoleErrors.filter((e) =>
      e.message.toLowerCase().includes('two children with the same key') ||
      e.message.toLowerCase().includes('non-unique keys')
    )
    expect(keyErrors).toEqual([])

    // Also assert the broad app-error filter is clean.
    const appErrors = consoleErrors.filter((e) => !isNoise(e.message))
    expect(appErrors).toEqual([])
  })
})
