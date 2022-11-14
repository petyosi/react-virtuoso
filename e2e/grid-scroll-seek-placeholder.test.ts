import { test, expect } from '@playwright/test'

test.describe('list with scroll seek placeholders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/grid-scroll-seek-placeholder')
    await page.waitForSelector('#test-root div')
    await page.waitForTimeout(100)
  })

  test('renders grid placeholders when scrolled', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div')!
      setInterval(() => {
        scroller.scrollBy({ top: 30 })
      }, 10)
    })

    await page.waitForSelector('#test-root div[aria-label=placeholder]')

    const [width, height, containerPaddingTop, text, color] = await page.evaluate(() => {
      const container = document.querySelector('#test-root > div > div:first-child > div') as HTMLElement
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
