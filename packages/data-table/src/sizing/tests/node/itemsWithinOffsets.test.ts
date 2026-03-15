import { describe, expect, it } from 'vitest'

import { itemsWithinOffsets } from '../../itemsWithinOffsets'
import { itemOffsetAndSize } from '../../offsetOf'
import { rangesWithinOffsets } from '../../rangesWithinOffsets'
import { EMPTY_SIZE_STATE, updateSizeState } from '../../SizeState'

import type { ExcludeIndicesInfo } from '../../itemsWithinOffsets'
import type { OffsetBreakpoint } from '../../SizeState'

function buildExcludeInfo(indices: number[], offsetTree: OffsetBreakpoint[]): ExcludeIndicesInfo {
  let totalExcludedSize = 0
  for (const idx of indices) {
    const [, size] = itemOffsetAndSize(idx, offsetTree)
    totalExcludedSize += size
  }
  return { indices: new Set(indices), totalExcludedSize }
}

function instrumentSetIteration(set: Set<number>): { count: () => number } {
  let iterationCount = 0
  const origIterator = Set.prototype[Symbol.iterator] as () => IterableIterator<number>
  set[Symbol.iterator] = function () {
    iterationCount++
    return origIterator.call(this) as SetIterator<number>
  }
  return { count: () => iterationCount }
}

describe('empty offset tree', () => {
  it('rangesWithinOffsets returns empty array for empty tree', () => {
    expect(rangesWithinOffsets([], 0, 500)).toStrictEqual([])
  })

  it('itemsWithinOffsets returns empty result for empty tree', () => {
    const result = itemsWithinOffsets([], 0, 500, 100, 0, null)
    expect(result.items).toStrictEqual([])
  })
})

describe('zero-size items', () => {
  // A zero-height item should never enter the size system — the architecture
  // assumes all rendered items have positive height. When one slips through
  // (e.g. a collapsed DOM element before measurement), the division at
  // itemsWithinOffsets line 91 produces Infinity/NaN, silently dropping items
  // and corrupting offsets with no developer-facing error.

  it('updateSizeState rejects a zero-size range with a clear error', () => {
    expect(() => {
      updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 0, size: 0 }])
    }).toThrow(/size 0/)
  })

  it('updateSizeState rejects a negative-size range with a clear error', () => {
    expect(() => {
      updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 0, size: -10 }])
    }).toThrow(/size -10/)
  })

  it('updateSizeState rejects a zero-size range mixed with valid ranges', () => {
    expect(() => {
      updateSizeState(EMPTY_SIZE_STATE, [
        { startIndex: 0, endIndex: 4, size: 50 },
        { startIndex: 5, endIndex: 5, size: 0 },
        { startIndex: 6, endIndex: 9, size: 50 },
      ])
    }).toThrow(/index 5/)
  })

  it('the error message includes actionable guidance', () => {
    expect(() => {
      updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 3, endIndex: 7, size: 0 }])
    }).toThrow(/collapsed or hidden/)
  })
})

describe('excluded indices cumulative size computation (issue 4.4)', () => {
  // calculateCumulativeExcludedSize iterates the entire excluded-indices Set
  // for EVERY visible item. With k excluded (sticky) columns and n visible
  // columns, this produces O(n * k) Set iterations per scroll frame.
  //
  // The cumulative excluded size can be tracked incrementally as items are
  // processed in index order, or precomputed once, reducing cost to O(n + k).

  it('excluded-set iteration count should not scale with the number of visible items', () => {
    const COLUMN_COUNT = 50
    const COLUMN_WIDTH = 100
    const EXCLUDED_INDICES = Array.from({ length: 10 }, (_, i) => i) // first 10 columns sticky

    const sizeState = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: COLUMN_COUNT - 1, size: COLUMN_WIDTH }])
    const excludeInfo = buildExcludeInfo(EXCLUDED_INDICES, sizeState.offsetTree)
    const tracker = instrumentSetIteration(excludeInfo.indices)

    const columnKeys = Array.from({ length: COLUMN_COUNT }, (_, i) => `col-${i}`)
    const totalWidth = COLUMN_COUNT * COLUMN_WIDTH

    // Virtual viewport 0-500px shows 5 non-excluded columns (indices 10-14)
    const result = itemsWithinOffsets(sizeState.offsetTree, 0, 500, COLUMN_COUNT, totalWidth, columnKeys, undefined, excludeInfo)

    expect(result.items).toHaveLength(5)
    expect(result.items.map((item) => item.index)).toStrictEqual([10, 11, 12, 13, 14])

    // With precomputation or incremental tracking, the excluded-indices Set
    // should be iterated at most once (to build cumulative data), not once
    // per visible item. Current implementation iterates it 6 times: once
    // per visible column (5) plus once for the boundary column that gets
    // discarded after calculating its cumulative excluded size.
    expect(tracker.count()).toBeLessThanOrEqual(1)
  })

  it('virtual offsets account for variable-sized excluded columns', () => {
    // Columns: 0(50px, sticky), 1(200px), 2(75px, sticky), 3(150px), 4(100px)
    const sizeState = updateSizeState(
      updateSizeState(
        updateSizeState(
          updateSizeState(updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 0, size: 50 }]), [
            { startIndex: 1, endIndex: 1, size: 200 },
          ]),
          [{ startIndex: 2, endIndex: 2, size: 75 }]
        ),
        [{ startIndex: 3, endIndex: 3, size: 150 }]
      ),
      [{ startIndex: 4, endIndex: 4, size: 100 }]
    )

    const excludeInfo = buildExcludeInfo([0, 2], sizeState.offsetTree)
    const tracker = instrumentSetIteration(excludeInfo.indices)

    const result = itemsWithinOffsets(
      sizeState.offsetTree,
      0,
      1000,
      5,
      50 + 200 + 75 + 150 + 100,
      ['a', 'b', 'c', 'd', 'e'],
      undefined,
      excludeInfo
    )

    // Non-excluded items: 1(200px), 3(150px), 4(100px)
    expect(result.items).toHaveLength(3)
    expect(result.items.map((item) => item.index)).toStrictEqual([1, 3, 4])

    // Virtual offsets should be contiguous without gaps from excluded items
    expect(result.items[0]!.offset).toBe(0)
    expect(result.items[1]!.offset).toBe(200)
    expect(result.items[2]!.offset).toBe(350)

    // Same assertion: Set should not be iterated per visible item
    expect(tracker.count()).toBeLessThanOrEqual(1)
  })
})
