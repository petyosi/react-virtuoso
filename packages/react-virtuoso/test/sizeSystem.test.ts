import { describe, expect, it, vi } from 'vitest'

import { AANode, ranges, walk } from '../src/AATree'
import { initialSizeState, offsetOf, rangesWithinOffsets, sizeStateReducer, sizeSystem, sizeTreeToRanges } from '../src/sizeSystem'
import { getValue, init, publish, subscribe } from '../src/urx'

function toKV<T>(tree: AANode<T>) {
  return walk(tree).map((node) => [node.k, node.v] as [number, T])
}

const mockLogger = function () {
  void 0
}

describe('size state reducer', () => {
  describe('insert', () => {
    it('sets the initial insert as a baseline', () => {
      const state = initialSizeState()
      const { offsetTree, sizeTree } = sizeStateReducer(state, [[{ endIndex: 0, size: 1, startIndex: 0 }], [], mockLogger, 0])
      expect(toKV(sizeTree)).toEqual([[0, 1]])
      expect(offsetTree).toEqual([{ index: 0, offset: 0, size: 1 }])
    })

    it('punches the initial range', () => {
      const state = initialSizeState()
      const { offsetTree, sizeTree } = sizeStateReducer(state, [
        [
          { endIndex: 0, size: 1, startIndex: 0 },
          { endIndex: 7, size: 2, startIndex: 3 },
          { endIndex: 10, size: 2, startIndex: 9 },
        ],
        [],
        mockLogger,
        0,
      ])
      expect(toKV(sizeTree)).toEqual([
        [0, 1],
        [3, 2],
        [8, 1],
        [9, 2],
        [11, 1],
      ])

      expect(offsetTree).toEqual([
        { index: 0, offset: 0, size: 1 },
        { index: 3, offset: 3, size: 2 },
        { index: 8, offset: 13, size: 1 },
        { index: 9, offset: 14, size: 2 },
        { index: 11, offset: 18, size: 1 },
      ])
    })

    it('does not change the ranges if size is the same', () => {
      const state = initialSizeState()
      const { offsetTree, sizeTree } = sizeStateReducer(state, [
        [
          { endIndex: 0, size: 1, startIndex: 0 },
          { endIndex: 8, size: 1, startIndex: 3 },
        ],
        [],
        mockLogger,
        0,
      ])

      expect(toKV(sizeTree)).toEqual([[0, 1]])
      expect(offsetTree).toEqual([{ index: 0, offset: 0, size: 1 }])
    })

    it('keeps default size if reinserted in the beginning', () => {
      const state = initialSizeState()
      const { offsetTree, sizeTree } = sizeStateReducer(state, [
        [
          { endIndex: 0, size: 1, startIndex: 0 },
          { endIndex: 0, size: 2, startIndex: 0 },
        ],
        [],
        mockLogger,
        0,
      ])

      expect(toKV(sizeTree)).toEqual([
        [0, 2],
        [1, 1],
      ])

      expect(offsetTree).toEqual([
        { index: 0, offset: 0, size: 2 },
        { index: 1, offset: 2, size: 1 },
      ])
    })

    it('joins to previous range', () => {
      let state = initialSizeState()

      state = sizeStateReducer(state, [
        [
          { endIndex: 0, size: 1, startIndex: 0 },
          { endIndex: 4, size: 2, startIndex: 2 },
        ],
        [],
        mockLogger,
        0,
      ])

      state = sizeStateReducer(state, [[{ endIndex: 9, size: 2, startIndex: 5 }], [], mockLogger, 0])

      const { offsetTree, sizeTree } = state

      expect(toKV(sizeTree)).toEqual([
        [0, 1],
        [2, 2],
        [10, 1],
      ])

      expect(offsetTree).toEqual([
        { index: 0, offset: 0, size: 1 },
        { index: 2, offset: 2, size: 2 },
        { index: 10, offset: 18, size: 1 },
      ])
    })

    it('joins to next range', () => {
      const state = initialSizeState()

      const { offsetTree, sizeTree } = sizeStateReducer(state, [
        [
          { endIndex: 0, size: 1, startIndex: 0 },
          { endIndex: 9, size: 2, startIndex: 5 },
          { endIndex: 4, size: 2, startIndex: 2 },
        ],
        [],
        mockLogger,
        0,
      ])

      expect(toKV(sizeTree)).toEqual([
        [0, 1],
        [2, 2],
        [10, 1],
      ])

      expect(offsetTree).toEqual([
        { index: 0, offset: 0, size: 1 },
        { index: 2, offset: 2, size: 2 },
        { index: 10, offset: 18, size: 1 },
      ])
    })
  })

  it('partially punches existing range', () => {
    const state = initialSizeState()

    const { offsetTree, sizeTree } = sizeStateReducer(state, [
      [
        { endIndex: 0, size: 1, startIndex: 0 },
        { endIndex: 9, size: 2, startIndex: 5 },
        { endIndex: 11, size: 3, startIndex: 7 },
      ],
      [],
      mockLogger,
      0,
    ])

    expect(toKV(sizeTree)).toEqual([
      [0, 1],
      [5, 2],
      [7, 3],
      [12, 1],
    ])

    expect(offsetTree).toEqual([
      { index: 0, offset: 0, size: 1 },
      { index: 5, offset: 5, size: 2 },
      { index: 7, offset: 9, size: 3 },
      { index: 12, offset: 24, size: 1 },
    ])
  })

  it('removes obsolete ranges', () => {
    const state = initialSizeState()

    const { offsetTree, sizeTree } = sizeStateReducer(state, [
      [
        { endIndex: 0, size: 1, startIndex: 0 },
        { endIndex: 9, size: 2, startIndex: 5 },
        { endIndex: 11, size: 3, startIndex: 7 },
        { endIndex: 12, size: 1, startIndex: 3 },
      ],
      [],
      mockLogger,
      0,
    ])

    expect(toKV(sizeTree)).toEqual([[0, 1]])
    expect(offsetTree).toEqual([{ index: 0, offset: 0, size: 1 }])
  })

  it('handles subsequent insertions correctly (bug)', () => {
    const state = initialSizeState()

    let nextState = sizeStateReducer(state, [[{ endIndex: 0, size: 158, startIndex: 0 }], [], mockLogger, 0])

    expect(ranges(nextState.sizeTree)).toEqual([{ end: Infinity, start: 0, value: 158 }])

    nextState = sizeStateReducer(nextState, [[{ endIndex: 1, size: 206, startIndex: 1 }], [], mockLogger, 0])

    expect(ranges(nextState.sizeTree)).toEqual([
      { end: 0, start: 0, value: 158 },
      { end: 1, start: 1, value: 206 },
      { end: Infinity, start: 2, value: 158 },
    ])

    nextState = sizeStateReducer(nextState, [[{ endIndex: 3, size: 182, startIndex: 3 }], [], mockLogger, 0])

    expect(ranges(nextState.sizeTree)).toEqual([
      { end: 0, start: 0, value: 158 },
      { end: 1, start: 1, value: 206 },
      { end: 2, start: 2, value: 158 },
      { end: 3, start: 3, value: 182 },
      { end: Infinity, start: 4, value: 158 },
    ])

    nextState = sizeStateReducer(nextState, [
      [
        {
          endIndex: 4,
          size: 206,
          startIndex: 4,
        },
      ],
      [],
      mockLogger,
      0,
    ])

    expect(ranges(nextState.sizeTree)).toEqual([
      { end: 0, start: 0, value: 158 },
      { end: 1, start: 1, value: 206 },
      { end: 2, start: 2, value: 158 },
      { end: 3, start: 3, value: 182 },
      { end: 4, start: 4, value: 206 },
      { end: Infinity, start: 5, value: 158 },
    ])
  })

  it('handles subsequent insertions correctly (bug #2)', () => {
    const state = initialSizeState()

    const { sizeTree } = sizeStateReducer(state, [
      [
        { endIndex: 0, size: 206, startIndex: 0 },
        { endIndex: 0, size: 230, startIndex: 0 },
        { endIndex: 1, size: 158, startIndex: 1 },
        { endIndex: 3, size: 182, startIndex: 3 },
        { endIndex: 4, size: 158, startIndex: 4 },
        { endIndex: 5, size: 158, startIndex: 5 },
        { endIndex: 6, size: 230, startIndex: 6 },
      ],
      [],
      mockLogger,
      0,
    ])

    expect(ranges(sizeTree)).toEqual([
      { end: 0, start: 0, value: 230 },
      { end: 1, start: 1, value: 158 },
      { end: 2, start: 2, value: 206 },
      { end: 3, start: 3, value: 182 },
      { end: 5, start: 4, value: 158 },
      { end: 6, start: 6, value: 230 },
      { end: Infinity, start: 7, value: 206 },
    ])
  })

  it('finds the offset of a given index (simple tree)', () => {
    let state = initialSizeState()

    state = sizeStateReducer(state, [[{ endIndex: 0, size: 30, startIndex: 0 }], [], mockLogger, 0])

    expect(offsetOf(10, state.offsetTree, 0)).toBe(300)
  })

  it('finds the offset of a given index (complex tree)', () => {
    let state = initialSizeState()

    state = sizeStateReducer(state, [[{ endIndex: 0, size: 30, startIndex: 0 }], [], mockLogger, 0])
    state = sizeStateReducer(state, [[{ endIndex: 4, size: 20, startIndex: 0 }], [], mockLogger, 0])

    expect(offsetOf(10, state.offsetTree, 0)).toBe(250)
  })

  it('builds correct index tree', () => {
    let state = initialSizeState()

    for (let index = 0; index < 5; index++) {
      state = sizeStateReducer(state, [[{ endIndex: index, size: index % 2 ? 50 : 30, startIndex: index }], [], mockLogger, 0])
    }

    const { offsetTree, sizeTree } = state

    expect(toKV(sizeTree)).toHaveLength(5)
    expect(offsetTree).toHaveLength(5)
  })

  it('builds correct index tree (reverse)', () => {
    let state = initialSizeState()

    for (let index = 4; index >= 0; index--) {
      state = sizeStateReducer(state, [[{ endIndex: index, size: index % 2 ? 50 : 30, startIndex: index }], [], mockLogger, 0])
    }

    const { offsetTree, sizeTree } = state

    expect(toKV(sizeTree)).toHaveLength(5)
    expect(offsetTree).toHaveLength(5)
  })

  describe('group indices', () => {
    it('merges groups and items if a single size is reported', () => {
      let state = initialSizeState()
      state = sizeStateReducer(state, [[{ endIndex: 1, size: 30, startIndex: 0 }], [0, 6, 11], mockLogger, 0])
      expect(toKV(state.sizeTree)).toEqual([[0, 30]])

      expect(state.offsetTree).toEqual([{ index: 0, offset: 0, size: 30 }])
    })

    it('fills in the group sizes when 2 item sizes is reported', () => {
      let state = initialSizeState()
      state = sizeStateReducer(state, [
        [
          { endIndex: 0, size: 30, startIndex: 0 },
          { endIndex: 1, size: 20, startIndex: 1 },
        ],
        [0, 6, 11],
        mockLogger,
        0,
      ])
      expect(toKV(state.sizeTree)).toEqual([
        [0, 30],
        [1, 20],
        [6, 30],
        [7, 20],
        [11, 30],
        [12, 20],
      ])

      expect(state.offsetTree).toEqual([
        { index: 0, offset: 0, size: 30 },
        { index: 1, offset: 30, size: 20 },
        { index: 6, offset: 130, size: 30 },
        { index: 7, offset: 160, size: 20 },
        { index: 11, offset: 240, size: 30 },
        { index: 12, offset: 270, size: 20 },
      ])
    })
  })
})

