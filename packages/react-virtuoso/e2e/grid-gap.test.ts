import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('grid with gaps', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'grid-gap')
    await page.waitForTimeout(100)
  })

  test('renders 16 items', async ({ page }) => {
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-testid=virtuoso-item-list]')
      return listContainer!.childElementCount
    })
    expect(itemCount).toBe(16)
  })

  test('fills in the scroller', async ({ page }) => {
    await page.waitForTimeout(100)
    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')
      return scroller!.scrollHeight
    })
    expect(scrollHeight).toBe(2480)
  })
})
