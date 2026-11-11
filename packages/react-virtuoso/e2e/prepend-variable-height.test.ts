import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils'

for (const viewport of [
  { width: 1200, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`preserves the reading anchor with overscanned measurements at width ${viewport.width}`, async ({ baseURL, page }) => {
    await page.setViewportSize(viewport)
    await navigateToExample(page, baseURL, 'prepend-variable-height')
    const scroller = page.locator('[data-virtuoso-scroller]')
    await page.locator('[data-row-id="10049"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(300)
    await scroller.hover()
    // A single wheel preserves the unmeasured gap between the initial and top ranges.
    await page.mouse.wheel(0, -10000)
    await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBe(0)
    await page.locator('[data-row-id="10000"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(350)

    const anchorTop = () =>
      scroller.evaluate((el) => {
        const anchor = el.querySelector('[data-row-id="10000"]')
        if (!anchor) {
          throw new Error('Reading anchor is not rendered')
        }
        return anchor.getBoundingClientRect().top - el.getBoundingClientRect().top
      })
    const before = await anchorTop()
    async function prependAndCheck() {
      await page.getByRole('button', { name: 'Load older messages' }).click()
      await page.waitForTimeout(700)
      expect(Math.abs((await anchorTop()) - before)).toBeLessThan(1)
    }
    await prependAndCheck()
    await prependAndCheck()
  })
}
