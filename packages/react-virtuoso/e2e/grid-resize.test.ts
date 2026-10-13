import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

declare global {
  interface Window {
    gridResizeErrors: string[]
    gridResizeCheck: {
      errors: { columns: number; first: number; padding: number; expected: number; width: number }[]
      widths: number[]
      check: () => void
      stop: () => void
    }
  }
}

for (const mode of ['example', 'element-scroll', 'custom-scroll-parent']) {
  for (const directMeasurement of [false, true]) {
    test(`resizes a scrolled grid (${mode}, direct measurement: ${directMeasurement})`, async ({ baseURL, page }, testInfo) => {
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      await page.addInitScript(() => {
        window.gridResizeErrors = []
        window.addEventListener('error', (event) => {
          window.gridResizeErrors.push(event.message)
        })
      })
      await page.setViewportSize({ height: 900, width: 1440 })
      await page.goto(`${baseURL}/?story=grid-resize--${mode}&mode=preview`)
      if (directMeasurement) {
        await page.getByRole('checkbox', { name: /Measure before paint/ }).check()
      }
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
      await expect
        .poll(() => list.evaluate((el) => Number(el.querySelector<HTMLElement>('[data-index]')!.dataset.index)))
        .toBeGreaterThan(0)

      await page.evaluate((directMeasurement) => {
        const list = document.querySelector<HTMLElement>('[data-testid=virtuoso-item-list]')!
        const check = () => {
          const firstItem = list.firstElementChild as HTMLElement | null
          if (!firstItem) {
            throw new Error('Scrolled grid became empty during resize')
          }
          const style = getComputedStyle(list)
          const columns = style.gridTemplateColumns.split(' ').length
          const first = Number(firstItem.dataset.index)
          const expected = Math.floor(first / columns) * (firstItem.getBoundingClientRect().height + parseFloat(style.rowGap))
          const padding = parseFloat(style.paddingTop)
          if (first % columns !== 0 || Math.abs(padding - expected) > 1) {
            window.gridResizeCheck.errors.push({ columns, expected, first, padding, width: list.clientWidth })
          }
        }
        // Registered after the grid's observer. Direct measurement must commit
        // aligned geometry during observer delivery, before paint. RAF mode is
        // checked after its scheduled measurement instead.
        const observer = new ResizeObserver(() => {
          window.gridResizeCheck.widths.push(window.innerWidth)
          if (directMeasurement) {
            check()
          }
        })
        window.gridResizeCheck = { errors: [], widths: [], check, stop: () => observer.disconnect() }
        observer.observe(list)
      }, directMeasurement)

      const input = page.getByRole('textbox', { name: 'Item 60', exact: true })
      await input.fill('unsaved draft')
      const originalInput = await input.elementHandle()
      // Wait for delivery at each requested width instead of assuming an
      // arbitrary number of samples. Exercise shrinking and expanding.
      for (const [step, width] of [1432, 1396, 1392, 1388, 1400, 1356, 1100, 1096, 800, 1096, 1100, 1356, 1400, 1440].entries()) {
        // oxlint-disable-next-line no-await-in-loop
        await page.evaluate(() => {
          window.gridResizeCheck.widths = []
        })
        // oxlint-disable-next-line no-await-in-loop
        await page.setViewportSize({ height: 900, width })
        // oxlint-disable-next-line no-await-in-loop
        await page.waitForFunction((width) => window.gridResizeCheck.widths.includes(width), width)
        // oxlint-disable-next-line no-await-in-loop
        await checkAfterPaint(page)
        if (step < 5) {
          // Only the initial five-column sequence guarantees this cell stays
          // in the visible/overscan range throughout.
          // oxlint-disable-next-line no-await-in-loop
          await expect(input).toHaveValue('unsaved draft')
        }
        if (width === 1388) {
          // oxlint-disable-next-line no-await-in-loop
          expect(await input.evaluate((element, original) => element === original, originalInput)).toBe(true)
        }
      }
      // Also stress back-to-back delivery, which can coalesce intermediate
      // widths. The observer still checks every delivered direct-mode sample.
      for (const direction of [-1, 1]) {
        for (let step = 1; step <= 80; step++) {
          const width = direction === -1 ? 1440 - step * 8 : 800 + step * 8
          // oxlint-disable-next-line no-await-in-loop
          await page.setViewportSize({ height: 900, width })
        }
        // oxlint-disable-next-line no-await-in-loop
        await checkAfterPaint(page)
      }
      const result = await page.evaluate(() => {
        window.gridResizeCheck.stop()
        return { alignment: window.gridResizeCheck.errors, errors: window.gridResizeErrors }
      })
      const observerErrors = result.errors.filter((message) => message.startsWith('ResizeObserver loop'))
      await testInfo.attach('resize-observer-errors', {
        body: JSON.stringify({ mode, directMeasurement, observerErrors }),
        contentType: 'application/json',
      })
      console.log(`${mode}, direct=${directMeasurement}: ${observerErrors.length} ResizeObserver loop errors`)
      expect(result.alignment).toEqual([])
      expect(result.errors.filter((message) => !message.startsWith('ResizeObserver loop'))).toEqual([])
      expect(pageErrors.filter((message) => !message.startsWith('ResizeObserver loop'))).toEqual([])
      if (!directMeasurement) {
        expect(observerErrors).toEqual([])
      }
    })
  }
}

async function checkAfterPaint(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            window.gridResizeCheck.check()
            resolve()
          })
        )
      })
  )
}
