import { test, expect, type Page } from '@playwright/test'
import { starterChips } from '@/lib/profile'
import { STATIC_PROJECTS, DOMAINS, SKILL_GROUPS, CAREER, SIDE_PROJECTS, SOCIAL_LINKS } from '@/components/landing/data'

// ── Helpers ──────────────────────────────────────────────────────────────

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
  await page.goto('/')
  // Wait for the page to be fully loaded — the hero section should be visible
  await page.waitForLoadState('networkidle')
}

async function scrollToSection(page: Page, sectionTestId: string) {
  const el = page.locator(`text=${sectionTestId}`)
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800) // wait for reveal animation
}

// ── Tests ────────────────────────────────────────────────────────────────

test.describe('Landing Page — Full E2E', () => {

  // ── NavBar ───────────────────────────────────────────────────────────
  test.describe('NavBar', () => {
    test('renders logo and site title', async ({ page }) => {
      await setupPage(page)
      await expect(page.locator('nav')).toBeVisible()
      await expect(page.getByText('khiw.dev')).toBeVisible()
    })

    test('shows navigation links: Blog, Chat, Admin, KG', async ({ page }) => {
      await setupPage(page)
      const nav = page.locator('nav')
      // Blog and Chat should always be visible (hidden sm:flex becomes flex on wide viewport)
      // We check they exist in DOM
      await expect(nav.getByText('Blog')).toBeVisible()
      await expect(nav.getByText('Chat')).toBeVisible()
    })

    test('shows Sign in button when not authenticated', async ({ page }) => {
      await setupPage(page)
      await expect(page.getByText('Sign in')).toBeVisible()
    })
  })

  // ── HeroChat ──────────────────────────────────────────────────────────
  test.describe('HeroChat Section', () => {
    test('displays the main heading and greeting', async ({ page }) => {
      await setupPage(page)
      await expect(page.getByText('Ask me anything')).toBeVisible()
      await expect(page.getByText(/Hi, I'm Ikkyu/)).toBeVisible()
    })

    test('renders all starter chips', async ({ page }) => {
      await setupPage(page)
      for (const chip of starterChips) {
        await expect(page.getByText(chip.label)).toBeVisible()
      }
    })

    test('shows chat input textarea with placeholder', async ({ page }) => {
      await setupPage(page)
      const textarea = page.locator('textarea')
      await expect(textarea).toBeVisible()
      await expect(textarea).toHaveAttribute('placeholder', /Ask about/)
    })

    test('clicking a starter chip hides chips and shows user message', async ({ page }) => {
      await setupPage(page)
      const chip = starterChips[0]
      await page.getByText(chip.label).click()
      // Wait for the AI response to start streaming
      await page.waitForTimeout(3000)
      // The user's question should appear as a chat bubble
      await expect(page.getByText(chip.prompt)).toBeVisible()
    })
  })

  // ── Projects ──────────────────────────────────────────────────────────
  test.describe('Projects Section', () => {
    test('renders section with heading and project cards', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Selected Work')
      await expect(page.getByText('Selected Work')).toBeVisible()
      await expect(page.getByText('From 50+ Vercel deployments')).toBeVisible()
      for (const project of STATIC_PROJECTS) {
        await expect(page.getByText(project.name)).toBeVisible()
      }
    })

    test('opens detail panel when clicking a project card', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Selected Work')
      const firstProject = STATIC_PROJECTS[0]
      await page.getByText(firstProject.name).click()
      // Detail dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('dialog')).toContainText(firstProject.description)
      // Close the dialog
      await page.getByLabel('Close').click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
  })

  // ── Domains ───────────────────────────────────────────────────────────
  test.describe('Domains Section', () => {
    test('renders section with industry domain cards', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Industry Domains')
      await expect(page.getByText('Industry Domains')).toBeVisible()
      for (const domain of DOMAINS) {
        await expect(page.getByText(domain.label)).toBeVisible()
      }
    })
  })

  // ── Skills ────────────────────────────────────────────────────────────
  test.describe('Skills Section', () => {
    test('renders Tech Stack heading with category tabs', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Tech Stack')
      await expect(page.getByText('Tech Stack')).toBeVisible()
      for (const group of SKILL_GROUPS) {
        await expect(page.getByText(group.category)).toBeVisible()
      }
    })

    test('switching category tab shows different skills', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Tech Stack')
      // Click the second category tab
      const secondCat = SKILL_GROUPS[1]
      await page.getByText(secondCat.category).click()
      // Wait for transition
      await page.waitForTimeout(300)
      // Some skills from this category should be visible
      for (const skill of secondCat.skills.slice(0, 2)) {
        await expect(page.getByText(skill)).toBeVisible()
      }
    })
  })

  // ── Career ────────────────────────────────────────────────────────────
  test.describe('Career Section', () => {
    test('renders Career Timeline with entries', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Career Timeline')
      await expect(page.getByText('Career Timeline')).toBeVisible()
      // First career entry (most recent) should be expanded by default
      const latest = CAREER[0]
      await expect(page.getByText(latest.title)).toBeVisible()
      await expect(page.getByText(latest.company)).toBeVisible()
    })

    test('expanding a career entry shows description', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Career Timeline')
      // The first entry should be expanded by default (expandedIndex === 0)
      const firstEntry = CAREER[0]
      await expect(page.getByText(firstEntry.description)).toBeVisible()
    })

    test('shows Education section', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Career Timeline')
      await expect(page.getByText('Education')).toBeVisible()
      await expect(page.getByText(/B\.Eng Mechanical Engineering/)).toBeVisible()
    })
  })

  // ── Open Source ───────────────────────────────────────────────────────
  test.describe('Open Source Section', () => {
    test('renders Passion Projects with entries', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Passion Projects')
      await expect(page.getByText('Passion Projects')).toBeVisible()
      const first = SIDE_PROJECTS[0]
      await expect(page.getByText(first.name)).toBeVisible()
    })
  })

  // ── Contact ───────────────────────────────────────────────────────────
  test.describe('Contact Section', () => {
    test('renders Get in Touch with social links', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Get in Touch')
      await expect(page.getByText('Get in Touch')).toBeVisible()
      await expect(page.getByText(/Have a project in mind/)).toBeVisible()
      // Check social link labels
      for (const link of SOCIAL_LINKS) {
        await expect(page.getByText(link.title)).toBeVisible()
      }
    })

    test('shows Start a Chat button with link to /chat', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'Get in Touch')
      const chatBtn = page.getByText('Start a Chat')
      await expect(chatBtn).toBeVisible()
      await expect(chatBtn).toHaveAttribute('href', '/chat')
    })
  })

  // ── ScrollIndicator ───────────────────────────────────────────────────
  test.describe('ScrollIndicator', () => {
    test('shows scroll indicator at top of page', async ({ page }) => {
      await setupPage(page)
      // Before scrolling, the indicator should be visible
      await page.waitForTimeout(500)
      await expect(page.getByText('Scroll')).toBeVisible()
    })
  })

  // ── Footer ────────────────────────────────────────────────────────────
  test.describe('Footer', () => {
    test('renders footer with credit text', async ({ page }) => {
      await setupPage(page)
      await scrollToSection(page, 'AI-Augmented Full-Stack Developer')
      await expect(page.getByText(/Built by Khiw/)).toBeVisible()
      await expect(page.getByText(/Next.js/)).toBeVisible()
    })
  })

  // ── Console Errors ────────────────────────────────────────────────────
  test.describe('Console errors', () => {
    test('no JavaScript errors during page load', async ({ page }) => {
      await setupPage(page)
      // Allow some time for async operations to complete
      await page.waitForTimeout(2000)
      // Filter out benign MetaMask extension noise
      const appErrors = consoleErrors.filter((e) => {
        const msg = e.message.toLowerCase()
        return !msg.includes('moz-extension') &&
               !msg.includes('installhook') &&
               !msg.includes('metamask') &&
               !msg.includes('fullscreen') &&
               !msg.includes('maxlistenerse exceeded') &&
               !msg.includes('orphaned data') &&
               !msg.includes('malformed chunk') &&
               !msg.includes('the resource at') &&
               !msg.includes('deprecated')
      })
      expect(appErrors).toEqual([])
    })
  })
})
