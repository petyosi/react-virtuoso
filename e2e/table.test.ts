import { test, expect } from '@playwright/test'

test.describe('window table with header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/window-table')
    await page.waitForSelector('#test-root')
    await page.waitForTimeout(100)
  })

  test('renders correct total height', async ({ page }) => {
    const height = await page.locator('[data-virtuoso-scroller]').evaluate((el) => el.style.height)
    expect(height).toBe('3254px')
  })
})
