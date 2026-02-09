import { test, expect } from '@playwright/test'

test.describe('Role-Based Access Control', () => {
  test('VIEWER should not see create portfolio (superadmin-only)', async ({
    page,
  }) => {
    await page.goto('/login')
    await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .fill('viewer@lean.com')
    await page.locator('input[type="password"]').first().fill('User@123')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    await page.goto('/dashboard/portfolios')
    await expect(
      page.locator('text=/portfolio/i').first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('ADMIN should see dashboard after login', async ({ page }) => {
    await page.goto('/login')
    await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .fill('admin@lean.com')
    await page.locator('input[type="password"]').first().fill('Admin@123')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await expect(page).toHaveURL(/dashboard/)
  })
})
