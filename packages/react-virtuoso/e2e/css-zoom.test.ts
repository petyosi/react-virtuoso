import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

// CSS zoom scales getBoundingClientRect() but not scrollTop or scrollHeight. In these stories the list sits inside a zoomed
// element and scrolls a custom scroll parent or the window.

// Scrolls to `fraction` of the scrollable distance and returns how many screen pixels of the visible list area no item covers.
function scrollAndMeasureBlank(page: Page, fraction: number) {
  return page.evaluate(async (fraction) => {
    const custom = document.querySelector<HTMLElement>('[data-testid=scroll-parent]')
    const scroller = custom ?? document.documentElement
    scroller.scrollTop = fraction * (scroller.scrollHeight - scroller.clientHeight)
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })

    const area = custom ? custom.getBoundingClientRect() : { bottom: window.innerHeight, top: 0 }
    const list = document.querySelector('[data-testid=virtuoso-item-list]')!.getBoundingClientRect()
    const x = list.left + 5
    let blank = 0
    for (let y = Math.ceil(Math.max(area.top, list.top)); y < Math.floor(Math.min(area.bottom, list.bottom)); y++) {
      if (!document.elementFromPoint(x, y)?.closest('[data-index]')) {
        blank++
      }
    }
    return blank
  }, fraction)
}

for (const story of [
  'custom-scroll-parent',
  'custom-scroll-parent-zoom-in',
  'custom-scroll-parent-zoomed',
  'window-scroll',
  'grid-custom-scroll-parent',
]) {
  test(`css zoom: ${story} fills the viewport and keeps loading`, async ({ baseURL, page }) => {
    await page.goto(`${baseURL}/?story=css-zoom--${story}&mode=preview`)
    await page.waitForSelector('[data-storyloaded]')
    await page.waitForSelector('[data-index]')

    expect(await scrollAndMeasureBlank(page, 0.25)).toBe(0)
    expect(await scrollAndMeasureBlank(page, 0.5)).toBe(0)
    expect(await scrollAndMeasureBlank(page, 0.75)).toBe(0)

    // endReached appends 50 items every time the end of the list is reached
    await scrollAndMeasureBlank(page, 1)
    await expect(page.locator('#loaded-count')).toHaveText('100')
    await scrollAndMeasureBlank(page, 1)
    await expect(page.locator('#loaded-count')).toHaveText('150')
    expect(await scrollAndMeasureBlank(page, 0.9)).toBe(0)
  })
}