describe('size engine', () => {
  it('publishes list refreshes', () => {
    const { listRefresh, sizeRanges, totalCount } = init(sizeSystem)
    publish(totalCount, 10)
    const sub = vi.fn()
    subscribe(listRefresh, sub)
    expect(sub).toHaveBeenCalledTimes(0)
    publish(sizeRanges, [{ endIndex: 0, size: 1, startIndex: 0 }])
    expect(sub).toHaveBeenCalledTimes(1)
    expect(sub).toHaveBeenCalledWith(true)
    publish(sizeRanges, [{ endIndex: 0, size: 1, startIndex: 0 }])
    expect(sub).toHaveBeenCalledTimes(2)
    expect(sub).toHaveBeenCalledWith(false)
  })

  describe('group indices', () => {
    it('starts with dummy valued groupOffsetTree', () => {
      const { groupIndices, sizes } = init(sizeSystem)
      publish(groupIndices, [0, 6, 11])
      expect(getValue(sizes).groupIndices).toEqual([0, 6, 11])

      expect(toKV(getValue(sizes).groupOffsetTree)).toEqual([
        [0, 0],
        [6, 1],
        [11, 2],
      ])
    })

    it('creates correct groupOffsetTree when group and item size is known', () => {
      const { groupIndices, sizeRanges, sizes } = init(sizeSystem)
      publish(groupIndices, [0, 6, 11])

      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 5, size: 20, startIndex: 1 },
      ])
      publish(sizeRanges, [])

      expect(toKV(getValue(sizes).groupOffsetTree)).toEqual([
        [0, 0],
        [6, 130],
        [11, 240],
      ])
    })

    it('extends existing sizes when new groups are pushed', () => {
      const { groupIndices, sizeRanges, sizes } = init(sizeSystem)
      publish(groupIndices, [0, 6, 11])

      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 5, size: 20, startIndex: 1 },
      ])
      publish(sizeRanges, [])

      expect(toKV(getValue(sizes).groupOffsetTree)).toEqual([
        [0, 0],
        [6, 130],
        [11, 240],
      ])
      publish(groupIndices, [0, 6, 11, 15, 20])

      expect(toKV(getValue(sizes).groupOffsetTree)).toEqual([
        [0, 0],
        [6, 130],
        [11, 240],
        [15, 330],
        [20, 430], // this should be 440, but updatin the group does not propagade the known group size to newly introduced groups.
      ])
    })

    it('creates correct groupOffsetTree when groups are the same as items', () => {
      const { groupIndices, sizeRanges, sizes } = init(sizeSystem)
      publish(groupIndices, [0, 6, 11])

      publish(sizeRanges, [{ endIndex: 1, size: 20, startIndex: 0 }])
      publish(sizeRanges, [])

      expect(toKV(getValue(sizes).groupOffsetTree)).toEqual([
        [0, 0],
        [6, 120],
        [11, 220],
      ])
    })
  })

  describe('unshifting', () => {
    it('unshifts known sizes and offsets', () => {
      const { sizeRanges, sizes, unshiftWith } = init(sizeSystem)

      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 5, size: 20, startIndex: 1 },
      ])

      expect(toKV(getValue(sizes).sizeTree)).toEqual([
        [0, 30],
        [1, 20],
        [6, 30],
      ])

      expect(getValue(sizes).offsetTree).toEqual([
        { index: 0, offset: 0, size: 30 },
        { index: 1, offset: 30, size: 20 },
        { index: 6, offset: 130, size: 30 },
      ])

      publish(unshiftWith, 5)

      expect(toKV(getValue(sizes).sizeTree)).toEqual([
        [0, 30],
        [6, 20],
        [11, 30],
      ])

      expect(getValue(sizes).offsetTree).toEqual([
        { index: 0, offset: 0, size: 30 },
        { index: 6, offset: 180, size: 20 },
        { index: 11, offset: 280, size: 30 },
      ])
    })

    it('decreasing the first item index unshifts items', () => {
      const { firstItemIndex, unshiftWith } = init(sizeSystem)
      const sub = vi.fn()
      subscribe(unshiftWith, sub)
      publish(firstItemIndex, 150)
      publish(firstItemIndex, 100)
      expect(sub).toHaveBeenCalledTimes(1)
      expect(sub).toHaveBeenCalledWith(50)
    })
  })

  describe('shifting', () => {
    it('shifts known sizes', () => {
      const { shiftWith, sizeRanges, sizes } = init(sizeSystem)

      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 5, size: 20, startIndex: 1 },
      ])

      expect(toKV(getValue(sizes).sizeTree)).toEqual([
        [0, 30],
        [1, 20],
        [6, 30],
      ])

      expect(getValue(sizes).offsetTree).toEqual([
        { index: 0, offset: 0, size: 30 },
        { index: 1, offset: 30, size: 20 },
        { index: 6, offset: 130, size: 30 },
      ])

      publish(shiftWith, -3)

      expect(toKV(getValue(sizes).sizeTree)).toEqual([
        [0, 20],
        [3, 30],
      ])

      expect(getValue(sizes).offsetTree).toEqual([
        { index: 0, offset: 0, size: 20 },
        { index: 3, offset: 60, size: 30 },
      ])
    })

    it.skip('decreasing the first item index unshifts items', () => {
      const { firstItemIndex, unshiftWith } = init(sizeSystem)
      const sub = vi.fn()
      subscribe(unshiftWith, sub)
      publish(firstItemIndex, 150)
      publish(firstItemIndex, 100)
      expect(sub).toHaveBeenCalledTimes(1)
      expect(sub).toHaveBeenCalledWith(50)
    })
  })

  it('trims the sizes when total count decreases', () => {
    const { sizeRanges, sizes, totalCount } = init(sizeSystem)
    publish(totalCount, 5)
    publish(sizeRanges, [{ endIndex: 0, size: 1, startIndex: 0 }])
    publish(sizeRanges, [{ endIndex: 3, size: 3, startIndex: 3 }])
    publish(sizeRanges, [{ endIndex: 4, size: 2, startIndex: 4 }])
    publish(totalCount, 4)
    expect(getValue(sizes)).toMatchObject({ lastIndex: 4, lastOffset: 6, lastSize: 1 })
  })

  it('trims the sizes when total count decreases (case 2)', () => {
    const { sizeRanges, sizes, totalCount } = init(sizeSystem)
    publish(totalCount, 9)
    publish(sizeRanges, [{ endIndex: 0, size: 1, startIndex: 0 }])
    publish(sizeRanges, [{ endIndex: 6, size: 3, startIndex: 3 }])
    publish(totalCount, 5)
    expect(getValue(sizes)).toMatchObject({ lastIndex: 5, lastOffset: 9, lastSize: 1 })
  })

  it('trims the sizes when total count decreases (case 3)', () => {
    const { sizeRanges, sizes, totalCount } = init(sizeSystem)
    publish(totalCount, 9)
    publish(sizeRanges, [{ endIndex: 0, size: 1, startIndex: 0 }])
    publish(sizeRanges, [{ endIndex: 6, size: 3, startIndex: 3 }])
    publish(totalCount, 3)
    expect(getValue(sizes)).toMatchObject({ lastIndex: 0, lastOffset: 0, lastSize: 1 })
  })
})

