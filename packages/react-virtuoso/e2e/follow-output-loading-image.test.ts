import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('list with hundred items', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'follow-output-loading-image')
    await page.waitForTimeout(100)
  })

  test('scrolls to bottom when image is loaded', async ({ page }) => {
    await page.locator('data-testid=add-image').click()
    await page.waitForTimeout(800)
    const scrollTop = await page.locator('data-testid=virtuoso-scroller').evaluate((el) => el.scrollTop)
    expect(scrollTop).toBe(2800)
  })
})
