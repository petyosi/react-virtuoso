import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('window table with header', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'window-table')
    await page.waitForTimeout(100)
  })

  test('renders correct total height', async ({ page }) => {
    const height = await page.locator('[data-virtuoso-scroller]').evaluate((el) => el.style.height)
    expect(height).toBe('3254px')
  })
})
