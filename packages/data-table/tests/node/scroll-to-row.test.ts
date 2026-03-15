import { describe, expect, it } from 'vitest'

import { scrollToLocationFromScrollToRowLocation } from '../../src/scroll/scroll-to-row'
import { EMPTY_SIZE_STATE, updateSizeState } from '../../src/sizing/SizeState'

function buildUniformSizeState(rowCount: number, rowHeight: number) {
  return updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: rowCount - 1, size: rowHeight }])
}

function scrollToRow(...args: Parameters<typeof scrollToLocationFromScrollToRowLocation>) {
  return scrollToLocationFromScrollToRowLocation(...args) as ReturnType<typeof scrollToLocationFromScrollToRowLocation> & {
    forceBottomSpace: number
    top: number
  }
}

describe(scrollToLocationFromScrollToRowLocation, () => {
  // Scenario: 100 rows x 50px each = 5000px total, viewport = 500px.
  // Max natural scroll = 5000 - 500 = 4500.
  // Scrolling to row 95 (offset 4750) with align 'start' needs 250px of forced bottom space.
  it('computes forceBottomSpace when scrolling to a near-end row with align start', () => {
    const ROW_COUNT = 100
    const ROW_HEIGHT = 50
    const VIEWPORT_HEIGHT = 500
    const TOTAL_HEIGHT = ROW_COUNT * ROW_HEIGHT

    const sizeState = buildUniformSizeState(ROW_COUNT, ROW_HEIGHT)

    const result = scrollToRow({
      location: { index: 95, align: 'start' },
      sizeState,
      totalHeight: TOTAL_HEIGHT,
      totalCount: ROW_COUNT,
      viewportHeight: VIEWPORT_HEIGHT,
      headerHeight: 0,
      stickyHeaderHeight: 0,
      stickyFooterHeight: 0,
    })

    // Row 95 offset = 95 * 50 = 4750. Max natural scroll = 5000 - 500 = 4500.
    // forceBottomSpace should be 4750 - 4500 = 250.
    expect(result.forceBottomSpace).toBe(250)
    expect(result.top).toBe(4750)
  })

  it('clamps forceBottomSpace so it never exceeds viewportHeight', () => {
    const ROW_COUNT = 100
    const ROW_HEIGHT = 50
    const VIEWPORT_HEIGHT = 500
    const TOTAL_HEIGHT = ROW_COUNT * ROW_HEIGHT

    const sizeState = buildUniformSizeState(ROW_COUNT, ROW_HEIGHT)

    const lastRow = scrollToRow({
      location: { index: 99, align: 'start' },
      sizeState,
      totalHeight: TOTAL_HEIGHT,
      totalCount: ROW_COUNT,
      viewportHeight: VIEWPORT_HEIGHT,
      headerHeight: 0,
      stickyHeaderHeight: 0,
      stickyFooterHeight: 0,
    })
    expect(lastRow.forceBottomSpace).toBe(450)
    expect(lastRow.forceBottomSpace).toBeLessThanOrEqual(VIEWPORT_HEIGHT)
  })

  it('clamps forceBottomSpace with headers present', () => {
    const ROW_COUNT = 100
    const ROW_HEIGHT = 50
    const VIEWPORT_HEIGHT = 500
    const HEADER_HEIGHT = 60
    const STICKY_HEADER_HEIGHT = 40
    const TOTAL_HEIGHT = ROW_COUNT * ROW_HEIGHT

    const sizeState = buildUniformSizeState(ROW_COUNT, ROW_HEIGHT)

    const result = scrollToRow({
      location: { index: 99, align: 'start' },
      sizeState,
      totalHeight: TOTAL_HEIGHT,
      totalCount: ROW_COUNT,
      viewportHeight: VIEWPORT_HEIGHT,
      headerHeight: HEADER_HEIGHT,
      stickyHeaderHeight: STICKY_HEADER_HEIGHT,
      stickyFooterHeight: 0,
    })

    expect(result.forceBottomSpace).toBeGreaterThan(0)
    expect(result.forceBottomSpace).toBeLessThanOrEqual(VIEWPORT_HEIGHT - STICKY_HEADER_HEIGHT)
  })

  it('does not produce unbounded forceBottomSpace with small viewport and large content', () => {
    const ROW_COUNT = 200
    const ROW_HEIGHT = 50
    const VIEWPORT_HEIGHT = 100
    const TOTAL_HEIGHT = ROW_COUNT * ROW_HEIGHT

    const sizeState = buildUniformSizeState(ROW_COUNT, ROW_HEIGHT)

    const result = scrollToRow({
      location: { index: 199, align: 'start', offset: 80 },
      sizeState,
      totalHeight: TOTAL_HEIGHT,
      totalCount: ROW_COUNT,
      viewportHeight: VIEWPORT_HEIGHT,
      headerHeight: 0,
      stickyHeaderHeight: 0,
      stickyFooterHeight: 0,
    })

    // top = 9950 + 80 = 10030, maxScroll = 9900
    // Unclamped forceBottomSpace = 10030 - 9900 = 130, which exceeds viewportHeight (100)
    // With the fix, it's clamped to viewportHeight
    expect(result.forceBottomSpace).toBeLessThanOrEqual(VIEWPORT_HEIGHT)
  })
})
