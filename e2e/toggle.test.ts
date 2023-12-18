import { test, expect, Page } from '@playwright/test'

test.describe('list with prependable items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/toggle')
    await page.waitForSelector('#test-root')
    await page.waitForTimeout(100)
  })

  async function getScrollTop(page: Page) {
    await page.waitForTimeout(100)
    return page.locator('data-test-id=virtuoso-scroller').evaluate((el) => Math.round(el.scrollTop))
  }

  test('keeps the location at where it should be (toggle)', async ({ page }) => {
    const iniitalScrollTop = await getScrollTop(page)
    await page.locator('data-test-id=toggle-last-two').click()
    expect(await getScrollTop(page)).toBe(iniitalScrollTop + 100)
    await page.locator('data-test-id=toggle-last-two').click()
    expect(await getScrollTop(page)).toBe(iniitalScrollTop)
  })
})
