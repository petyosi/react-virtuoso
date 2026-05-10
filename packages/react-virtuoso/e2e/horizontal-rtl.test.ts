import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

import type { Page } from '@playwright/test'

function itemPosition(page: Page, index: number) {
  return page.evaluate((index) => {
    const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
    const item = document.querySelector(`[data-item-index="${index}"]`)!
    const scrollerRect = scroller.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()

    return {
      itemLeft: Math.round(itemRect.left),
      itemRight: Math.round(itemRect.right),
      scrollerLeft: Math.round(scrollerRect.left),
      scrollerRight: Math.round(scrollerRect.right),
    }
  }, index)
}

function expectClosePosition(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1)
}

test.describe('horizontal list in rtl', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'horizontal-rtl')
  })

  test('renders initial items from the right edge', async ({ page }) => {
    const position = await itemPosition(page, 0)

    expectClosePosition(position.itemRight, position.scrollerRight)
  })

  test('scrolls to an index using logical offsets', async ({ page }) => {
    await page.click('#start-20')
    await expect(page.locator('[data-testid=range]')).toHaveText('20-25')

    let position = await itemPosition(page, 20)
    expectClosePosition(position.itemRight, position.scrollerRight)

    await page.click('#end-20')
    await expect(page.locator('[data-testid=range]')).toHaveText('15-20')

    position = await itemPosition(page, 20)
    expectClosePosition(position.itemLeft, position.scrollerLeft)
  })
})
