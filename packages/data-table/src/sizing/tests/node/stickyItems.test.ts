// oxlint-disable prefer-to-be-falsy
// oxlint-disable max-expects
import { describe, expect, it } from 'vitest'

import { itemsWithinOffsets } from '../../itemsWithinOffsets'
import { EMPTY_SIZE_STATE, updateSizeState } from '../../SizeState'
import { computeStickyItems, EMPTY_STICKY_RESULT, findStickyEndIndex, findStickyStartIndex, processStickyConfig } from '../../stickyItems'

import type { SizeState } from '../../SizeState'
import type { ProcessedStickyGroup, StickyItemsConfig } from '../../stickyItems'

function createSizeState(sizeRanges: Array<{ startIndex: number; endIndex: number; size: number }>): SizeState {
  let state = EMPTY_SIZE_STATE
  for (const range of sizeRanges) {
    state = updateSizeState(state, [range])
  }
  return state
}

function createOffsetTree(sizeRanges: Array<{ startIndex: number; endIndex: number; size: number }>) {
  return createSizeState(sizeRanges).offsetTree
}

describe(findStickyStartIndex, () => {
  it('returns -1 for empty array', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyStartIndex([], 100, offsetTree)).toBe(-1)
  })

  it('returns -1 when all items are past target offset', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyStartIndex([2, 4, 6], 99, offsetTree)).toBe(-1)
  })

  it('returns single item when it qualifies', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyStartIndex([2], 150, offsetTree)).toBe(2)
  })

  it('returns item with largest offset less than target', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyStartIndex([0, 2, 4, 6], 250, offsetTree)).toBe(4)
  })

  it('includes item exactly at target offset', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyStartIndex([0, 2, 4], 100, offsetTree)).toBe(2)
  })

  it('handles target between two items (returns lower one)', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyStartIndex([0, 2, 4, 6], 175, offsetTree)).toBe(2)
  })

  it('works with variable item sizes in offsetTree', () => {
    const offsetTree = createOffsetTree([
      { startIndex: 0, endIndex: 2, size: 50 },
      { startIndex: 3, endIndex: 5, size: 100 },
      { startIndex: 6, endIndex: 9, size: 50 },
    ])
    expect(findStickyStartIndex([0, 3, 6], 200, offsetTree)).toBe(3)
    expect(findStickyStartIndex([0, 3, 6], 500, offsetTree)).toBe(6)
  })
})

describe(findStickyEndIndex, () => {
  it('returns -1 for empty array', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyEndIndex([], 100, offsetTree)).toBe(-1)
  })

  it('returns -1 when all items end before target offset', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyEndIndex([0, 2, 4], 300, offsetTree)).toBe(-1)
  })

  it('returns single item when it qualifies', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyEndIndex([6], 300, offsetTree)).toBe(6)
  })

  it('returns item with smallest offset that extends past target', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyEndIndex([2, 4, 6, 8], 300, offsetTree)).toBe(6)
  })

  it('handles target exactly at item end (should not include that item)', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
    expect(findStickyEndIndex([2, 4, 6], 250, offsetTree)).toBe(6)
  })

  it('works with variable item sizes in offsetTree', () => {
    const offsetTree = createOffsetTree([
      { startIndex: 0, endIndex: 2, size: 50 },
      { startIndex: 3, endIndex: 5, size: 100 },
      { startIndex: 6, endIndex: 9, size: 50 },
    ])
    expect(findStickyEndIndex([0, 3, 6], 400, offsetTree)).toBe(6)
    expect(findStickyEndIndex([0, 3, 6], 500, offsetTree)).toBe(-1)
  })
})

