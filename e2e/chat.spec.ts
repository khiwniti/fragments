import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('chat panel renders and sends', async ({ page }) => {
  await page.goto('/chat')
  // CopilotChat input uses the placeholder as its accessible name
  const input = page.getByRole('textbox', { name: 'Ask about experience, skills, or projects...' })
  await expect(input).toBeVisible()
  await input.fill('hello')
  // Send button has data-testid="copilot-send-button"
  await page.locator('[data-testid="copilot-send-button"]').click()
  // Verify the message appears in the chat
  await expect(page.getByText('hello')).toBeVisible()
})

test('no horizontal overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  for (const path of ['/', '/chat']) {
    await page.goto(path)
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})

test('chat panel a11y scan', async ({ page }) => {
  await page.goto('/chat')
  // Scan the full page but exclude known CopilotKit third-party issues
  const results = await new AxeBuilder({ page })
    .exclude('[data-copilotkit]')
    .analyze()
  expect(results.violations).toEqual([])
})
