import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { data$, groupIndices$, groupStickyConfig$ } from '../../../core/data'
import { ranges$ } from '../../../resize/sizes'
import {
  deviation$,
  increaseViewportBy$,
  scrollOffset$,
  scrollTop$,
  scrollableHeaderHeight$,
  stickyFooterHeight$,
  stickyHeaderHeight$,
  viewportHeight$,
} from '../../../scroll/dom'
import { pendingScrollToInitialLocation$ } from '../../../scroll/state'
import { rowsState$, viewportRange$ } from '../../row-state'

const ITEM_SIZE = 30
const VIEWPORT = 300

describe('rowsState$ stable field', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(rowsState$)
    engine.register(viewportRange$)
    engine.register(groupStickyConfig$)
  })

  function publishBase(overrides: { itemCount?: number; publishSizes?: boolean; pendingLocation?: unknown } = {}) {
    const { itemCount = 20, publishSizes = true, pendingLocation = null } = overrides
    const items = Array.from({ length: itemCount }, (_, i) => ({ id: i }))

    engine.pub(groupIndices$, [])
    engine.pub(data$, items)
    engine.pub(scrollTop$, 0)
    engine.pub(viewportHeight$, VIEWPORT)
    engine.pub(scrollOffset$, 0)
    engine.pub(scrollableHeaderHeight$, 0)
    engine.pub(stickyHeaderHeight$, 0)
    engine.pub(stickyFooterHeight$, 0)
    engine.pub(deviation$, 0)
    engine.pub(pendingScrollToInitialLocation$, pendingLocation)

    if (publishSizes) {
      engine.pub(ranges$, [{ startIndex: 0, endIndex: itemCount - 1, size: ITEM_SIZE }])
    }
  }

  it('stable=false when sizeTree is empty', () => {
    publishBase({ publishSizes: false })
    const state = engine.getValue(rowsState$)
    expect(state.stable).toBeFalsy()
  })

  it('stable=false during pending initial location', () => {
    publishBase({ pendingLocation: { index: 10, align: 'start' } })
    const state = engine.getValue(rowsState$)
    expect(state.stable).toBeFalsy()
  })

  it('stable=true after measurement complete', () => {
    publishBase()
    const state = engine.getValue(rowsState$)
    expect(state.stable).toBe(true)
  })

  it('transitions from false to true as state settles', () => {
    publishBase({ publishSizes: false })
    expect(engine.getValue(rowsState$).stable).toBeFalsy()

    engine.pub(ranges$, [{ startIndex: 0, endIndex: 19, size: ITEM_SIZE }])
    expect(engine.getValue(rowsState$).stable).toBe(true)
  })
})

describe(String(viewportRange$), () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(rowsState$)
    engine.register(viewportRange$)
    engine.register(groupStickyConfig$)
  })

  function publishStable(itemCount = 20) {
    const items = Array.from({ length: itemCount }, (_, i) => ({ id: i }))
    engine.pub(groupIndices$, [])
    engine.pub(data$, items)
    engine.pub(scrollTop$, 0)
    engine.pub(viewportHeight$, VIEWPORT)
    engine.pub(scrollOffset$, 0)
    engine.pub(scrollableHeaderHeight$, 0)
    engine.pub(stickyHeaderHeight$, 0)
    engine.pub(stickyFooterHeight$, 0)
    engine.pub(deviation$, 0)
    engine.pub(pendingScrollToInitialLocation$, null)
    engine.pub(ranges$, [{ startIndex: 0, endIndex: itemCount - 1, size: ITEM_SIZE }])
  }

  it('is null initially', () => {
    expect(engine.getValue(viewportRange$)).toBeNull()
  })

  it('does not emit when stable=false', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ id: i }))
    engine.pub(groupIndices$, [])
    engine.pub(data$, items)
    engine.pub(scrollTop$, 0)
    engine.pub(viewportHeight$, VIEWPORT)
    engine.pub(scrollOffset$, 0)
    engine.pub(scrollableHeaderHeight$, 0)
    engine.pub(stickyHeaderHeight$, 0)
    engine.pub(stickyFooterHeight$, 0)
    engine.pub(deviation$, 0)
    engine.pub(pendingScrollToInitialLocation$, null)
    // no sizes published -> sizeTree empty -> stable=false
    expect(engine.getValue(viewportRange$)).toBeNull()
  })

  it('emits correct indices when stable', () => {
    publishStable()
    const range = engine.getValue(viewportRange$)
    expect(range).not.toBeNull()
    expect(range!.startIndex).toBe(0)
    const expectedEnd = Math.ceil(VIEWPORT / ITEM_SIZE) - 1
    expect(range!.endIndex).toBe(expectedEnd)
  })

  it('updates on scroll', () => {
    publishStable(100)
    const scrollRows = 5
    engine.pub(scrollTop$, scrollRows * ITEM_SIZE)

    const range = engine.getValue(viewportRange$)
    expect(range).not.toBeNull()
    expect(range!.startIndex).toBe(scrollRows)
  })

  it('includes group header indices in range', () => {
    const itemCount = 20
    const items = Array.from({ length: itemCount }, (_, i) => ({ id: i }))
    engine.pub(groupIndices$, [
      { index: 0, level: 0 },
      { index: 5, level: 0 },
    ])
    engine.pub(data$, items)
    engine.pub(scrollTop$, 0)
    engine.pub(viewportHeight$, VIEWPORT)
    engine.pub(scrollOffset$, 0)
    engine.pub(scrollableHeaderHeight$, 0)
    engine.pub(stickyHeaderHeight$, 0)
    engine.pub(stickyFooterHeight$, 0)
    engine.pub(deviation$, 0)
    engine.pub(pendingScrollToInitialLocation$, null)
    engine.pub(ranges$, [{ startIndex: 0, endIndex: itemCount - 1, size: ITEM_SIZE }])

    const range = engine.getValue(viewportRange$)
    expect(range).not.toBeNull()
    // Sticky group headers are separated from rows, so rows start at 1.
    // The range covers the visible rows array indices, which includes
    // non-sticky items. Group header at index 5 appears inline in rows.
    expect(range!.startIndex).toBe(1)
    expect(range!.endIndex).toBe(9)
  })
})

