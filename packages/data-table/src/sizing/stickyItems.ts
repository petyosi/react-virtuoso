import { itemOffsetAndSize } from './offsetOf'

import type { DataArray, Item } from '../interfaces'
import type { OffsetBreakpoint } from './SizeState'

export interface StickyItemSpec {
  index: number
  align: 'start' | 'end'
  groupId: string | number
}

export interface StickyItemsConfig {
  items: StickyItemSpec[]
  groupLevels?: (string | number)[]
}

export interface ProcessedStickyGroup {
  groupId: string | number
  align: 'start' | 'end'
  level: number
  sortedIndices: number[]
}

interface StickyResult {
  stickyStartItems: Item<unknown>[]
  stickyStartTops: number[]
  stickyEndItems: Item<unknown>[]
  startStickySize: number
  endStickySize: number
  excludedIndices: Set<number>
}

export const EMPTY_STICKY_RESULT: StickyResult = {
  stickyStartItems: [],
  stickyStartTops: [],
  stickyEndItems: [],
  startStickySize: 0,
  endStickySize: 0,
  excludedIndices: new Set(),
}

/**
 * For a sorted array of sticky indices, find the one whose offset is
 * closest to (but not exceeding) the target offset.
 * Returns -1 if no valid index found.
 */
export function findStickyStartIndex(indices: number[], targetOffset: number, offsetTree: OffsetBreakpoint[]): number {
  if (indices.length === 0) {
    return -1
  }

  let start = 0
  let end = indices.length - 1
  let result = -1

  while (start <= end) {
    const mid = Math.floor((start + end) / 2)
    const index = indices[mid]!
    const [offset] = itemOffsetAndSize(index, offsetTree)

    if (offset <= targetOffset) {
      result = index
      start = mid + 1
    } else {
      end = mid - 1
    }
  }

  return result
}

/**
 * For a sorted array of sticky indices, find the one whose end position
 * (offset + size) is closest to (but greater than) the target offset.
 * Returns -1 if no valid index found.
 */
export function findStickyEndIndex(indices: number[], targetOffset: number, offsetTree: OffsetBreakpoint[]): number {
  if (indices.length === 0) {
    return -1
  }

  let start = 0
  let end = indices.length - 1
  let result = -1

  while (start <= end) {
    const mid = Math.floor((start + end) / 2)
    const index = indices[mid]!
    const [offset, size] = itemOffsetAndSize(index, offsetTree)
    const itemEnd = offset + size

    if (itemEnd > targetOffset) {
      result = index
      end = mid - 1
    } else {
      start = mid + 1
    }
  }

  return result
}

/**
 * Pre-process sticky config into sorted index arrays per group.
 * This allows efficient binary search during scroll.
 */
export function processStickyConfig(config: StickyItemsConfig): ProcessedStickyGroup[] {
  const { items, groupLevels = [] } = config

  const levelMap = new Map<string | number, number>()
  groupLevels.forEach((groupId, index) => levelMap.set(groupId, index))

  const defaultLevel = groupLevels.length

  const groupMap = new Map<
    string,
    {
      groupId: string | number
      align: 'start' | 'end'
      level: number
      indices: number[]
    }
  >()

  for (const spec of items) {
    const key = `${spec.groupId}-${spec.align}`
    const existing = groupMap.get(key)
    if (existing) {
      existing.indices.push(spec.index)
    } else {
      const level = levelMap.get(spec.groupId) ?? defaultLevel
      groupMap.set(key, { groupId: spec.groupId, align: spec.align, level, indices: [spec.index] })
    }
  }

  return [...groupMap.values()]
    .map(({ groupId, align, level, indices }) => ({
      groupId,
      align,
      level,
      sortedIndices: indices.toSorted((a, b) => a - b),
    }))
    .toSorted((a, b) => a.level - b.level)
}

function findNextIndexInSortedArray(indices: number[], target: number): number | undefined {
  let lo = 0
  let hi = indices.length - 1
  let pos = -1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (indices[mid] === target) {
      pos = mid
      break
    }
    if (indices[mid]! < target) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return pos === -1 ? undefined : indices[pos + 1]
}

export function computeStickyItems(
  processedGroups: ProcessedStickyGroup[],
  offsetTree: OffsetBreakpoint[],
  viewportStart: number,
  viewportEnd: number,
  data: DataArray | null,
  stickyHeaderHeight = 0
): StickyResult {
  if (processedGroups.length === 0) {
    return EMPTY_STICKY_RESULT
  }

  const viewportSize = viewportEnd - viewportStart

  const stickyStartItems: Item<unknown>[] = []
  const stickyStartTops: number[] = []
  const stickyStartNextOffsets: (number | undefined)[] = []
  const stickyEndItems: Item<unknown>[] = []
  const excludedIndices = new Set<number>()
  let startStickySize = 0
  let endStickySize = 0
  let cumulativeThreshold = viewportStart

  for (const group of processedGroups) {
    const foundIndex =
      group.align === 'start'
        ? findStickyStartIndex(group.sortedIndices, cumulativeThreshold, offsetTree)
        : findStickyEndIndex(group.sortedIndices, viewportEnd, offsetTree)

    if (foundIndex !== -1) {
      const [offset, size] = itemOffsetAndSize(foundIndex, offsetTree)

      if (startStickySize + endStickySize + size >= viewportSize) {
        continue
      }

      const item: Item<unknown> = {
        index: foundIndex,
        offset,
        size,
        data: data?.[foundIndex],
        prevData: data?.[foundIndex - 1] ?? null,
        nextData: data?.[foundIndex + 1] ?? null,
      }

      if (group.align === 'start') {
        stickyStartItems.push(item)
        startStickySize += size
        cumulativeThreshold += size

        const nextIndex = findNextIndexInSortedArray(group.sortedIndices, foundIndex)
        if (nextIndex === undefined) {
          stickyStartNextOffsets.push(undefined)
        } else {
          const [nextOff] = itemOffsetAndSize(nextIndex, offsetTree)
          stickyStartNextOffsets.push(nextOff)
        }
      } else {
        stickyEndItems.push(item)
        endStickySize += size
      }
      excludedIndices.add(foundIndex)
    }
  }

  // When a parent level's next group approaches, it must push the entire child
  // stack above it. Compute each item's max top accounting for all items below.
  const N = stickyStartItems.length
  const maxTop: number[] = Array.from({ length: N })

  for (let i = N - 1; i >= 0; i--) {
    const nextOffset = stickyStartNextOffsets[i]
    if (nextOffset === undefined) {
      maxTop[i] = Infinity
    } else {
      const nextViewportPos = stickyHeaderHeight + nextOffset - viewportStart
      let sizeFromHere = 0
      for (let j = i; j < N; j++) {
        sizeFromHere += stickyStartItems[j]!.size
      }
      maxTop[i] = nextViewportPos - sizeFromHere
    }
  }

  let cumulativeTop = stickyHeaderHeight
  for (let i = 0; i < N; i++) {
    const top = Math.min(cumulativeTop, maxTop[i]!)
    stickyStartTops.push(top)
    cumulativeTop = top + stickyStartItems[i]!.size
  }

  const result = {
    stickyStartItems,
    stickyStartTops,
    stickyEndItems,
    startStickySize,
    endStickySize,
    excludedIndices,
  }
  return result
}
