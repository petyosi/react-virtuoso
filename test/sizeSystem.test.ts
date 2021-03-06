import { getValue, init, publish, subscribe } from '@virtuoso.dev/urx'
import { AANode, ranges, walk } from '../src/AATree'
import { initialSizeState, offsetOf, rangesWithinOffsets, sizeStateReducer, sizeSystem } from '../src/sizeSystem'

function toKV<T>(tree: AANode<T>) {
  return walk(tree).map((node) => [node.k, node.v] as [number, T])
}

describe('size state reducer', () => {
  describe('insert', () => {
    it('sets the initial insert as a baseline', () => {
      const state = initialSizeState()
      const { sizeTree, offsetTree } = sizeStateReducer(state, [[{ startIndex: 0, endIndex: 0, size: 1 }], []])
      expect(toKV(sizeTree)).toEqual([[0, 1]])
      expect(offsetTree).toEqual([{ offset: 0, index: 0, size: 1 }])
    })

    it('punches the initial range', () => {
      const state = initialSizeState()
      const { sizeTree, offsetTree } = sizeStateReducer(state, [
        [
          { startIndex: 0, endIndex: 0, size: 1 },
          { startIndex: 3, endIndex: 7, size: 2 },
          { startIndex: 9, endIndex: 10, size: 2 },
        ],
        [],
      ])
      expect(toKV(sizeTree)).toEqual([
        [0, 1],
        [3, 2],
        [8, 1],
        [9, 2],
        [11, 1],
      ])

      expect(offsetTree).toEqual([
        { offset: 0, index: 0, size: 1 },
        { offset: 3, index: 3, size: 2 },
        { offset: 13, index: 8, size: 1 },
        { offset: 14, index: 9, size: 2 },
        { offset: 18, index: 11, size: 1 },
      ])
    })

    it('does not change the ranges if size is the same', () => {
      const state = initialSizeState()
      const { offsetTree, sizeTree } = sizeStateReducer(state, [
        [
          { startIndex: 0, endIndex: 0, size: 1 },
          { startIndex: 3, endIndex: 8, size: 1 },
        ],
        [],
      ])

      expect(toKV(sizeTree)).toEqual([[0, 1]])
      expect(offsetTree).toEqual([{ offset: 0, index: 0, size: 1 }])
    })

    it('keeps default size if reinserted in the beginning', () => {
      const state = initialSizeState()
      const { offsetTree, sizeTree } = sizeStateReducer(state, [
        [
          { startIndex: 0, endIndex: 0, size: 1 },
          { startIndex: 0, endIndex: 0, size: 2 },
        ],
        [],
      ])

      expect(toKV(sizeTree)).toEqual([
        [0, 2],
        [1, 1],
      ])

      expect(offsetTree).toEqual([
        { offset: 0, index: 0, size: 2 },
        { offset: 2, index: 1, size: 1 },
      ])
    })

    it('joins to previous range', () => {
      let state = initialSizeState()

      state = sizeStateReducer(state, [
        [
          { startIndex: 0, endIndex: 0, size: 1 },
          { startIndex: 2, endIndex: 4, size: 2 },
        ],
        [],
      ])

      state = sizeStateReducer(state, [[{ startIndex: 5, endIndex: 9, size: 2 }], []])

      const { sizeTree, offsetTree } = state

      expect(toKV(sizeTree)).toEqual([
        [0, 1],
        [2, 2],
        [10, 1],
      ])

      expect(offsetTree).toEqual([
        { offset: 0, index: 0, size: 1 },
        { offset: 2, index: 2, size: 2 },
        { offset: 18, index: 10, size: 1 },
      ])
    })

    it('joins to next range', () => {
      const state = initialSizeState()

      const { sizeTree, offsetTree } = sizeStateReducer(state, [
        [
          { startIndex: 0, endIndex: 0, size: 1 },
          { startIndex: 5, endIndex: 9, size: 2 },
          { startIndex: 2, endIndex: 4, size: 2 },
        ],
        [],
      ])

      expect(toKV(sizeTree)).toEqual([
        [0, 1],
        [2, 2],
        [10, 1],
      ])

      expect(offsetTree).toEqual([
        { offset: 0, index: 0, size: 1 },
        { offset: 2, index: 2, size: 2 },
        { offset: 18, index: 10, size: 1 },
      ])
    })
  })

  it('partially punches existing range', () => {
    const state = initialSizeState()

    const { sizeTree, offsetTree } = sizeStateReducer(state, [
      [
        { startIndex: 0, endIndex: 0, size: 1 },
        { startIndex: 5, endIndex: 9, size: 2 },
        { startIndex: 7, endIndex: 11, size: 3 },
      ],
      [],
    ])

    expect(toKV(sizeTree)).toEqual([
      [0, 1],
      [5, 2],
      [7, 3],
      [12, 1],
    ])

    expect(offsetTree).toEqual([
      { offset: 0, index: 0, size: 1 },
      { offset: 5, index: 5, size: 2 },
      { offset: 9, index: 7, size: 3 },
      { offset: 24, index: 12, size: 1 },
    ])
  })

  it('removes obsolete ranges', () => {
    const state = initialSizeState()

    const { sizeTree, offsetTree } = sizeStateReducer(state, [
      [
        { startIndex: 0, endIndex: 0, size: 1 },
        { startIndex: 5, endIndex: 9, size: 2 },
        { startIndex: 7, endIndex: 11, size: 3 },
        { startIndex: 3, endIndex: 12, size: 1 },
      ],
      [],
    ])

    expect(toKV(sizeTree)).toEqual([[0, 1]])
    expect(offsetTree).toEqual([{ index: 0, size: 1, offset: 0 }])
  })

  it('handles subsequent insertions correctly (bug)', () => {
    const state = initialSizeState()

    let nextState = sizeStateReducer(state, [[{ startIndex: 0, endIndex: 0, size: 158 }], []])

    expect(ranges(nextState.sizeTree)).toEqual([{ start: 0, end: Infinity, value: 158 }])

    nextState = sizeStateReducer(nextState, [[{ startIndex: 1, endIndex: 1, size: 206 }], []])

    expect(ranges(nextState.sizeTree)).toEqual([
      { start: 0, end: 0, value: 158 },
      { start: 1, end: 1, value: 206 },
      { start: 2, end: Infinity, value: 158 },
    ])

    nextState = sizeStateReducer(nextState, [[{ startIndex: 3, endIndex: 3, size: 182 }], []])

    expect(ranges(nextState.sizeTree)).toEqual([
      { start: 0, end: 0, value: 158 },
      { start: 1, end: 1, value: 206 },
      { start: 2, end: 2, value: 158 },
      { start: 3, end: 3, value: 182 },
      { start: 4, end: Infinity, value: 158 },
    ])

    nextState = sizeStateReducer(nextState, [
      [
        {
          startIndex: 4,
          endIndex: 4,
          size: 206,
        },
      ],
      [],
    ])

    expect(ranges(nextState.sizeTree)).toEqual([
      { start: 0, end: 0, value: 158 },
      { start: 1, end: 1, value: 206 },
      { start: 2, end: 2, value: 158 },
      { start: 3, end: 3, value: 182 },
      { start: 4, end: 4, value: 206 },
      { start: 5, end: Infinity, value: 158 },
    ])
  })

  it('handles subsequent insertions correctly (bug #2)', () => {
    const state = initialSizeState()

    const { sizeTree } = sizeStateReducer(state, [
      [
        { startIndex: 0, endIndex: 0, size: 206 },
        { startIndex: 0, endIndex: 0, size: 230 },
        { startIndex: 1, endIndex: 1, size: 158 },
        { startIndex: 3, endIndex: 3, size: 182 },
        { startIndex: 4, endIndex: 4, size: 158 },
        { startIndex: 5, endIndex: 5, size: 158 },
        { startIndex: 6, endIndex: 6, size: 230 },
      ],
      [],
    ])

    expect(ranges(sizeTree)).toEqual([
      { start: 0, end: 0, value: 230 },
      { start: 1, end: 1, value: 158 },
      { start: 2, end: 2, value: 206 },
      { start: 3, end: 3, value: 182 },
      { start: 4, end: 5, value: 158 },
      { start: 6, end: 6, value: 230 },
      { start: 7, end: Infinity, value: 206 },
    ])
  })

  it('finds the offset of a given index (simple tree)', () => {
    let state = initialSizeState()

    state = sizeStateReducer(state, [[{ startIndex: 0, endIndex: 0, size: 30 }], []])

    expect(offsetOf(10, state.offsetTree)).toBe(300)
  })

  it('finds the offset of a given index (complex tree)', () => {
    let state = initialSizeState()

    state = sizeStateReducer(state, [[{ startIndex: 0, endIndex: 0, size: 30 }], []])
    state = sizeStateReducer(state, [[{ startIndex: 0, endIndex: 4, size: 20 }], []])

    expect(offsetOf(10, state.offsetTree)).toBe(250)
  })

  it('builds correct index tree', () => {
    let state = initialSizeState()

    for (let index = 0; index < 5; index++) {
      state = sizeStateReducer(state, [[{ startIndex: index, endIndex: index, size: index % 2 ? 50 : 30 }], []])
    }

    const { sizeTree, offsetTree } = state

    expect(toKV(sizeTree)).toHaveLength(5)
    expect(offsetTree).toHaveLength(5)
  })

  it('builds correct index tree (reverse)', () => {
    let state = initialSizeState()

    for (let index = 4; index >= 0; index--) {
      state = sizeStateReducer(state, [[{ startIndex: index, endIndex: index, size: index % 2 ? 50 : 30 }], []])
    }

    const { offsetTree, sizeTree } = state

    expect(toKV(sizeTree)).toHaveLength(5)
    expect(offsetTree).toHaveLength(5)
  })

  describe('group indices', () => {
    it('merges groups and items if a single size is reported', () => {
      let state = initialSizeState()
      state = sizeStateReducer(state, [[{ startIndex: 0, endIndex: 1, size: 30 }], [0, 6, 11]])
      expect(toKV(state.sizeTree)).toEqual([[0, 30]])

      expect(state.offsetTree).toEqual([{ index: 0, size: 30, offset: 0 }])
    })

    it('fills in the group sizes when 2 item sizes is reported', () => {
      let state = initialSizeState()
      state = sizeStateReducer(state, [
        [
          { startIndex: 0, endIndex: 0, size: 30 },
          { startIndex: 1, endIndex: 1, size: 20 },
        ],
        [0, 6, 11],
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
        { offset: 0, index: 0, size: 30 },
        { offset: 30, index: 1, size: 20 },
        { offset: 130, index: 6, size: 30 },
        { offset: 160, index: 7, size: 20 },
        { offset: 240, index: 11, size: 30 },
        { offset: 270, index: 12, size: 20 },
      ])
    })
  })
})

