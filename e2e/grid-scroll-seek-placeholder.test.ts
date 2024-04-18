import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('list with scroll seek placeholders', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'grid-scroll-seek-placeholder')
    await page.waitForTimeout(100)
  })

  test('renders grid placeholders when scrolled', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
      setInterval(() => {
        scroller.scrollBy({ top: 30 })
      }, 10)
    })

    await page.waitForSelector('div[aria-label=placeholder]')

    const [width, height, containerPaddingTop, text, color] = await page.evaluate(() => {
      const container = document.querySelector('[data-testid=virtuoso-item-list]') as HTMLElement
      const item = container.getElementsByTagName('div')[0] as HTMLElement
      return [item.offsetWidth, item.offsetHeight, container.style.paddingTop, item.textContent, item.style.color]
    })

    const itemIndex = (parseInt(containerPaddingTop, 10) / 30) * 2

    expect(text).toBe(`Placeholder ${itemIndex}`)
    expect(width).toBe(300)
    expect(height).toBe(30)
    expect(color).toBe('red')
  })
})
