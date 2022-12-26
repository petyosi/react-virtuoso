import { test, expect } from '@playwright/test'
import { navigateToExample } from './utils'

test.describe('jagged list with 2 top items', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'top-items')
    await page.waitForTimeout(100)
  })

  test('stays at top at start', async ({ page }) => {
    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-test-id=virtuoso-scroller]')!
      return listContainer.scrollTop
    })

    expect(scrollTop).toBe(0)

    const paddingTop = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-test-id=virtuoso-item-list]') as HTMLElement
      return listContainer.style.paddingTop
    })

    expect(paddingTop).toBe('70px')
  })

  test('renders correct amount of items', async ({ page }) => {
    const childElementCount = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-test-id=virtuoso-item-list]')
      return listContainer?.childElementCount || 0
    })
    expect(childElementCount).toBe(9)
  })

  test('renders the full list correctly', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-test-id=virtuoso-scroller]')!
      scroller.scrollTo({ top: 2000 })
    })

    await page.waitForTimeout(100)

    const firstChildIndex: string = await page.evaluate(() => {
      const firstChild = document.querySelector('[data-test-id=virtuoso-item-list] > div') as HTMLElement
      return firstChild.dataset['index']!
    })

    expect(firstChildIndex).toBe('85')
  })
})
