import { test, expect, Page } from '@playwright/test'

test.describe('list with prependable items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/prepend-items')
    await page.waitForSelector('#test-root')
    await page.waitForTimeout(100)
  })

  async function getScrollTop(page: Page) {
    await page.waitForTimeout(100)
    return await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div > div')
      return scroller!.scrollTop
    })
  }

  test('keeps the location at where it should be', async ({ page }) => {
    expect(await getScrollTop(page)).toBe(0)

    await page.evaluate(() => {
      document.querySelector('button')!.click()
    })

    expect(await getScrollTop(page)).toBe(2 * 55)

    await page.evaluate(() => {
      document.querySelector('button')!.click()
    })

    expect(await getScrollTop(page)).toBe(4 * 55)
  })
})
