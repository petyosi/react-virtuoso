import { test, expect } from '@playwright/test'

test.describe('list with scroll seek placeholders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/scroll-seek-placeholder')
    await page.waitForSelector('#test-root div')
    await page.waitForTimeout(100)
  })

  test('renders placeholders when scrolled', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div')!
      setInterval(() => {
        scroller.scrollBy({ top: 30 })
      }, 10)
    })

    await page.waitForSelector('#test-root div[aria-label=placeholder]')

    const color = await page.evaluate(() => {
      const stickyItem = document.querySelector('#test-root > div > div:first-child > div > div') as HTMLElement
      return stickyItem.style.color
    })

    expect(color).toBe('red')
  })
})
