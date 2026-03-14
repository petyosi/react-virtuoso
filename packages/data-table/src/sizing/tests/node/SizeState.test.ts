import { beforeEach, describe, expect, it } from 'vitest'

import { walk } from '../../AATree'
import { EMPTY_SIZE_STATE, updateSizeState } from '../../SizeState'

import type { SizeState } from '../../SizeState'

function expectSizeState(
  state: SizeState,
  expectedSizeTree: Array<{ k: number; v: number }>,
  expectedOffsetTree: Array<{ index: number; offset: number; size: number }>,
  lastIndex: number,
  lastSize: number,
  lastOffset: number
) {
  expect(walk(state.sizeTree)).toStrictEqual(expectedSizeTree)
  expect(state.offsetTree).toStrictEqual(expectedOffsetTree)
  expect(state.lastIndex).toBe(lastIndex)
  expect(state.lastSize).toBe(lastSize)
  expect(state.lastOffset).toBe(lastOffset)
}

describe(updateSizeState, () => {
  it('updates empty state with a size range', () => {
    const result = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 1, size: 50 }])

    expect(walk(result.sizeTree)).toStrictEqual([{ k: 0, v: 50 }])
    expect(result.offsetTree).toStrictEqual([{ index: 0, offset: 0, size: 50 }])
    expect(result.lastIndex).toBe(0)
    expect(result.lastSize).toBe(50)
    expect(result.lastOffset).toBe(0)
  })

  describe('basic range updates', () => {
    let state: SizeState

    beforeEach(() => {
      state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 1, size: 50 }])
    })

    it('handles adjacent range with different size', () => {
      state = updateSizeState(state, [{ startIndex: 2, endIndex: 4, size: 40 }])

      expectSizeState(
        state,
        [
          { k: 0, v: 50 },
          { k: 2, v: 40 },
          { k: 5, v: 50 },
        ],
        [
          { index: 0, offset: 0, size: 50 },
          { index: 2, offset: 100, size: 40 },
          { index: 5, offset: 220, size: 50 },
        ],
        5,
        50,
        220
      )
    })
  })

  describe('range merging', () => {
    let state: SizeState

    beforeEach(() => {
      state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 0, size: 50 }])
    })

    it('handles adjacent same-size ranges (merges to single range)', () => {
      state = updateSizeState(state, [{ startIndex: 1, endIndex: 3, size: 50 }])

      expectSizeState(state, [{ k: 0, v: 50 }], [{ index: 0, offset: 0, size: 50 }], 0, 50, 0)
    })
  })

  describe('range overlaps', () => {
    let state: SizeState

    beforeEach(() => {
      state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 5, size: 50 }])
    })

    it('handles partial overlap with different size', () => {
      state = updateSizeState(state, [{ startIndex: 3, endIndex: 8, size: 40 }])

      // sizeTree: [0:50, 3:40, 9:50]
      // offsetTree has synthetic tail because 40 (span 6) is the mode, not 50 (span 3+1=4)
      expectSizeState(
        state,
        [
          { k: 0, v: 50 },
          { k: 3, v: 40 },
          { k: 9, v: 50 },
        ],
        [
          { index: 0, offset: 0, size: 50 },
          { index: 3, offset: 150, size: 40 },
          { index: 9, offset: 390, size: 50 },
          { index: 10, offset: 440, size: 40 },
        ],
        10,
        40,
        440
      )
      expect(state.hasSyntheticTail).toBe(true)
    })

    it('handles full overlap (subset) with different size', () => {
      state = updateSizeState(state, [{ startIndex: 0, endIndex: 3, size: 60 }])

      // sizeTree: [0:60, 4:50]. 60 has span 4, 50 has span 1 → synthetic tail with 60
      expectSizeState(
        state,
        [
          { k: 0, v: 60 },
          { k: 4, v: 50 },
        ],
        [
          { index: 0, offset: 0, size: 60 },
          { index: 4, offset: 240, size: 50 },
          { index: 5, offset: 290, size: 60 },
        ],
        5,
        60,
        290
      )
      expect(state.hasSyntheticTail).toBe(true)
    })
  })

  describe('boundary cases', () => {
    let state: SizeState

    beforeEach(() => {
      state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 1, size: 50 }])
    })

    it('handles no-op when adding identical range', () => {
      const originalState = state
      state = updateSizeState(state, [{ startIndex: 0, endIndex: 1, size: 50 }])

      expect(walk(state.sizeTree)).toStrictEqual(walk(originalState.sizeTree))
      expect(state.offsetTree).toStrictEqual(originalState.offsetTree)
      expect(state.lastIndex).toBe(originalState.lastIndex)
      expect(state.lastSize).toBe(originalState.lastSize)
      expect(state.lastOffset).toBe(originalState.lastOffset)
    })

    it('handles range ending with Infinity', () => {
      state = updateSizeState(state, [{ startIndex: 5, endIndex: Number.POSITIVE_INFINITY, size: 30 }])

      // 50 has span 5, 30 has span 1 → synthetic tail with 50
      expectSizeState(
        state,
        [
          { k: 0, v: 50 },
          { k: 5, v: 30 },
        ],
        [
          { index: 0, offset: 0, size: 50 },
          { index: 5, offset: 250, size: 30 },
          { index: 6, offset: 280, size: 50 },
        ],
        6,
        50,
        280
      )
      expect(state.hasSyntheticTail).toBe(true)
    })
  })

  describe('multi-range updates', () => {
    let state: SizeState

    beforeEach(() => {
      state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 1, size: 50 }])
    })

    it('handles multiple ranges in single update', () => {
      state = updateSizeState(state, [
        { startIndex: 2, endIndex: 4, size: 40 },
        { startIndex: 5, endIndex: 7, size: 30 },
      ])

      expectSizeState(
        state,
        [
          { k: 0, v: 50 },
          { k: 2, v: 40 },
          { k: 5, v: 30 },
          { k: 8, v: 50 },
        ],
        [
          { index: 0, offset: 0, size: 50 },
          { index: 2, offset: 100, size: 40 },
          { index: 5, offset: 220, size: 30 },
          { index: 8, offset: 310, size: 50 },
        ],
        8,
        50,
        310
      )
    })
  })

  describe('complex scenarios', () => {
    let state: SizeState

    beforeEach(() => {
      state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 2, size: 50 }])
    })

    it('handles multiple size changes', () => {
      state = updateSizeState(state, [{ startIndex: 2, endIndex: 5, size: 60 }])
      state = updateSizeState(state, [{ startIndex: 5, endIndex: 8, size: 50 }])

      expectSizeState(
        state,
        [
          { k: 0, v: 50 },
          { k: 2, v: 60 },
          { k: 5, v: 50 },
        ],
        [
          { index: 0, offset: 0, size: 50 },
          { index: 2, offset: 100, size: 60 },
          { index: 5, offset: 280, size: 50 },
        ],
        5,
        50,
        280
      )
    })

    it('handles gap between ranges', () => {
      state = updateSizeState(state, [{ startIndex: 3, endIndex: 5, size: 40 }])

      expectSizeState(
        state,
        [
          { k: 0, v: 50 },
          { k: 3, v: 40 },
          { k: 6, v: 50 },
        ],
        [
          { index: 0, offset: 0, size: 50 },
          { index: 3, offset: 150, size: 40 },
          { index: 6, offset: 270, size: 50 },
        ],
        6,
        50,
        270
      )
    })

    it('handles gap filled with different size', () => {
      state = updateSizeState(state, [{ startIndex: 3, endIndex: 5, size: 40 }])
      state = updateSizeState(state, [{ startIndex: 2, endIndex: 2, size: 60 }])

      expectSizeState(
        state,
        [
          { k: 0, v: 50 },
          { k: 2, v: 60 },
          { k: 3, v: 40 },
          { k: 6, v: 50 },
        ],
        [
          { index: 0, offset: 0, size: 50 },
          { index: 2, offset: 100, size: 60 },
          { index: 3, offset: 160, size: 40 },
          { index: 6, offset: 280, size: 50 },
        ],
        6,
        50,
        280
      )
    })
  })

  describe('incremental offset updates', () => {
    let state: SizeState

    beforeEach(() => {
      state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 2, size: 50 }])
      state = updateSizeState(state, [{ startIndex: 3, endIndex: 5, size: 60 }])
      state = updateSizeState(state, [{ startIndex: 6, endIndex: 8, size: 50 }])
    })

    it('rebuilds offset tree only from changed index', () => {
      const originalOffsetTreePrefix = state.offsetTree.slice(0, 1)
      state = updateSizeState(state, [{ startIndex: 4, endIndex: 4, size: 70 }])

      expectSizeState(
        state,
        [
          { k: 0, v: 50 },
          { k: 3, v: 60 },
          { k: 4, v: 70 },
          { k: 5, v: 60 },
          { k: 6, v: 50 },
        ],
        [
          { index: 0, offset: 0, size: 50 },
          { index: 3, offset: 150, size: 60 },
          { index: 4, offset: 210, size: 70 },
          { index: 5, offset: 280, size: 60 },
          { index: 6, offset: 340, size: 50 },
        ],
        6,
        50,
        340
      )

      expect(state.offsetTree.slice(0, 1)).toStrictEqual(originalOffsetTreePrefix)
    })
  })

  describe('synthetic tail', () => {
    it('appends synthetic tail when mode differs from last size', () => {
      // Group header at index 0 (32px), data rows at indices 1-10 (40px)
      let state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 0, size: 32 }])
      state = updateSizeState(state, [{ startIndex: 1, endIndex: 10, size: 40 }])

      expect(state.hasSyntheticTail).toBe(true)
      expect(state.lastSize).toBe(40)
      // sizeTree should NOT have the synthetic entry
      expect(walk(state.sizeTree)).toStrictEqual([
        { k: 0, v: 32 },
        { k: 1, v: 40 },
        { k: 11, v: 32 },
      ])
      // offset tree should have the synthetic entry at the end
      const lastOffset = state.offsetTree.at(-1)!
      expect(lastOffset.size).toBe(40)
      expect(lastOffset.index).toBe(12)
    })

    it('no synthetic tail when all sizes equal', () => {
      const state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 10, size: 50 }])

      expect(state.hasSyntheticTail).toBeFalsy()
      expect(state.lastSize).toBe(50)
      expect(state.offsetTree).toHaveLength(1)
    })

    it('no synthetic tail with single entry', () => {
      const state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 0, size: 50 }])

      expect(state.hasSyntheticTail).toBeFalsy()
      expect(state.lastSize).toBe(50)
    })

    it('strips synthetic tail before incremental update', () => {
      // Create state with synthetic tail
      let state = updateSizeState(EMPTY_SIZE_STATE, [{ startIndex: 0, endIndex: 0, size: 32 }])
      state = updateSizeState(state, [{ startIndex: 1, endIndex: 10, size: 40 }])
      expect(state.hasSyntheticTail).toBe(true)

      // Incremental update — should not corrupt offsets
      state = updateSizeState(state, [{ startIndex: 5, endIndex: 5, size: 40 }])
      expect(state.hasSyntheticTail).toBe(true)
      expect(state.lastSize).toBe(40)

      // Verify offsets are correct
      const headerEntry = state.offsetTree.find((e) => e.index === 0)!
      expect(headerEntry.size).toBe(32)
      expect(headerEntry.offset).toBe(0)

      const dataEntry = state.offsetTree.find((e) => e.index === 1)!
      expect(dataEntry.size).toBe(40)
      expect(dataEntry.offset).toBe(32)
    })

    it('frequency map tracks correctly across incremental updates', () => {
      // Simulate: header(32px) at 0, data rows(40px) at 1-5, header(32px) at 6, data rows(40px) at 7-16
      let state = updateSizeState(EMPTY_SIZE_STATE, [
        { startIndex: 0, endIndex: 0, size: 32 },
        { startIndex: 1, endIndex: 5, size: 40 },
        { startIndex: 6, endIndex: 6, size: 32 },
        { startIndex: 7, endIndex: 16, size: 40 },
      ])

      // sizeTree: [0:32, 1:40, 6:32, 7:40, 17:32]
      // offsetTree: [{0,0,32}, {1,32,40}, {6,232,32}, {7,264,40}, {17,664,32}]
      // freq: 32 -> 1+1+1 = 3, 40 -> 5+10 = 15
      // mode=40, last=32 → synthetic tail
      expect(state.hasSyntheticTail).toBe(true)
      expect(state.lastSize).toBe(40)
      expect(state.sizeFrequency.get(40)).toBe(15)
      expect(state.sizeFrequency.get(32)).toBe(3)

      // Incremental update: change one data row to a different size
      state = updateSizeState(state, [{ startIndex: 10, endIndex: 10, size: 48 }])

      // sizeTree: [0:32, 1:40, 6:32, 7:40, 10:48, 11:40, 17:32]
      // offsetTree: [{0,0,32}, {1,32,40}, {6,232,32}, {7,264,40}, {10,384,48}, {11,432,40}, {17,672,32}]
      // freq: 32 -> 1+1+1 = 3, 40 -> 5+3+6 = 14, 48 -> 1
      // mode=40, last=32 → synthetic tail
      expect(state.hasSyntheticTail).toBe(true)
      expect(state.lastSize).toBe(40)
      expect(state.sizeFrequency.get(40)).toBe(14)
      expect(state.sizeFrequency.get(32)).toBe(3)
      expect(state.sizeFrequency.get(48)).toBe(1)
    })
  })
})
