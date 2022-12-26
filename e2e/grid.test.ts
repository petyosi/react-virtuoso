import { test, expect } from '@playwright/test'
import { navigateToExample } from './utils'

test.describe('list with hundred items', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'grid')
    await page.waitForTimeout(100)
  })

  test('renders 16 items', async ({ page }) => {
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-test-id=virtuoso-item-list]')
      return listContainer!.childElementCount
    })
    expect(itemCount).toBe(16)
  })

  test('fills in the scroller', async ({ page }) => {
    await page.waitForTimeout(100)
    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('[data-test-id=virtuoso-scroller]')
      return scroller!.scrollHeight
    })
    expect(scrollHeight).toBe(2000)
  })
})
