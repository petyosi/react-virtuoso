import { test, expect } from '@playwright/test'

const DEFAULT_ITEM_HEIGHT = 35
const OUTLIER = 400
const ITEM_COUNT = 100
const VIEWPORT_HEIGHT = 300
const INITIAL_SCROLL_TOP = DEFAULT_ITEM_HEIGHT * ITEM_COUNT - VIEWPORT_HEIGHT
const SCROLL_DELTA = -50
test.describe('reverse taller than viewport', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1234/reverse-taller-than-viewport')
    await page.waitForSelector('#test-root')
    await page.waitForTimeout(100)
  })

  test('compensates for the tall 90th item', async ({ page }) => {
    const scroller = page.locator('[data-test-id=virtuoso-scroller]')
    await scroller.evaluate((el) => el.scrollBy(0, -50))
    await page.waitForTimeout(200)
    const scrollTop = await scroller.evaluate((el) => el.scrollTop)

    expect(scrollTop).toBe(INITIAL_SCROLL_TOP + SCROLL_DELTA + OUTLIER - DEFAULT_ITEM_HEIGHT)
  })
})
