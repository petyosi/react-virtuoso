import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

import type { Page } from '@playwright/test'

test.describe('list with prependable items', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'prepend-items')
    await page.waitForTimeout(100)
  })

  async function getScrollTop(page: Page) {
    await page.waitForTimeout(100)
    return page.locator('data-testid=virtuoso-scroller').evaluate((el) => el.scrollTop)
  }

  test('keeps the location at where it should be (2 items)', async ({ page }) => {
    expect(await getScrollTop(page)).toBe(0)

    await page.locator('data-testid=prepend-2').click()

    expect(await getScrollTop(page)).toBe(2 * 55)

    await page.locator('data-testid=prepend-2').click()

    expect(await getScrollTop(page)).toBe(4 * 55)
  })

  test('keeps the location at where it should be (200 items)', async ({ page }) => {
    expect(await getScrollTop(page)).toBe(0)

    await page.locator('data-testid=prepend-200').click()

    expect(await getScrollTop(page)).toBe(200 * 55)
  })

  /**
   * Samples every animation frame across a prepend and returns how many of them
   * had rows rendered while none of them intersected the viewport.
   */
  async function blankFramesDuringPrepend(page: Page) {
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')
      if (!scroller) {
        throw new Error('no scroller')
      }
      const w = window as unknown as { __blankFrames: number; __stopSampling: () => void }
      w.__blankFrames = 0
      let running = true
      const sample = () => {
        if (!running) {
          return
        }
        const view = scroller.getBoundingClientRect()
        const rows = Array.from(scroller.querySelectorAll('[data-index]'))
        if (rows.length > 0) {
          const anyVisible = rows.some((row) => {
            const r = row.getBoundingClientRect()
            return r.bottom > view.top && r.top < view.bottom
          })
          if (!anyVisible) {
            w.__blankFrames += 1
          }
        }
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
      w.__stopSampling = () => {
        running = false
      }
    })

    await page.locator('data-testid=prepend-200').click()
    await page.waitForTimeout(400)

    return page.evaluate(() => {
      const w = window as unknown as { __blankFrames: number; __stopSampling: () => void }
      w.__stopSampling()
      return w.__blankFrames
    })
  }

  test('never paints a frame with every row out of view', async ({ page }) => {
    // The compensation is a deviation that grows the content plus a scroll that
    // cancels it. If the scroll lands a frame after the growth, one painted
    // frame has the whole list pushed below the fold — and because prepends
    // fire near scrollTop 0, that is the entire viewport.
    expect(await blankFramesDuringPrepend(page)).toBe(0)
  })
})
