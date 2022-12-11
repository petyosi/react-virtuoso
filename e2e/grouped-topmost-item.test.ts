import { test, expect } from '@playwright/test'

test.describe('jagged grouped list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/grouped-topmost-item')
    await page.waitForSelector('#test-root > div')
    await page.waitForTimeout(100)
  })

  test('puts the specified item below the group', async ({ page }) => {
    // we pick the second item, the first should remain under the group header
    const stickyItemIndex = await page.evaluate(() => {
      const stickyItem = document.querySelector('#test-root > div > div:last-child > div > div:nth-child(2)') as HTMLDivElement
      return stickyItem.dataset['itemIndex']
    })

    const { topListItemContainerZIndex, listItemContainerZIndex } = await page.evaluate(() => {
      const topListItemContainerZIndex = Number.parseInt(
        getComputedStyle(document.querySelector('#test-root > div > div') as HTMLDivElement).zIndex
      )

      const listItemContainerZIndex = Number.parseInt(
        getComputedStyle(document.querySelector('#test-root > div > div:last-child') as HTMLDivElement).zIndex
      )

      return {
        topListItemContainerZIndex: Number.isNaN(topListItemContainerZIndex) ? 0 : topListItemContainerZIndex,
        listItemContainerZIndex: Number.isNaN(listItemContainerZIndex) ? 0 : listItemContainerZIndex,
      }
    })

    expect(stickyItemIndex).toBe('10')
    expect(topListItemContainerZIndex).toBeGreaterThan(listItemContainerZIndex)
  })
})