describe(processStickyConfig, () => {
  it('groups items by groupId and align', () => {
    const config: StickyItemsConfig = {
      items: [
        { index: 0, align: 'start', groupId: 'a' },
        { index: 5, align: 'start', groupId: 'a' },
        { index: 10, align: 'start', groupId: 'a' },
      ],
    }

    const result = processStickyConfig(config)

    expect(result).toHaveLength(1)
    expect(result[0]!.groupId).toBe('a')
    expect(result[0]!.align).toBe('start')
    expect(result[0]!.sortedIndices).toStrictEqual([0, 5, 10])
  })

  it('sorts indices within each group', () => {
    const config: StickyItemsConfig = {
      items: [
        { index: 10, align: 'start', groupId: 'a' },
        { index: 0, align: 'start', groupId: 'a' },
        { index: 5, align: 'start', groupId: 'a' },
      ],
    }

    const result = processStickyConfig(config)

    expect(result[0]!.sortedIndices).toStrictEqual([0, 5, 10])
  })

  it('handles empty config', () => {
    const config: StickyItemsConfig = { items: [] }

    const result = processStickyConfig(config)

    expect(result).toHaveLength(0)
  })

  it('separates same groupId with different align into different groups', () => {
    const config: StickyItemsConfig = {
      items: [
        { index: 0, align: 'start', groupId: 'a' },
        { index: 10, align: 'end', groupId: 'a' },
      ],
    }

    const result = processStickyConfig(config)

    expect(result).toHaveLength(2)
    const startGroup = result.find((g) => g.align === 'start')
    const endGroup = result.find((g) => g.align === 'end')
    expect(startGroup!.sortedIndices).toStrictEqual([0])
    expect(endGroup!.sortedIndices).toStrictEqual([10])
  })

  it('assigns level from groupLevels array position', () => {
    const config: StickyItemsConfig = {
      items: [
        { index: 0, align: 'start', groupId: 'country' },
        { index: 1, align: 'start', groupId: 'city' },
        { index: 2, align: 'start', groupId: 'district' },
      ],
      groupLevels: ['country', 'city', 'district'],
    }

    const result = processStickyConfig(config)

    expect(result).toHaveLength(3)
    expect(result[0]!.groupId).toBe('country')
    expect(result[0]!.level).toBe(0)
    expect(result[1]!.groupId).toBe('city')
    expect(result[1]!.level).toBe(1)
    expect(result[2]!.groupId).toBe('district')
    expect(result[2]!.level).toBe(2)
  })

  it('assigns default level to groups not in groupLevels', () => {
    const config: StickyItemsConfig = {
      items: [
        { index: 0, align: 'start', groupId: 'known' },
        { index: 1, align: 'start', groupId: 'unknown' },
      ],
      groupLevels: ['known'],
    }

    const result = processStickyConfig(config)

    const knownGroup = result.find((g) => g.groupId === 'known')
    const unknownGroup = result.find((g) => g.groupId === 'unknown')
    expect(knownGroup!.level).toBe(0)
    expect(unknownGroup!.level).toBe(1)
  })

  it('sorts output groups by level ascending', () => {
    const config: StickyItemsConfig = {
      items: [
        { index: 2, align: 'start', groupId: 'district' },
        { index: 0, align: 'start', groupId: 'country' },
        { index: 1, align: 'start', groupId: 'city' },
      ],
      groupLevels: ['country', 'city', 'district'],
    }

    const result = processStickyConfig(config)

    expect(result[0]!.groupId).toBe('country')
    expect(result[1]!.groupId).toBe('city')
    expect(result[2]!.groupId).toBe('district')
  })

  it('handles missing groupLevels (all groups get level 0)', () => {
    const config: StickyItemsConfig = {
      items: [
        { index: 0, align: 'start', groupId: 'a' },
        { index: 1, align: 'start', groupId: 'b' },
      ],
    }

    const result = processStickyConfig(config)

    expect(result[0]!.level).toBe(0)
    expect(result[1]!.level).toBe(0)
  })
})

