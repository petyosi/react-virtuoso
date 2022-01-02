import { test, expect } from '@playwright/test'

test.describe('jagged grouped list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/grouped')
    await page.waitForSelector('#test-root > div')
    await page.waitForTimeout(100)
  })

  test('renders correct sizing', async ({ page }) => {
    const [paddingTop, paddingBottom] = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div > div > div:first-child') as HTMLElement
      return [listContainer.style.paddingTop, listContainer.style.paddingBottom]
    })

    expect(paddingTop).toBe('30px')
    expect(paddingBottom).toBe('1500px')
  })

  test('renders correct state when scrolled', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div') as HTMLElement
      scroller.scrollTo({ top: 500 })
    })

    await page.waitForTimeout(100)

    const stickyItemIndex = await page.evaluate(() => {
      const stickyItem = document.querySelector('#test-root > div > div:last-child > div > div') as HTMLElement
      return stickyItem.dataset['index']
    })

    expect(stickyItemIndex).toBe('20')
  })
})
