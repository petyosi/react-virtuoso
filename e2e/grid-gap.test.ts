import { test, expect } from '@playwright/test'

test.describe('list with hundred items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/grid-gap')
    await page.waitForSelector('#test-root')
    await page.waitForTimeout(100)
  })

  test('renders 16 items', async ({ page }) => {
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div > div > div')
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
    expect(scrollHeight).toBe(2480)
  })
})