describe(computeStickyItems, () => {
  describe('start-aligned sticky items', () => {
    it('selects item closest to viewport when multiple qualify', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'headers', align: 'start', level: 0, sortedIndices: [0, 5, 10, 15] }]

      const result = computeStickyItems(groups, offsetTree, 350, 550, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(5)
      expect(result.startStickySize).toBe(50)
    })

    it('returns empty when no items have scrolled past viewport start', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'headers', align: 'start', level: 0, sortedIndices: [5, 10, 15] }]

      const result = computeStickyItems(groups, offsetTree, 0, 200, null)

      expect(result.stickyStartItems).toHaveLength(0)
      expect(result.startStickySize).toBe(0)
    })

    it('sticks item exactly at viewport start', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'headers', align: 'start', level: 0, sortedIndices: [2] }]

      const result = computeStickyItems(groups, offsetTree, 100, 300, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(2)
      expect(result.startStickySize).toBe(50)
    })

    it('handles single sticky item correctly', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

      const result = computeStickyItems(groups, offsetTree, 100, 300, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(0)
      expect(result.stickyStartItems[0]!.offset).toBe(0)
      expect(result.stickyStartItems[0]!.size).toBe(50)
    })
  })

  describe('end-aligned sticky items', () => {
    it('selects item closest to viewport when multiple qualify', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'footers', align: 'end', level: 0, sortedIndices: [5, 10, 15, 19] }]

      const result = computeStickyItems(groups, offsetTree, 0, 300, null)

      expect(result.stickyEndItems).toHaveLength(1)
      expect(result.stickyEndItems[0]!.index).toBe(10)
      expect(result.endStickySize).toBe(50)
    })

    it('returns empty when no items are past viewport end', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'footers', align: 'end', level: 0, sortedIndices: [0, 5] }]

      const result = computeStickyItems(groups, offsetTree, 0, 1000, null)

      expect(result.stickyEndItems).toHaveLength(0)
      expect(result.endStickySize).toBe(0)
    })

    it('does not stick item ending exactly at viewport end', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'footers', align: 'end', level: 0, sortedIndices: [2] }]

      const result = computeStickyItems(groups, offsetTree, 0, 150, null)

      expect(result.stickyEndItems).toHaveLength(0)
      expect(result.endStickySize).toBe(0)
    })
  })

  describe('multi-group scenarios', () => {
    it('picks one sticky item per groupId', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [
        { groupId: 'group1', align: 'start', level: 0, sortedIndices: [0, 5] },
        { groupId: 'group2', align: 'start', level: 1, sortedIndices: [1, 6] },
      ]

      const result = computeStickyItems(groups, offsetTree, 350, 550, null)

      expect(result.stickyStartItems).toHaveLength(2)
      expect(result.stickyStartItems[0]!.index).toBe(5)
      expect(result.stickyStartItems[1]!.index).toBe(6)
    })

    it('handles mixed start/end alignments', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [
        { groupId: 'header', align: 'start', level: 0, sortedIndices: [0] },
        { groupId: 'footer', align: 'end', level: 0, sortedIndices: [19] },
      ]

      const result = computeStickyItems(groups, offsetTree, 100, 500, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(0)
      expect(result.stickyEndItems).toHaveLength(1)
      expect(result.stickyEndItems[0]!.index).toBe(19)
      expect(result.startStickySize).toBe(50)
      expect(result.endStickySize).toBe(50)
    })

    it('handles hierarchical groups with groupLevels ordering', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [
        { groupId: 'country', align: 'start', level: 0, sortedIndices: [0, 10] },
        { groupId: 'city', align: 'start', level: 1, sortedIndices: [1, 5, 11, 15] },
        { groupId: 'district', align: 'start', level: 2, sortedIndices: [2, 6, 12, 16] },
      ]

      const result = computeStickyItems(groups, offsetTree, 350, 700, null)

      expect(result.stickyStartItems).toHaveLength(3)
      expect(result.stickyStartItems[0]!.index).toBe(0)
      expect(result.stickyStartItems[1]!.index).toBe(5)
      expect(result.stickyStartItems[2]!.index).toBe(6)
    })

    it('returns stickyStartItems in groupLevels order', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [
        { groupId: 'district', align: 'start' as const, level: 2, sortedIndices: [2] },
        { groupId: 'country', align: 'start' as const, level: 0, sortedIndices: [0] },
        { groupId: 'city', align: 'start' as const, level: 1, sortedIndices: [1] },
      ].toSorted((a, b) => a.level - b.level)

      const result = computeStickyItems(groups, offsetTree, 200, 400, null)

      expect(result.stickyStartItems[0]!.index).toBe(0)
      expect(result.stickyStartItems[1]!.index).toBe(1)
      expect(result.stickyStartItems[2]!.index).toBe(2)
    })
  })

  describe('exclusion from regular items', () => {
    it('excludes sticky items from items array when in sticky position', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0, 5] }]

      const result = computeStickyItems(groups, offsetTree, 300, 500, null)

      expect(result.excludedIndices.has(5)).toBe(true)
      expect(result.excludedIndices.has(0)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles empty sticky config', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = []

      const result = computeStickyItems(groups, offsetTree, 0, 200, null)

      expect(result).toBe(EMPTY_STICKY_RESULT)
    })

    it('handles sticky item at index 0', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

      const result = computeStickyItems(groups, offsetTree, 50, 250, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(0)
    })

    it('handles sticky item at last index', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'footer', align: 'end', level: 0, sortedIndices: [9] }]

      const result = computeStickyItems(groups, offsetTree, 0, 200, null)

      expect(result.stickyEndItems).toHaveLength(1)
      expect(result.stickyEndItems[0]!.index).toBe(9)
    })

    it('selects item exactly at viewport boundary', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0, 2, 4] }]

      const result = computeStickyItems(groups, offsetTree, 100, 300, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(2)
    })

    it('handles all items being sticky', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 4, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'all', align: 'start', level: 0, sortedIndices: [0, 1, 2, 3, 4] }]

      const result = computeStickyItems(groups, offsetTree, 250, 500, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(4)
    })

    it('handles variable item sizes', () => {
      const offsetTree = createOffsetTree([
        { startIndex: 0, endIndex: 2, size: 50 },
        { startIndex: 3, endIndex: 5, size: 100 },
        { startIndex: 6, endIndex: 9, size: 50 },
      ])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0, 3, 6] }]

      const result = computeStickyItems(groups, offsetTree, 300, 500, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(3)
      expect(result.stickyStartItems[0]!.size).toBe(100)
    })
  })

  describe('boundary detection', () => {
    it('stops adding sticky items when they would exceed viewport size', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [
        { groupId: 'g1', align: 'start', level: 0, sortedIndices: [0] },
        { groupId: 'g2', align: 'start', level: 1, sortedIndices: [1] },
        { groupId: 'g3', align: 'start', level: 2, sortedIndices: [2] },
      ]

      const result = computeStickyItems(groups, offsetTree, 200, 300, null)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.startStickySize).toBe(50)
    })

    it('adds partial sticky items up to viewport limit', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [
        { groupId: 'g1', align: 'start', level: 0, sortedIndices: [0] },
        { groupId: 'g2', align: 'start', level: 1, sortedIndices: [1] },
        { groupId: 'g3', align: 'start', level: 2, sortedIndices: [2] },
      ]

      const result = computeStickyItems(groups, offsetTree, 200, 350, null)

      expect(result.stickyStartItems).toHaveLength(2)
      expect(result.startStickySize).toBe(100)
    })

    it('respects combined start+end boundary', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [
        { groupId: 'header', align: 'start', level: 0, sortedIndices: [0] },
        { groupId: 'footer', align: 'end', level: 0, sortedIndices: [9] },
        { groupId: 'header2', align: 'start', level: 1, sortedIndices: [1] },
      ]

      const result = computeStickyItems(groups, offsetTree, 100, 200, null)

      expect(result.stickyStartItems.length + result.stickyEndItems.length).toBe(1)
    })
  })

  describe('data handling', () => {
    it('includes data in sticky items', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0, 5] }]
      const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

      const result = computeStickyItems(groups, offsetTree, 300, 500, data)

      expect(result.stickyStartItems[0]!.data).toBe('f')
      expect(result.stickyStartItems[0]!.prevData).toBe('e')
      expect(result.stickyStartItems[0]!.nextData).toBe('g')
    })

    it('handles null prevData for first item', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]
      const data = ['a', 'b', 'c']

      const result = computeStickyItems(groups, offsetTree, 50, 250, data)

      expect(result.stickyStartItems[0]!.data).toBe('a')
      expect(result.stickyStartItems[0]!.prevData).toBeNull()
      expect(result.stickyStartItems[0]!.nextData).toBe('b')
    })
  })
})

