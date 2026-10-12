import { expect, test } from '@playwright/test'

declare global {
  interface Window {
    gridResizeCheck: {
      errors: { columns: number; first: number; padding: number; expected: number; width: number }[]
      samples: number
      stop: () => void
    }
  }
}

for (const mode of ['example', 'element-scroll', 'custom-scroll-parent']) {
  test(`keeps a scrolled grid aligned before paint during resize (${mode})`, async ({ baseURL, page }) => {
    await page.setViewportSize({ height: 900, width: 1440 })
    await page.goto(`${baseURL}/?story=grid-resize--${mode}&mode=preview`)
    const list = page.locator('[data-testid=virtuoso-item-list]')
    await expect(list.locator('[data-index="10"]')).toBeAttached()
    await page.evaluate((mode) => {
      const scroller = document.querySelector<HTMLElement>('[data-virtuoso-scroller]')!
      if (mode === 'example') {
        window.scrollTo(0, 4000)
      } else if (mode === 'custom-scroll-parent') {
        scroller.parentElement!.scrollTop = 4000
      } else {
        scroller.scrollTop = 4000
      }
    }, mode)
    await expect.poll(() => list.evaluate((el) => Number(el.querySelector<HTMLElement>('[data-index]')!.dataset.index))).toBeGreaterThan(0)

    await page.evaluate(() => {
      const list = document.querySelector<HTMLElement>('[data-testid=virtuoso-item-list]')!
      // Registered after Virtuoso's observers: inspect the committed geometry
      // during ResizeObserver delivery, before paint, not after a settling wait.
      const observer = new ResizeObserver(() => {
        const firstItem = list.firstElementChild as HTMLElement | null
        if (!firstItem) {
          return
        }
        const style = getComputedStyle(list)
        const columns = style.gridTemplateColumns.split(' ').length
        const first = Number(firstItem.dataset.index)
        const expected = Math.floor(first / columns) * (firstItem.getBoundingClientRect().height + parseFloat(style.rowGap))
        const padding = parseFloat(style.paddingTop)
        window.gridResizeCheck.samples++
        if (first % columns !== 0 || Math.abs(padding - expected) > 1) {
          window.gridResizeCheck.errors.push({ columns, expected, first, padding, width: list.clientWidth })
        }
      })
      window.gridResizeCheck = { errors: [], samples: 0, stop: () => observer.disconnect() }
      observer.observe(list)
    })

    // Continuous shrinking, including changes in column count.
    for (let width = 1432; width >= 800; width -= 8) {
      // Each resize must be delivered before the next one.
      // oxlint-disable-next-line no-await-in-loop
      await page.setViewportSize({ height: 900, width })
    }
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        })
    )
    const result = await page.evaluate(() => {
      window.gridResizeCheck.stop()
      return { errors: window.gridResizeCheck.errors, samples: window.gridResizeCheck.samples }
    })
    expect(result.samples).toBeGreaterThan(10)
    expect(result.errors).toEqual([])
  })
}
