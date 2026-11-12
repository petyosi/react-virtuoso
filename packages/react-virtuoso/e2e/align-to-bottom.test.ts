import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

test.describe('list aligned to bottom', () => {
  /**
   * Samples the top of a row, relative to the scroller, on every animation frame across a prepend.
   */
  async function rowTopsDuringPrepend(page: Page, rowId: number) {
    await page.evaluate((rowId) => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')
      if (!scroller) {
        throw new Error('no scroller')
      }
      const w = window as unknown as { __rowTops: number[]; __stopSampling: () => void }
      w.__rowTops = []
      let running = true
      const sample = () => {
        if (!running) {
          return
        }
        const row = scroller.querySelector(`[data-row-id="${rowId}"]`)
        if (row) {
          w.__rowTops.push(row.getBoundingClientRect().top - scroller.getBoundingClientRect().top)
        }
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
      w.__stopSampling = () => {
        running = false
      }
    }, rowId)

    await page.locator('data-testid=prepend-1').click()
    await page.waitForTimeout(400)

    return page.evaluate(() => {
      const w = window as unknown as { __rowTops: number[]; __stopSampling: () => void }
      w.__stopSampling()
      return w.__rowTops
    })
  }

  async function openStory(page: Page, baseURL: string | undefined, story: string) {
    await page.goto(`${baseURL}/?story=align-to-bottom--${story}`)
    await page.waitForSelector('[data-storyloaded]')
    await page.waitForTimeout(100)
  }

  test('keeps a short list at the bottom while prepending', async ({ baseURL, page }) => {
    await openStory(page, baseURL, 'prepend')

    const tops = await rowTopsDuringPrepend(page, 1002)
    expect(tops.length).toBeGreaterThan(0)
    expect(new Set(tops)).toEqual(new Set([270]))
  })

  test('keeps the scroll location while prepending to a scrollable list', async ({ baseURL, page }) => {
    await openStory(page, baseURL, 'prepend-scrollable')

    const tops = await rowTopsDuringPrepend(page, 1019)
    expect(tops.length).toBeGreaterThan(0)
    expect(new Set(tops)).toEqual(new Set([270]))
  })
})
