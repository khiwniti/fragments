import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('chat panel renders and sends', async ({ page }) => {
  await page.goto('/chat')
  const input = page.getByRole('textbox', { name: 'Chat message' })
  await expect(input).toBeVisible()
  await input.fill('hello')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('log', { name: 'Chat messages' })).toContainText('hello')
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
  const results = await new AxeBuilder({ page }).include('aside').analyze()
  expect(results.violations).toEqual([])
})