describe('rowsState$ sticky group invalidation', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(rowsState$)
    engine.register(groupStickyConfig$)
  })

  function publishGroupedState({
    groupIndices = [0, 4, 8, 12],
    itemCount = 20,
    increaseViewportBy = 0,
    initialScrollTop = 0,
    viewportHeight = 200,
    ranges = [{ startIndex: 0, endIndex: itemCount - 1, size: 50 }],
  }: {
    groupIndices?: number[]
    itemCount?: number
    increaseViewportBy?: number
    initialScrollTop?: number
    viewportHeight?: number
    ranges?: { startIndex: number; endIndex: number; size: number }[]
  } = {}) {
    const items = Array.from({ length: itemCount }, (_, i) => ({ id: i }))

    engine.pub(
      groupIndices$,
      groupIndices.map((index) => ({ index, level: 0 }))
    )
    engine.pub(data$, items)
    engine.pub(scrollTop$, initialScrollTop)
    engine.pub(viewportHeight$, viewportHeight)
    engine.pub(scrollOffset$, 0)
    engine.pub(scrollableHeaderHeight$, 0)
    engine.pub(stickyHeaderHeight$, 0)
    engine.pub(stickyFooterHeight$, 0)
    engine.pub(deviation$, 0)
    engine.pub(increaseViewportBy$, increaseViewportBy)
    engine.pub(pendingScrollToInitialLocation$, null)
    engine.pub(ranges$, ranges)
  }

  it('updates sticky state when the first visible data row crosses into the next group', () => {
    publishGroupedState({
      groupIndices: [0, 3, 6, 9, 12, 15],
      itemCount: 18,
      increaseViewportBy: 400,
      initialScrollTop: 600,
      viewportHeight: 200,
      ranges: [
        { startIndex: 0, endIndex: 0, size: 40 },
        { startIndex: 1, endIndex: 2, size: 100 },
        { startIndex: 3, endIndex: 3, size: 40 },
        { startIndex: 4, endIndex: 5, size: 100 },
        { startIndex: 6, endIndex: 6, size: 40 },
        { startIndex: 7, endIndex: 8, size: 100 },
        { startIndex: 9, endIndex: 9, size: 40 },
        { startIndex: 10, endIndex: 11, size: 100 },
        { startIndex: 12, endIndex: 12, size: 40 },
        { startIndex: 13, endIndex: 14, size: 100 },
        { startIndex: 15, endIndex: 15, size: 40 },
        { startIndex: 16, endIndex: 17, size: 100 },
      ],
    })

    const before = engine.getValue(rowsState$)
    expect(before.stickyStartItems.map((item) => item.index)).toStrictEqual([6])

    // Moving to 720px makes the first visible data row belong to the next group.
    engine.pub(scrollTop$, 720)

    const after = engine.getValue(rowsState$)
    expect(after.stickyStartItems.map((item) => item.index)).toStrictEqual([9])
  })

  it('keeps sticky selection stable when only increaseViewportBy changes', () => {
    publishGroupedState({ increaseViewportBy: 0, initialScrollTop: 200, itemCount: 30 })

    const withoutOverscan = engine.getValue(rowsState$)
    expect(withoutOverscan.stickyStartItems.map((item) => item.index)).toStrictEqual([4])

    engine.pub(increaseViewportBy$, 200)

    const withOverscan = engine.getValue(rowsState$)
    expect(withOverscan.stickyStartItems.map((item) => item.index)).toStrictEqual([4])
    expect(withOverscan.rows.length).toBeGreaterThan(withoutOverscan.rows.length)
    expect(withOverscan.rows[0]!.index).toBeLessThan(withoutOverscan.rows[0]!.index)
  })
})
