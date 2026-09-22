import { expect, test } from '@playwright/test'

test('estimates its height before entering the window viewport', async ({ baseURL, page }) => {
  await page.goto(`${baseURL}/?story=window-offscreen-bootstrap--example&mode=preview`)
  await page.waitForSelector('[data-storyloaded]')

  const scroller = page.locator('[data-virtuoso-scroller]')
  await expect.poll(() => scroller.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(3000)

  const initialLayout = await scroller.evaluate((element) => ({
    documentHeight: document.documentElement.scrollHeight,
    listHeight: element.getBoundingClientRect().height,
    listTop: element.getBoundingClientRect().top,
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
  }))

  expect(initialLayout.scrollY).toBe(0)
  expect(initialLayout.listTop).toBeGreaterThan(initialLayout.viewportHeight)
  expect(initialLayout.listHeight).toBeGreaterThan(3000)
  expect(initialLayout.documentHeight).toBeGreaterThan(initialLayout.listTop + 3000)
  await expect(page.locator('[data-item-index="0"]')).toBeAttached()
})
