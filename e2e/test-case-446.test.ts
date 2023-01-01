import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('list with a long last item', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'test-case-446')
    await page.waitForTimeout(300)
  })

  // the float height was causing a load of item 9
  test('starts from item with index 10', async ({ page }) => {
    const firstItemIndex = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-test-id=virtuoso-item-list]')!
      return (listContainer as HTMLElement).firstElementChild!.getAttribute('data-item-index')
    })
    expect(firstItemIndex).toBe('10')
  })
})
