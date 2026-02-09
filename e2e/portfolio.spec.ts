import { test, expect } from '@playwright/test'

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .fill('admin@lean.com')
    await page.locator('input[type="password"]').first().fill('Admin@123')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
  })

  test('should display portfolio list page', async ({ page }) => {
    await page.goto('/dashboard/portfolios')
    await expect(
      page.locator('text=/portfolio/i').first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('should navigate between dashboard sections', async ({ page }) => {
    await page.goto('/dashboard')
    const navLinks = page.locator('nav a, aside a, [role="navigation"] a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})
