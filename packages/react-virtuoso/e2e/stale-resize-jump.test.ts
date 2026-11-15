import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

// https://github.com/petyosi/react-virtuoso/issues/1571
test.describe('upward scroll compensation after a clamp jump at the bottom', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'stale-resize-jump')
    await page.waitForSelector('[data-testid=virtuoso-scroller]')
    await page.waitForTimeout(300)
  })

  test('does not re-apply a consumed jump to a later 1px re-measure', async ({ page }) => {
    await page.getByRole('button', { name: /1\. Shrink/ }).click()
    await expect(page.getByTestId('log').locator('li')).toHaveCount(1)

    // Separate wheel notches keep Virtuoso's scroll direction UP while the 1px re-measure lands,
    // which a single programmatic scrollTop write does not do reliably in headless Chromium.
    await page.locator('[data-testid=virtuoso-scroller]').hover()
    await page.mouse.wheel(0, -50)
    await page.waitForTimeout(10)
    await page.mouse.wheel(0, -50)
    await page.waitForTimeout(10)
    await page.mouse.wheel(0, -50)
    await expect(page.getByTestId('log').locator('li')).toHaveCount(2)
    await page.waitForTimeout(300)

    const distanceFromBottom = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
      return scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
    })

    // With the stale jump re-applied, the first notch snaps back to the bottom and only 100px of the 150px remain.
    expect(distanceFromBottom).toBeGreaterThanOrEqual(149)
  })
})
