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
    const top = Math.ceil(Math.max(area.top, list.top))
    const bottom = Math.floor(Math.min(area.bottom, list.bottom))
    if (bottom <= top) {
      throw new Error('The list is outside of the visible area')
    }
    let blank = 0
    // The first, middle and last column, so that a grid with a wrong column count does not pass.
    for (const x of [list.left + 5, list.left + list.width / 2, list.right - 5]) {
      for (let y = top; y < bottom; y++) {
        // The sticky table header legitimately covers part of the list.
        if (!document.elementFromPoint(x, y)?.closest('[data-index], thead')) {
          blank++
        }
      }
    }
    return blank
  }, fraction)
}

// The distance in screen pixels between the top of an item and the top of the visible area.
function itemTopOffset(page: Page, index: number) {
  return page.evaluate((index) => {
    const custom = document.querySelector('[data-testid=scroll-parent]')
    const item = document.querySelector(`[data-index="${index}"]`)
    return item ? item.getBoundingClientRect().top - (custom ? custom.getBoundingClientRect().top : 0) : null
  }, index)
}

async function openStory(page: Page, baseURL: string | undefined, story: string) {
  await page.goto(`${baseURL}/?story=css-zoom--${story}&mode=preview`)
  await page.waitForSelector('[data-storyloaded]')
  await page.waitForSelector('[data-index]')
}

for (const story of [
  'custom-scroll-parent',
  'custom-scroll-parent-zoom-in',
  'custom-scroll-parent-zoomed',
  'custom-scroll-parent-inexact-zoom',
  'custom-scroll-parent-list-zoom',
  'default-scroller',
  'table-custom-scroll-parent',
  'window-scroll',
  'grid-custom-scroll-parent',
]) {
  test(`css zoom: ${story} fills the viewport and keeps loading`, async ({ baseURL, page }) => {
    await openStory(page, baseURL, story)

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

for (const story of ['imperative-window-scroll', 'imperative-window-scroll-zoom-in', 'imperative-custom-scroll-parent']) {
  test(`css zoom: ${story} scrolls to the requested position and restores it`, async ({ baseURL, page }) => {
    await openStory(page, baseURL, story)

    await page.click('#scroll-to-index')
    await expect.poll(() => itemTopOffset(page, 500)).toBeCloseTo(0, 0)

    await page.click('#scroll-by')
    await expect.poll(() => itemTopOffset(page, 600)).toBeCloseTo(0, 0)

    await page.click('#save-and-restore')
    await expect.poll(async () => Number(await page.locator('#snapshot-scroll-top').textContent())).toBeCloseTo(24000, 0)
    await expect.poll(() => itemTopOffset(page, 600)).toBeCloseTo(0, 0)
  })
}

for (const story of ['grid-fixed-width', 'grid-fixed-width-zoom-in']) {
  test(`css zoom: ${story} computes the rendered column count`, async ({ baseURL, page }) => {
    await openStory(page, baseURL, story)

    // 100 items in 4 columns of 30px rows. A wrong column count produces a list of a different height.
    await expect.poll(() => page.locator('[data-testid=scroll-parent]').evaluate((el) => el.scrollHeight)).toBe(750)
  })
}

test('css zoom: a grid that fits without scrolling reports endReached', async ({ baseURL, page }) => {
  await openStory(page, baseURL, 'grid-fits-without-scrolling')

  await expect(page.locator('#end-reached-count')).toHaveText('1')
})
