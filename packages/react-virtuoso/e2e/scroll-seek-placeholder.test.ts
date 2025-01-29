import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('list with scroll seek placeholders', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'scroll-seek-placeholder')
    await page.waitForTimeout(100)
  })

  test('renders placeholders when scrolled', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
      setInterval(() => {
        scroller.scrollBy({ top: 30 })
      }, 10)
    })

    await page.waitForSelector('div[aria-label=placeholder]')

    const color = await page.evaluate(() => {
      const placeholderItem = document.querySelector('[data-testid=virtuoso-item-list] > div') as HTMLElement
      return placeholderItem.style.color
    })

    expect(color).toBe('red')
  })
})