describe('itemsWithinOffsets with sticky config', () => {
  it('maintains backward compatibility when no sticky config', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
    const totalSize = 500

    const result = itemsWithinOffsets(state.offsetTree, 0, 200, 10, totalSize, null)

    expect(result.stickyStartItems).toHaveLength(0)
    expect(result.stickyEndItems).toHaveLength(0)
    expect(result.startStickySize).toBe(0)
    expect(result.endStickySize).toBe(0)
    expect(result.items).toHaveLength(4)
  })

  it('returns correct startStickySize sum', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
    const totalSize = 500
    const groups: ProcessedStickyGroup[] = [
      { groupId: 'g1', align: 'start', level: 0, sortedIndices: [0] },
      { groupId: 'g2', align: 'start', level: 1, sortedIndices: [1] },
    ]

    const result = itemsWithinOffsets(state.offsetTree, 200, 500, 10, totalSize, null, groups)

    expect(result.startStickySize).toBe(100)
    expect(result.stickyStartItems).toHaveLength(2)
  })

  it('returns correct endStickySize sum', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
    const totalSize = 500
    const groups: ProcessedStickyGroup[] = [{ groupId: 'footer', align: 'end', level: 0, sortedIndices: [9] }]

    const result = itemsWithinOffsets(state.offsetTree, 0, 200, 10, totalSize, null, groups)

    expect(result.endStickySize).toBe(50)
    expect(result.stickyEndItems).toHaveLength(1)
    expect(result.stickyEndItems[0]!.index).toBe(9)
  })

  it('does not include sticky items in regular items array', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
    const totalSize = 500
    const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

    const result = itemsWithinOffsets(state.offsetTree, 100, 400, 10, totalSize, null, groups)

    const itemIndices = result.items.map((i) => i.index)
    expect(itemIndices).not.toContain(0)
    expect(result.stickyStartItems[0]!.index).toBe(0)
  })

  it('adjusts effective viewport by sticky sizes', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
    const totalSize = 500
    const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

    const resultWithSticky = itemsWithinOffsets(state.offsetTree, 100, 350, 10, totalSize, null, groups)
    const resultWithoutSticky = itemsWithinOffsets(state.offsetTree, 100, 350, 10, totalSize, null)

    expect(resultWithSticky.items).toHaveLength(resultWithoutSticky.items.length - 1)
  })

  it('includes items exactly at adjusted viewport start/end boundaries', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
    const totalSize = 500
    const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

    const result = itemsWithinOffsets(state.offsetTree, 100, 300, 10, totalSize, null, groups)

    const itemIndices = result.items.map((i) => i.index)
    expect(itemIndices).toContain(3)
    expect(itemIndices).not.toContain(6)
  })

  it('paddingStart includes startStickySize', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
    const totalSize = 500
    const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

    const result = itemsWithinOffsets(state.offsetTree, 100, 400, 10, totalSize, null, groups)

    expect(result.paddingStart).toBe(200)
  })

  it('handles multi-group scenarios end-to-end', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 19, size: 50 }])
    const totalSize = 1000
    const groups: ProcessedStickyGroup[] = [
      { groupId: 'country', align: 'start', level: 0, sortedIndices: [0, 10] },
      { groupId: 'city', align: 'start', level: 1, sortedIndices: [1, 5, 11, 15] },
    ]

    const result = itemsWithinOffsets(state.offsetTree, 350, 700, 20, totalSize, null, groups)

    expect(result.stickyStartItems).toHaveLength(2)
    expect(result.stickyStartItems[0]!.index).toBe(0)
    expect(result.stickyStartItems[1]!.index).toBe(5)
    expect(result.startStickySize).toBe(100)
  })

  it('includes sticky items in regular items when in natural viewport position', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
    const totalSize = 500
    const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [5] }]

    const result = itemsWithinOffsets(state.offsetTree, 0, 300, 10, totalSize, null, groups)

    expect(result.stickyStartItems).toHaveLength(0)
    const itemIndices = result.items.map((i) => i.index)
    expect(itemIndices).toContain(5)
  })
})

