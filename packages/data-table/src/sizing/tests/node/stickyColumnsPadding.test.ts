import { describe, expect, it } from 'vitest'

import { itemsWithinOffsets } from '../../itemsWithinOffsets'
import { itemOffsetAndSize } from '../../offsetOf'
import { EMPTY_SIZE_STATE, updateSizeState } from '../../SizeState'

import type { ExcludeIndicesInfo } from '../../itemsWithinOffsets'

function computeTotalSize(count: number, sizeState: ReturnType<typeof updateSizeState>): number {
  const { lastIndex, lastOffset, lastSize, offsetTree } = sizeState
  if (count > 0 && lastIndex >= count) {
    const [offset, size] = itemOffsetAndSize(count - 1, offsetTree)
    return offset + size
  }
  return lastOffset + (count - lastIndex) * lastSize
}

describe('itemsWithinOffsets with excluded indices (sticky columns)', () => {
  // Simulates the BothSideStickyGroups scenario:
  // 20 columns total:
  //   indices 0-2: sticky left (sizes 42, 57, 54)
  //   indices 3-17: non-sticky (various sizes)
  //   indices 18-19: sticky right (sizes 68, 76)
  const COLUMN_COUNT = 20
  const VIEWPORT_WIDTH = 800

  function buildSizeState() {
    return updateSizeState(EMPTY_SIZE_STATE, [
      { startIndex: 0, endIndex: 0, size: 42 },
      { startIndex: 1, endIndex: 1, size: 57 },
      { startIndex: 2, endIndex: 2, size: 54 },
      { startIndex: 3, endIndex: 11, size: 91 },
      { startIndex: 12, endIndex: 12, size: 99 },
      { startIndex: 13, endIndex: 13, size: 98 },
      { startIndex: 14, endIndex: 17, size: 99 },
      { startIndex: 18, endIndex: 18, size: 68 },
      { startIndex: 19, endIndex: 19, size: 76 },
    ])
  }

  const stickyIndices = new Set([0, 1, 2, 18, 19])
  const leftWidth = 42 + 57 + 54
  const rightWidth = 68 + 76
  const totalStickyWidth = leftWidth + rightWidth

  const excludeIndicesInfo: ExcludeIndicesInfo = {
    indices: stickyIndices,
    totalExcludedSize: totalStickyWidth,
  }

  const columnKeys = Array.from({ length: COLUMN_COUNT }, (_, i) => `col-${i}`)

  // The actual total of all column sizes: 42+57+54+9*91+99+98+4*99+68+76 = 1709
  const EXPECTED_TOTAL_WIDTH = 42 + 57 + 54 + 9 * 91 + 99 + 98 + 4 * 99 + 68 + 76

  it('computes correct totalWidth from size state', () => {
    const sizeState = buildSizeState()
    const totalWidth = computeTotalSize(COLUMN_COUNT, sizeState)
    expect(totalWidth).toBe(EXPECTED_TOTAL_WIDTH)
  })

  it('produces non-negative paddingEnd when scrolled to the right edge', () => {
    const sizeState = buildSizeState()
    const totalWidth = computeTotalSize(COLUMN_COUNT, sizeState)

    const scrollLeft = totalWidth - VIEWPORT_WIDTH
    const virtualViewportWidth = VIEWPORT_WIDTH - leftWidth - rightWidth
    const viewportRight = scrollLeft + virtualViewportWidth

    const result = itemsWithinOffsets(
      sizeState.offsetTree,
      scrollLeft,
      viewportRight,
      COLUMN_COUNT,
      totalWidth,
      columnKeys,
      undefined,
      excludeIndicesInfo
    )

    expect(result.paddingEnd).toBeGreaterThanOrEqual(0)

    const nonStickyTotal = totalWidth - totalStickyWidth
    const visibleItemsWidth = result.items.reduce((sum, item) => sum + item.size, 0)
    expect(result.paddingStart + visibleItemsWidth + result.paddingEnd).toBeCloseTo(nonStickyTotal, 5)
  })
})
