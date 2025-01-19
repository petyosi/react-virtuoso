import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('list with hundred items', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'hello')
    await page.waitForTimeout(100)
  })

  test('renders only 10 items', async ({ page }) => {
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-testid=virtuoso-item-list]')!
      return listContainer.childElementCount
    })
    expect(itemCount).toBe(10)
  })

  test('fills in the scroller', async ({ page }) => {
    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
      return scroller.scrollHeight
    })
    expect(scrollHeight).toBe(100 * 30)
  })
})
