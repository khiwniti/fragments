import { test, expect } from '@playwright/test'

const A4_RATIO = 794 / 1123

test.describe('A4 Resume Artifact Panel', () => {
  test('generates resume into A4 sheets with correct aspect ratio', async ({
    page,
  }) => {
    await page.goto(
      '/chat?prompt=' +
        encodeURIComponent('What is your cloud architecture experience?'),
    )

    // Streaming opens the artifact panel; first sheet appears once
    // sections start arriving.
    const sheet = page.locator('.a4-sheet').first()
    await expect(sheet).toBeVisible({ timeout: 90_000 })

    const box = await sheet.boundingBox()
    expect(box).not.toBeNull()
    expect(Math.abs(box!.width / box!.height - A4_RATIO)).toBeLessThan(0.01)

    // Page badge renders under the sheet.
    await expect(page.getByText(/^1 \/ \d+$/).first()).toBeVisible()
  })

  test('long content paginates into multiple sheets', async ({ page }) => {
    await page.goto(
      '/chat?prompt=' +
        encodeURIComponent(
          'Show me your complete full resume with every section: highlights, experience, projects, skills, education, certifications, and summary, in full detail.',
        ),
    )

    await expect(page.locator('.a4-sheet').first()).toBeVisible({
      timeout: 90_000,
    })
    // Wait for streaming to finish growing pages.
    await page.waitForTimeout(20_000)

    const count = await page.locator('.a4-sheet').count()
    expect(count).toBeGreaterThan(1)
  })
})