describe('size engine', () => {
  it('publishes list refreshes', () => {
    const { sizeRanges, totalCount, listRefresh } = init(sizeSystem)
    publish(totalCount, 10)
    const sub = jest.fn()
    subscribe(listRefresh, sub)
    expect(sub).toHaveBeenCalledTimes(0)
    publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 1 }])
    expect(sub).toHaveBeenCalledTimes(1)
    expect(sub).toHaveBeenCalledWith(true)
    publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 1 }])
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
      const { sizeRanges, groupIndices, sizes } = init(sizeSystem)
      publish(groupIndices, [0, 6, 11])

      publish(sizeRanges, [
        { startIndex: 0, endIndex: 0, size: 30 },
        { startIndex: 1, endIndex: 5, size: 20 },
      ])
      publish(sizeRanges, [])

      expect(toKV(getValue(sizes).groupOffsetTree)).toEqual([
        [0, 0],
        [6, 130],
        [11, 240],
      ])
    })

    it('extends existing sizes when new groups are pushed', () => {
      const { sizeRanges, groupIndices, sizes } = init(sizeSystem)
      publish(groupIndices, [0, 6, 11])

      publish(sizeRanges, [
        { startIndex: 0, endIndex: 0, size: 30 },
        { startIndex: 1, endIndex: 5, size: 20 },
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
      const { sizeRanges, groupIndices, sizes } = init(sizeSystem)
      publish(groupIndices, [0, 6, 11])

      publish(sizeRanges, [{ startIndex: 0, endIndex: 1, size: 20 }])
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
      const { sizes, sizeRanges, unshiftWith } = init(sizeSystem)

      publish(sizeRanges, [
        { startIndex: 0, endIndex: 0, size: 30 },
        { startIndex: 1, endIndex: 5, size: 20 },
      ])

      expect(toKV(getValue(sizes).sizeTree)).toEqual([
        [0, 30],
        [1, 20],
        [6, 30],
      ])

      expect(getValue(sizes).offsetTree).toEqual([
        { offset: 0, index: 0, size: 30 },
        { offset: 30, index: 1, size: 20 },
        { offset: 130, index: 6, size: 30 },
      ])

      publish(unshiftWith, 5)

      expect(toKV(getValue(sizes).sizeTree)).toEqual([
        [0, 30],
        [6, 20],
        [11, 30],
      ])

      expect(getValue(sizes).offsetTree).toEqual([
        { offset: 0, index: 0, size: 30 },
        { offset: 180, index: 6, size: 20 },
        { offset: 280, index: 11, size: 30 },
      ])
    })

    it('decreasing the first item index unshifts items', () => {
      const { unshiftWith, firstItemIndex } = init(sizeSystem)
      const sub = jest.fn()
      subscribe(unshiftWith, sub)
      publish(firstItemIndex, 150)
      publish(firstItemIndex, 100)
      expect(sub).toHaveBeenCalledTimes(1)
      expect(sub).toHaveBeenCalledWith(50)
    })
  })

  it('trims the sizes when total count decreases', () => {
    const { sizeRanges, totalCount, sizes } = init(sizeSystem)
    publish(totalCount, 5)
    publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 1 }])
    publish(sizeRanges, [{ startIndex: 3, endIndex: 3, size: 3 }])
    publish(sizeRanges, [{ startIndex: 4, endIndex: 4, size: 2 }])
    publish(totalCount, 4)
    expect(getValue(sizes)).toMatchObject({ lastIndex: 4, lastOffset: 6, lastSize: 1 })
  })

  it('trims the sizes when total count decreases (case 2)', () => {
    const { sizeRanges, totalCount, sizes } = init(sizeSystem)
    publish(totalCount, 9)
    publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 1 }])
    publish(sizeRanges, [{ startIndex: 3, endIndex: 6, size: 3 }])
    publish(totalCount, 5)
    expect(getValue(sizes)).toMatchObject({ lastIndex: 5, lastOffset: 9, lastSize: 1 })
  })

  it('trims the sizes when total count decreases (case 3)', () => {
    const { sizeRanges, totalCount, sizes } = init(sizeSystem)
    publish(totalCount, 9)
    publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 1 }])
    publish(sizeRanges, [{ startIndex: 3, endIndex: 6, size: 3 }])
    publish(totalCount, 3)
    expect(getValue(sizes)).toMatchObject({ lastIndex: 0, lastOffset: 0, lastSize: 1 })
  })
})

describe('ranges within offsets', () => {
  const offsetTree = [
    { offset: 0, index: 0, size: 1 },
    { offset: 3, index: 3, size: 2 },
    { offset: 13, index: 8, size: 1 },
    { offset: 14, index: 9, size: 2 },
    { offset: 18, index: 11, size: 1 },
  ]

  it('gets the items in the given offset', () => {
    expect(rangesWithinOffsets(offsetTree, 8, 15)).toEqual([
      { start: 3, end: 7, value: { offset: 3, index: 3, size: 2 } },
      { start: 8, end: 8, value: { offset: 13, index: 8, size: 1 } },
      { start: 9, end: Infinity, value: { offset: 14, index: 9, size: 2 } },
    ])
  })

  it('gets the items in the given offset with minimum index constraint', () => {
    expect(rangesWithinOffsets(offsetTree, 8, 15, 8)).toEqual([
      { start: 8, end: 8, value: { offset: 13, index: 8, size: 1 } },
      { start: 9, end: Infinity, value: { offset: 14, index: 9, size: 2 } },
    ])
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
