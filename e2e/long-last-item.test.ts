import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('list with a long last item', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'long-last-item')
    await page.waitForTimeout(300)
  })

  test('starts from the last item', async ({ page }) => {
    const paddingTop: string = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-test-id=virtuoso-item-list]')!
      return (listContainer as HTMLElement).style.paddingTop
    })
    expect(paddingTop).toBe('7200px')
  })

  test('compensates on upwards scrolling correctly', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-test-id=virtuoso-scroller]')!
      scroller.scrollBy({ top: -2 })
    })

    await page.waitForTimeout(200)

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('[data-test-id=virtuoso-scroller]')!.scrollTop
    })

    // items are 800 and 100px tall.
    // scrolling up by 2px reveals an unexpectedly short item, so it should compensate
    expect(scrollTop).toBe(7200 - 2 - (800 - 100))
  })
})
