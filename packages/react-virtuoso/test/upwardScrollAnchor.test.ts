import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { listSystem } from '../src/listSystem'
import { sizeSystem } from '../src/sizeSystem'
import { getValue, init, publish, subscribe, system, tup } from '../src/urx'

function setup(top = 1000, grouped = false, overscan = 200) {
  const s = init(system(([list, size]) => ({ ...list, resetSizes: size.resetSizes }), tup(listSystem, sizeSystem)))
  publish(s.totalCount, 50)
  if (grouped) {
    publish(s.groupCounts, [25, 25])
    publish(s.fixedGroupHeight, 30)
  }
  publish(s.defaultItemHeight, 100)
  publish(s.increaseViewportBy, { bottom: overscan, top: overscan })
  publish(s.propsReady, true)
  publish(s.viewportHeight, 600)
  publish(s.scrollContainerState, { scrollHeight: 5000, scrollTop: top + 50, viewportHeight: 600 })
  publish(s.scrollContainerState, { scrollHeight: 5000, scrollTop: top, viewportHeight: 600 })
  const scrolls: number[] = []
  subscribe(s.scrollBy, ({ top }) => scrolls.push(top ?? 0))
  return { s, scrolls }
}

describe('upward scrolling measurement anchor', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not compensate a measurement below the visible anchor', () => {
    const { s, scrolls } = setup()
    expect(getValue(s.listState).items[0]!.originalIndex).toBeLessThan(10)
    publish(s.sizeRanges, [{ endIndex: 16, size: 68, startIndex: 16 }])
    expect(scrolls).toEqual([])
  })

  it('compensates a measurement above the visible anchor inside the overscan', () => {
    const { s, scrolls } = setup()
    publish(s.sizeRanges, [{ endIndex: 9, size: 68, startIndex: 9 }])
    expect(scrolls).toEqual([-32])
  })

  it('does not move a fully visible anchor when its own height changes', () => {
    const { s, scrolls } = setup()
    publish(s.sizeRanges, [{ endIndex: 10, size: 68, startIndex: 10 }])
    expect(scrolls).toEqual([])
  })

  it('uses the first fully visible row when the preceding row is partially visible', () => {
    const { s, scrolls } = setup(1050)
    publish(s.sizeRanges, [{ endIndex: 10, size: 140, startIndex: 10 }])
    expect(scrolls).toEqual([40])
  })

  it('compensates an above-anchor change even when a below-anchor change cancels the total height delta', () => {
    const { s, scrolls } = setup()
    publish(s.sizeRanges, [
      { endIndex: 9, size: 68, startIndex: 9 },
      { endIndex: 16, size: 132, startIndex: 16 },
    ])
    expect(scrolls).toEqual([-32])
  })

  it('does not replay compensation when only the rendered range changes', () => {
    const { s, scrolls } = setup()
    publish(s.sizeRanges, [{ endIndex: 9, size: 68, startIndex: 9 }])
    publish(s.scrollContainerState, { scrollHeight: 4968, scrollTop: 968, viewportHeight: 600 })
    publish(s.increaseViewportBy, { bottom: 400, top: 400 })
    expect(scrolls).toEqual([-32])
  })

  it('preserves idle content growth without scrolling', () => {
    const { s, scrolls } = setup()
    vi.advanceTimersByTime(60)
    publish(s.sizeRanges, [{ endIndex: 9, size: 140, startIndex: 9 }])
    expect(scrolls).toEqual([])
  })

  it('does not compensate while navigating programmatically', () => {
    const { s, scrolls } = setup()
    publish(s.scrollingInProgress, true)
    publish(s.sizeRanges, [{ endIndex: 9, size: 140, startIndex: 9 }])
    expect(scrolls).toEqual([])
  })

  it('compensates above the anchor when the overscan includes index zero', () => {
    const { s, scrolls } = setup(100)
    expect(getValue(s.listState).items[0]!.originalIndex).toBe(0)
    publish(s.sizeRanges, [{ endIndex: 0, size: 68, startIndex: 0 }])
    expect(scrolls).toEqual([-32])
  })

  it('does not compensate measurements while scrolling down', () => {
    const { s, scrolls } = setup()
    publish(s.scrollContainerState, { scrollHeight: 5000, scrollTop: 1050, viewportHeight: 600 })
    publish(s.sizeRanges, [{ endIndex: 9, size: 140, startIndex: 9 }])
    expect(scrolls).toEqual([])
  })

  it('does not scroll backwards when measurements are reset to a probe', () => {
    const { s, scrolls } = setup()
    publish(s.resetSizes, null)
    expect(scrolls).toEqual([])
  })

  it('subtracts the browser clamp already applied after an above-anchor shrink', () => {
    const { s, scrolls } = setup(4400)
    publish(s.scrollContainerState, { scrollHeight: 4968, scrollTop: 4368, viewportHeight: 600 })
    publish(s.sizeRanges, [{ endIndex: 43, size: 68, startIndex: 43 }])
    expect(scrolls).toEqual([])
  })

  it('accounts for the list header when selecting the visible anchor', () => {
    const { s, scrolls } = setup()
    publish(s.headerHeight, 200)
    publish(s.sizeRanges, [{ endIndex: 9, size: 68, startIndex: 9 }])
    expect(scrolls).toEqual([])
  })

  it('accounts for gaps when computing the anchor offset', () => {
    const { s, scrolls } = setup(1100)
    publish(s.gap, 10)
    publish(s.sizeRanges, [{ endIndex: 0, size: 100, startIndex: 0 }])
    scrolls.length = 0
    publish(s.sizeRanges, [{ endIndex: 9, size: 68, startIndex: 9 }])
    expect(scrolls).toEqual([-32])
  })

  it('uses original indices for measurements above a grouped anchor', () => {
    const { s, scrolls } = setup(1000, true)
    expect(getValue(s.listState).topListHeight).toBe(30)
    publish(s.sizeRanges, [{ endIndex: 10, size: 68, startIndex: 10 }])
    expect(scrolls).toEqual([-32])
  })

  it('does not move a grouped anchor for measurements below it', () => {
    const { s, scrolls } = setup(1000, true)
    publish(s.sizeRanges, [{ endIndex: 16, size: 68, startIndex: 16 }])
    expect(scrolls).toEqual([])
  })

  it('keeps the row below pinned items as the visible anchor', () => {
    const { s, scrolls } = setup()
    publish(s.topItemCount, 2)
    expect(getValue(s.listState).topListHeight).toBe(200)
    publish(s.sizeRanges, [{ endIndex: 11, size: 68, startIndex: 11 }])
    expect(scrolls).toEqual([-32])
  })

  it('keeps an existing row anchored while a newly revealed row is measured', () => {
    const { s, scrolls } = setup(1000, false, 0)
    expect(getValue(s.listState).items[0]!.originalIndex).toBe(10)
    publish(s.scrollContainerState, { scrollHeight: 5000, scrollTop: 900, viewportHeight: 600 })
    expect(getValue(s.listState).items[0]!.originalIndex).toBe(9)
    publish(s.sizeRanges, [{ endIndex: 9, size: 500, startIndex: 9 }])
    expect(scrolls).toEqual([400])
  })

  it('drops a revealed anchor after scrolling away and back inside the same rendered range', () => {
    const { s, scrolls } = setup(1000, false, 0)
    publish(s.scrollContainerState, { scrollHeight: 5000, scrollTop: 900, viewportHeight: 600 })
    publish(s.increaseViewportBy, { bottom: 200, top: 200 })
    publish(s.scrollContainerState, { scrollHeight: 5000, scrollTop: 950, viewportHeight: 600 })
    publish(s.scrollContainerState, { scrollHeight: 5000, scrollTop: 900, viewportHeight: 600 })
    publish(s.sizeRanges, [{ endIndex: 9, size: 500, startIndex: 9 }])
    expect(scrolls).toEqual([])
  })

  it('drops a revealed anchor when explicit navigation takes over', () => {
    const { s, scrolls } = setup(1000, false, 0)
    publish(s.scrollContainerState, { scrollHeight: 5000, scrollTop: 900, viewportHeight: 600 })
    publish(s.scrollTo, { top: 900 })
    publish(s.sizeRanges, [{ endIndex: 9, size: 500, startIndex: 9 }])
    expect(scrolls).toEqual([])
  })
})
