import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

import type { Page } from '@playwright/test'

// The index of the first item whose bottom edge is below the top of the viewport.
function topItemIndex(page: Page) {
  return page.locator('data-testid=virtuoso-scroller').evaluate((scroller) => {
    const top = scroller.getBoundingClientRect().top
    const items = Array.from(scroller.querySelectorAll<HTMLElement>('[data-item-index]'))
    const first = items.find((item) => item.getBoundingClientRect().bottom > top)
    return Number(first?.dataset.itemIndex)
  })
}

test.describe('cancelScrollToIndex', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'scroll-to-index-cancel')
    await page.waitForSelector('[data-testid=virtuoso-scroller]')
    await page.waitForTimeout(300)
  })

  test('a wheel scroll that cancels a pending scrollToIndex is not undone by its retry', async ({ page }) => {
    await page.click('#scroll-to-600')
    // the click left the pointer on the button; wheel over the list
    await page.locator('data-testid=virtuoso-scroller').hover()
    await page.waitForTimeout(30)
    expect(await topItemIndex(page)).toBe(600)
    await page.mouse.wheel(0, -3000)
    await page.waitForTimeout(1000)
    expect(await topItemIndex(page)).toBeLessThan(600)
  })
})
