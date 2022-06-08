import { test, expect } from '@playwright/test'

test.describe('initial scroll top', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/initial-scroll-top')
    await page.waitForTimeout(1000) // :(
  })

  test('starts from 50px', async ({ page }) => {
    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelectorAll('#test-root > div')[0]
      return listContainer.scrollTop
    })

    expect(scrollTop).toBe(50)
  })
})