describe('ranges within offsets', () => {
  const offsetTree = [
    { index: 0, offset: 0, size: 1 },
    { index: 3, offset: 3, size: 2 },
    { index: 8, offset: 13, size: 1 },
    { index: 9, offset: 14, size: 2 },
    { index: 11, offset: 18, size: 1 },
  ]

  it('gets the items in the given offset', () => {
    expect(rangesWithinOffsets(offsetTree, 8, 15)).toEqual([
      { end: 7, start: 3, value: { index: 3, offset: 3, size: 2 } },
      { end: 8, start: 8, value: { index: 8, offset: 13, size: 1 } },
      { end: Infinity, start: 9, value: { index: 9, offset: 14, size: 2 } },
    ])
  })

  it('gets the items in the given offset with minimum index constraint', () => {
    expect(rangesWithinOffsets(offsetTree, 8, 15, 8)).toEqual([
      { end: 8, start: 8, value: { index: 8, offset: 13, size: 1 } },
      { end: Infinity, start: 9, value: { index: 9, offset: 14, size: 2 } },
    ])
  })
})

describe('state save', () => {
  it('serializes the size tree to ranges', () => {
    let state = initialSizeState()
    expect(sizeTreeToRanges(state.sizeTree)).toEqual([])
    state = sizeStateReducer(state, [[{ endIndex: 0, size: 1, startIndex: 0 }], [], mockLogger, 0])
    expect(sizeTreeToRanges(state.sizeTree)).toEqual([{ endIndex: Infinity, size: 1, startIndex: 0 }])

    state = sizeStateReducer(state, [[{ endIndex: 5, size: 2, startIndex: 3 }], [], mockLogger, 0])
    expect(sizeTreeToRanges(state.sizeTree)).toEqual([
      { endIndex: 2, size: 1, startIndex: 0 },
      { endIndex: 5, size: 2, startIndex: 3 },
      { endIndex: Infinity, size: 1, startIndex: 6 },
    ])
  })
})

