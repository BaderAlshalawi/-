import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    await expect(
      page.locator('input[type="email"], input[name="email"]').first()
    ).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .fill('wrong@test.com')
    await page.locator('input[type="password"]').first().fill('wrongpassword')
    await page.locator('button[type="submit"]').click()
    await expect(
      page.locator('text=/error|invalid|incorrect/i').first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('should login successfully and redirect to dashboard', async ({ page }) => {
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

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login**', { timeout: 10000 })
    await expect(page).toHaveURL(/login/)
  })
})
