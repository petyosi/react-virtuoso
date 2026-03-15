import { describe, expect, it } from 'vitest'

import { itemsWithinOffsets } from '../../itemsWithinOffsets'
import { rangesWithinOffsets } from '../../rangesWithinOffsets'
import { EMPTY_SIZE_STATE, updateSizeState } from '../../SizeState'

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
