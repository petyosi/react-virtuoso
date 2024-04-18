import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('scroll to index', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'scroll-to-index')
    await page.reload()
    await page.waitForTimeout(100)
  })

  // the example below goes to 670, because the initial render
  // renders 7x30px items (jumping back to 6 visible afterwards)
  // so it goes to (30-7) * 20 + (7 * 30)
  test('scrolls to the top 30 item', async ({ page }) => {
    await page.click('#start-30')

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('[data-testid=virtuoso-scroller]')!.scrollTop
    })

    expect(scrollTop).toBe((30 - 7) * 20 + 7 * 30)
  })

  test('scrolls to the 30 item with 5 offset', async ({ page }) => {
    await page.click('#offset-30')

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('[data-testid=virtuoso-scroller]')!.scrollTop
    })

    expect(scrollTop).toBe((30 - 7) * 20 + 7 * 30 + 5)
  })

  test('scrolls to the mid 50 item', async ({ page }) => {
    await page.click('#center-50')

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('[data-testid=virtuoso-scroller]')!.scrollTop
    })
    const rendered30s = 11
    expect(scrollTop).toBe((50 - rendered30s) * 20 + rendered30s * 30 - 300 / 2 + 20 / 2)
  })

  test('scrolls to the end 99 item', async ({ page }) => {
    await page.click('#end-99')

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('[data-testid=virtuoso-scroller]')!.scrollTop
    })

    const rendered30s = 14
    expect(scrollTop).toBe((99 - rendered30s) * 20 + rendered30s * 30 - 300 + 30)
  })
})
