import { test, expect } from '@playwright/test'
import { navigateToExample } from './utils'

test.describe('jagged grouped list', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'grouped')
    await page.waitForTimeout(100)
  })

  test('renders correct sizing', async ({ page }) => {
    const [paddingTop, paddingBottom] = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-test-id=virtuoso-item-list]') as HTMLElement
      return [listContainer.style.paddingTop, listContainer.style.paddingBottom]
    })

    expect(paddingTop).toBe('30px')
    expect(paddingBottom).toBe('1500px')
  })

  test('renders correct state when scrolled', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-test-id=virtuoso-scroller]') as HTMLElement
      scroller.scrollTo({ top: 500 })
    })

    await page.waitForTimeout(100)

    const stickyItemIndex = await page.evaluate(() => {
      const stickyItem = document.querySelector('[data-test-id=virtuoso-top-item-list] > div') as HTMLElement
      return stickyItem.dataset['index']
    })

    expect(stickyItemIndex).toBe('20')
  })
})

test.describe('scroll into view for grouped list', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'group-scroll-into-view')
    await page.waitForTimeout(100)
  })

  test('goes to correct location', async ({ page }) => {
    await page.click('data-test-id=scroll-into-view-button')
    await page.waitForTimeout(100)

    const scrollTop = await page.locator('data-test-id=virtuoso-scroller').evaluate((element) => {
      return element.scrollTop
    })

    expect(scrollTop).toBe(20)
  })
})