describe('multi-level sticky group hierarchy consistency', () => {
  // Data layout (mirrors the grouped-data story):
  // 0: North America (level 0)    | 10: Europe (level 0)        | 24: Asia (level 0)
  //   1: USA (level 1)            |   11: UK (level 1)          |   25: Japan (level 1)
  //     2-5: cities               |     12-14: cities           |     26-28: cities
  //   6: Canada (level 1)         |   15: Germany (level 1)     |   29: South Korea (level 1)
  //     7-9: cities               |     16-19: cities           |     30-31: cities
  //                               |   20: France (level 1)      |
  //                               |     21-23: cities           |
  //
  // All items are 40px. Level 0 offsets: 0, 400, 960.
  // Level 1 offsets: 40, 240, 440, 600, 800, 1000, 1160.
  const ITEM_SIZE = 40
  const TOTAL_COUNT = 32
  const LEVEL_0_INDICES = [0, 10, 24]
  const LEVEL_1_INDICES = [1, 6, 11, 15, 20, 25, 29]

  function makeGroups(): ProcessedStickyGroup[] {
    return [
      { groupId: 0, align: 'start', level: 0, sortedIndices: LEVEL_0_INDICES },
      { groupId: 1, align: 'start', level: 1, sortedIndices: LEVEL_1_INDICES },
    ]
  }

  it('level 1 sticky item belongs to the current level 0 group, not a previous one', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: TOTAL_COUNT - 1, size: ITEM_SIZE }])
    const groups = makeGroups()

    // At viewportStart=320, the two-pass estimation causes a mismatch:
    //   First pass picks NA(0) + Canada(6), estimatedSize=80
    //   effectiveThreshold = 320 + 80 = 400
    //   Second pass picks Europe(10, offset 400 <= 400) but Canada(6, offset 240 <= 400)
    //   Canada belongs to North America, not Europe!
    const result = computeStickyItems(groups, offsetTree, 320, 820, null)

    expect(result.stickyStartItems).toHaveLength(2)
    expect(result.stickyStartItems[0]!.index).toBe(0)
    expect(result.stickyStartItems[1]!.index).toBe(6)
    expect(result.stickyStartTops).toStrictEqual([0, 40])
    expect(result.startStickySize).toBe(80)
  })

  it('no gap between sticky headers and first regular item when level 0 transitions', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: TOTAL_COUNT - 1, size: ITEM_SIZE }])
    const totalSize = TOTAL_COUNT * ITEM_SIZE
    const groups = makeGroups()

    // viewportStart=320 triggers the hierarchy mismatch.
    // Europe(10) becomes level 0 sticky, Canada(6) stays as level 1 sticky.
    // Europe's space (offsets 400-440) is excluded from regular items,
    // creating a 40px gap before UK(11) at offset 440.
    const result = itemsWithinOffsets(state.offsetTree, 320, 820, TOTAL_COUNT, totalSize, null, groups)
    expect(result.startStickySize).toBe(80)
    expect(result.items[0]!.index).toBe(10)
    expect(result.items[0]!.offset).toBe(400)
    expect(result.items.at(-1)!.index).toBe(20)
  })

  it('child sticky is pushed up when parent level next group approaches', () => {
    const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: TOTAL_COUNT - 1, size: ITEM_SIZE }])
    const groups = makeGroups()

    // At viewportStart=360 with stickyHeaderHeight=40:
    // Europe (index 10, offset 400) appears at viewport position 80.
    // Bug: Canada (level 1) bottom = 120, hiding Europe behind it.
    // Canada should be pushed up so the stack doesn't cover Europe.
    const result = computeStickyItems(groups, offsetTree, 360, 860, null, 40)

    expect(result.stickyStartItems).toHaveLength(2)
    expect(result.stickyStartItems[0]!.index).toBe(0)
    expect(result.stickyStartItems[1]!.index).toBe(6)
    expect(result.stickyStartTops).toStrictEqual([0, 40])

    const europeViewportPos = 40 + 400 - 360
    const stickyStackBottom = result.stickyStartTops[1]! + result.stickyStartItems[1]!.size

    expect(stickyStackBottom).toBe(europeViewportPos)
  })

  it('approaching level 0 group header is visible as regular item during push-up', () => {
    const state = createSizeState([{ startIndex: 0, endIndex: TOTAL_COUNT - 1, size: ITEM_SIZE }])
    const totalSize = TOTAL_COUNT * ITEM_SIZE
    const groups = makeGroups()

    // At viewportStart=360: effectiveViewportStart = 360 + 80 = 440.
    // Europe (offset 400, end 440) is excluded because 440 <= 440.
    // Europe should be visible - it's the approaching group header, not covered by stickies.
    const result = itemsWithinOffsets(state.offsetTree, 360, 860, TOTAL_COUNT, totalSize, null, groups, undefined, 40)

    const itemIndices = result.items.map((i) => i.index)
    expect(itemIndices).toContain(10)
  })
})

