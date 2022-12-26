import { test, expect } from '@playwright/test'
import { navigateToExample } from './utils'

test.describe('list with hundred items', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'follow-output-loading-image')
    await page.waitForTimeout(100)
  })

  test('scrolls to bottom when image is loaded', async ({ page }) => {
    await page.locator('data-test-id=add-image').click()
    await page.waitForTimeout(800)
    const scrollTop = await page.locator('data-test-id=virtuoso-scroller').evaluate((el) => el.scrollTop)
    expect(scrollTop).toBe(2800)
  })
})
