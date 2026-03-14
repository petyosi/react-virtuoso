import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { data$, groupIndices$, groupStickyConfig$ } from '../../../core/data'
import { ranges$ } from '../../../resize/sizes'
import {
  deviation$,
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

describe(`${String(viewportRange$)}`, () => {
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