describe('stickyHeaderHeight offset', () => {
  describe('computeStickyItems with stickyHeaderHeight', () => {
    it('stickyHeaderHeight does not affect item selection threshold', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

      const withoutHeader = computeStickyItems(groups, offsetTree, 0, 200, null, 0)
      expect(withoutHeader.stickyStartItems).toHaveLength(1)
      expect(withoutHeader.stickyStartItems[0]!.index).toBe(0)

      const withHeader = computeStickyItems(groups, offsetTree, 0, 200, null, 40)
      expect(withHeader.stickyStartItems).toHaveLength(1)
      expect(withHeader.stickyStartItems[0]!.index).toBe(0)
    })

    it('stickyHeaderHeight affects computed stickyStartTops', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

      const withoutHeader = computeStickyItems(groups, offsetTree, 100, 300, null, 0)
      expect(withoutHeader.stickyStartTops[0]).toBe(0)

      const withHeader = computeStickyItems(groups, offsetTree, 100, 300, null, 40)
      expect(withHeader.stickyStartTops[0]).toBe(40)
    })

    it('does not affect end-aligned sticky items', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 9, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'footer', align: 'end', level: 0, sortedIndices: [9] }]

      const withHeader = computeStickyItems(groups, offsetTree, 0, 200, null, 40)
      const withoutHeader = computeStickyItems(groups, offsetTree, 0, 200, null, 0)

      expect(withHeader.stickyEndItems).toHaveLength(withoutHeader.stickyEndItems.length)
    })

    it('selects same sticky item regardless of stickyHeaderHeight', () => {
      const offsetTree = createOffsetTree([{ startIndex: 0, endIndex: 19, size: 50 }])
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0, 5, 10, 15] }]

      const withoutHeader = computeStickyItems(groups, offsetTree, 250, 450, null, 0)
      expect(withoutHeader.stickyStartItems[0]!.index).toBe(5)

      const withHeader = computeStickyItems(groups, offsetTree, 250, 450, null, 40)
      expect(withHeader.stickyStartItems[0]!.index).toBe(5)
    })
  })

  describe('itemsWithinOffsets with stickyHeaderHeight', () => {
    it('excludes sticky items from regular items at viewportStart 0', () => {
      const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
      const totalSize = 500
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

      const result = itemsWithinOffsets(state.offsetTree, 0, 300, 10, totalSize, null, groups, undefined, 40)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(0)
      const itemIndices = result.items.map((i) => i.index)
      expect(itemIndices).not.toContain(0)
    })

    it('item at viewportStart 0 is sticky even with stickyHeaderHeight 0', () => {
      const state = createSizeState([{ startIndex: 0, endIndex: 9, size: 50 }])
      const totalSize = 500
      const groups: ProcessedStickyGroup[] = [{ groupId: 'header', align: 'start', level: 0, sortedIndices: [0] }]

      const result = itemsWithinOffsets(state.offsetTree, 0, 300, 10, totalSize, null, groups, undefined, 0)

      expect(result.stickyStartItems).toHaveLength(1)
      expect(result.stickyStartItems[0]!.index).toBe(0)
    })
  })
})
