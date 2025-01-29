import { expect, test } from '@playwright/test'

//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('jagged grouped list', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'grouped-topmost-item')
    await page.waitForTimeout(100)
  })

  test('puts the specified item below the group', async ({ page }) => {
    // we pick the second item, the first should remain under the group header
    const stickyItemIndex = await page.evaluate(() => {
      const stickyItem = document.querySelector('[data-testid=virtuoso-item-list] > div:nth-child(2)') as HTMLElement
      return stickyItem.dataset.itemIndex
    })

    expect(stickyItemIndex).toBe('10')
  })
})