describe('heightEstimates', () => {
  it('builds size ranges from height estimates array', () => {
    const { heightEstimates, sizes } = init(sizeSystem)

    // All different sizes
    publish(heightEstimates, [40, 200, 60, 100])

    const state = getValue(sizes)
    // The size tree maintains ranges - after index 3, it reverts to the baseline size (40)
    expect(toKV(state.sizeTree)).toEqual([
      [0, 40],
      [1, 200],
      [2, 60],
      [3, 100],
      [4, 40], // Baseline size continues after the last estimate
    ])

    expect(state.offsetTree).toEqual([
      { index: 0, offset: 0, size: 40 },
      { index: 1, offset: 40, size: 200 },
      { index: 2, offset: 240, size: 60 },
      { index: 3, offset: 300, size: 100 },
      { index: 4, offset: 400, size: 40 },
    ])
  })

  it('merges consecutive items with same estimated height', () => {
    const { heightEstimates, sizes } = init(sizeSystem)

    // Some items have the same size, should be merged into ranges
    publish(heightEstimates, [40, 40, 40, 200, 200, 60])

    const state = getValue(sizes)
    // The size tree maintains ranges - after index 5, it reverts to the baseline size (40)
    expect(toKV(state.sizeTree)).toEqual([
      [0, 40],
      [3, 200],
      [5, 60],
      [6, 40], // Baseline size continues after the last estimate
    ])

    expect(state.offsetTree).toEqual([
      { index: 0, offset: 0, size: 40 },
      { index: 3, offset: 120, size: 200 },
      { index: 5, offset: 520, size: 60 },
      { index: 6, offset: 580, size: 40 },
    ])
  })

  it('handles single item estimate', () => {
    const { heightEstimates, sizes } = init(sizeSystem)

    publish(heightEstimates, [100])

    const state = getValue(sizes)
    expect(toKV(state.sizeTree)).toEqual([[0, 100]])
    expect(state.offsetTree).toEqual([{ index: 0, offset: 0, size: 100 }])
  })

  it('does not apply estimates if size tree is already populated', () => {
    const { heightEstimates, sizeRanges, sizes } = init(sizeSystem)

    // First, populate with actual measurements
    publish(sizeRanges, [{ endIndex: 0, size: 50, startIndex: 0 }])

    // Now try to apply estimates - should be ignored
    publish(heightEstimates, [100, 200, 300])

    const state = getValue(sizes)
    // Should still have the original size, not the estimates
    expect(toKV(state.sizeTree)).toEqual([[0, 50]])
  })

  it('calculates correct offsets for widely varying heights', () => {
    const { heightEstimates, sizes } = init(sizeSystem)

    // Mix of small and very large items
    publish(heightEstimates, [40, 2000, 40, 1500, 40])

    const state = getValue(sizes)
    expect(state.offsetTree).toEqual([
      { index: 0, offset: 0, size: 40 },
      { index: 1, offset: 40, size: 2000 },
      { index: 2, offset: 2040, size: 40 },
      { index: 3, offset: 2080, size: 1500 },
      { index: 4, offset: 3580, size: 40 },
    ])
  })

  it('ignores empty estimates array', () => {
    const { heightEstimates, sizes } = init(sizeSystem)

    publish(heightEstimates, [])

    const state = getValue(sizes)
    expect(toKV(state.sizeTree)).toEqual([])
    expect(state.offsetTree).toEqual([])
  })
})

/*
describe.only('benchmarks', () => {
  const COUNT = 20000
  const JAGGED = 4
  it('handles jagged list', () => {
    const t0 = performance.now()
    const { sizeRanges, totalCount } = init(sizeSystem)
    publish(totalCount, COUNT)
    publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 2 }])

    for (let index = 1; index < COUNT; index += JAGGED) {
      publish(sizeRanges, [{ startIndex: index, endIndex: index, size: 1 }])
    }

    const t1 = performance.now()

    console.log('Took', (t1 - t0).toFixed(4), 'milliseconds to build jagged list:')

    expect(true).toBeTruthy()
  })

  it('handles jagged reverse list', () => {
    const t0 = performance.now()
    const { sizeRanges, totalCount } = init(sizeSystem)
    publish(totalCount, COUNT)
    publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 2 }])
    let count = 0
    for (let index = COUNT - 1; index > 0; index -= JAGGED) {
      count++
      publish(sizeRanges, [{ startIndex: index, endIndex: index, size: 1 }])
    }
    const t1 = performance.now()
    console.log('Took', (t1 - t0).toFixed(4), 'milliseconds to build reverse jagged list, average', ((t1 - t0) / count).toFixed(5))

    expect(true).toBeTruthy()
  })
})
   */
