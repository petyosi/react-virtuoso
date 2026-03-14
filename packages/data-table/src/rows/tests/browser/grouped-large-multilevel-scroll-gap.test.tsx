import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { LargeMultiLevelGrouping } from '../../../_stories/grouped-data.stories'

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const rowSelector = '[data-testid=virtuoso-table-row]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'

interface RowSnapshot {
  top: number
  height: number
  sticky: boolean
  text: string
}

function readRows(container: HTMLElement): RowSnapshot[] {
  return [...container.querySelectorAll(rowSelector)].map((row) => {
    const element = row as HTMLElement
    return {
      top: Number.parseFloat(element.style.top),
      height: Number.parseFloat(element.dataset.knownSize ?? '0'),
      sticky: element.style.position === 'sticky',
      text: (element.textContent ?? '').replaceAll(/\s+/g, ' ').trim(),
    }
  })
}

function visibleGapAfterSticky(container: HTMLElement, scrollTop: number, viewportHeight: number) {
  const rows = readRows(container)

  const stickyBottom = rows
    .filter((row) => row.sticky)
    .map((row) => row.top + row.height)
    .reduce((max, bottom) => Math.max(max, bottom), 0)

  const firstNonSticky = rows
    .filter((row) => !row.sticky && row.height > 0)
    .map((row) => ({ ...row, visualTop: row.top - scrollTop }))
    .filter((row) => row.visualTop + row.height > 0 && row.visualTop < viewportHeight)
    .toSorted((a, b) => a.visualTop - b.visualTop)[0]

  if (!firstNonSticky) {
    return { gap: 0, stickyBottom, firstRow: '' }
  }

  return {
    gap: firstNonSticky.visualTop - stickyBottom,
    stickyBottom,
    firstRow: firstNonSticky.text,
  }
}

test('large multi-level grouped scrolling does not open viewport gap below sticky headers', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const viewportHeight = scroller.clientHeight

  await expect.poll(() => visibleGapAfterSticky(screen.container, scroller.scrollTop, viewportHeight).gap).toBeLessThanOrEqual(120)

  const stressTargets = [
    ...Array.from({ length: 35 }, (_, i) => 80 + i * 80),
    ...Array.from({ length: 20 }, (_, i) => 2600 - i * 120),
    ...Array.from({ length: 18 }, (_, i) => i * 140),
  ]

  for (const target of stressTargets) {
    scroller.scrollTop = target
    scroller.dispatchEvent(new Event('scroll'))

    // oxlint-disable-next-line no-await-in-loop
    await expect
      .poll(() => {
        const { gap } = visibleGapAfterSticky(screen.container, scroller.scrollTop, viewportHeight)
        return gap
      })
      .toBeLessThanOrEqual(120)
  }
})
