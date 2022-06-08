import { test, expect } from '@playwright/test'

test.describe('list with hundred items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/hello')
    await page.waitForSelector('#test-root')
    await page.waitForTimeout(100)
  })

  test('renders only 10 items', async ({ page }) => {
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div > div > div')!
      return listContainer.childElementCount
    })
    expect(itemCount).toBe(10)
  })

  test('fills in the scroller', async ({ page }) => {
    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div')!
      return scroller.scrollHeight
    })
    expect(scrollHeight).toBe(100 * 30)
  })
})
