import { itemOffsetAndSize } from './offsetOf'
import { rangesWithinOffsets } from './rangesWithinOffsets'
import { computeStickyItems, EMPTY_STICKY_RESULT } from './stickyItems'

import type { DataArray, Item } from '../interfaces'
import type { OffsetBreakpoint } from './SizeState'
import type { ProcessedStickyGroup } from './stickyItems'

interface VisibleItemsResult {
  items: Item<unknown>[]
  stickyStartItems: Item<unknown>[]
  stickyStartTops: number[]
  stickyEndItems: Item<unknown>[]
  startStickySize: number
  endStickySize: number
  listStart: number
  listEnd: number
  paddingStart: number
  paddingEnd: number
}

export interface ExcludeIndicesInfo {
  indices: Set<number>
  totalExcludedSize: number
}

export function itemsWithinOffsets(
  offsetTree: OffsetBreakpoint[],
  viewportStart: number,
  viewportEnd: number,
  totalCount: number,
  totalSize: number,
  data: DataArray | null,
  stickyGroups?: ProcessedStickyGroup[],
  excludeIndicesInfo?: ExcludeIndicesInfo,
  stickyHeaderHeight = 0
): VisibleItemsResult {
  const stickyResult =
    stickyGroups && stickyGroups.length > 0
      ? computeStickyItems(stickyGroups, offsetTree, viewportStart, viewportEnd, data, stickyHeaderHeight)
      : EMPTY_STICKY_RESULT

  const lastStickyStartIdx = stickyResult.stickyStartItems.length - 1
  const visualStartStickySize =
    lastStickyStartIdx >= 0
      ? stickyResult.stickyStartTops[lastStickyStartIdx]! + stickyResult.stickyStartItems[lastStickyStartIdx]!.size - stickyHeaderHeight
      : 0
  const effectiveViewportStart = viewportStart + visualStartStickySize
  const effectiveViewportEnd = viewportEnd - stickyResult.endStickySize

  const excludeIndices = excludeIndicesInfo?.indices ?? new Set<number>()
  const totalExcludedSize = excludeIndicesInfo?.totalExcludedSize ?? 0
  const effectiveTotalSize = totalSize - totalExcludedSize

  // Precompute cumulative excluded sizes sorted by index so the main loop
  // can look up the value with a forward-advancing pointer (O(1) amortized)
  // instead of re-scanning all excluded indices per visible item (O(k)).
  const sortedExcludedIndices: number[] = []
  const cumulativeExcludedSizes: number[] = []
  if (excludeIndices.size > 0) {
    for (const idx of excludeIndices) {
      sortedExcludedIndices.push(idx)
    }
    sortedExcludedIndices.sort((a, b) => a - b)
    let cumSize = 0
    for (const idx of sortedExcludedIndices) {
      const [, s] = itemOffsetAndSize(idx, offsetTree)
      cumSize += s
      cumulativeExcludedSizes.push(cumSize)
    }
  }

  // When items are excluded, we need to map between "virtual" offsets (without excluded items)
  // and "real" offsets (in the tree). The viewport is in virtual space, so we need to
  // expand the query range to account for excluded items that might appear within the range.
  // We query a larger range from the tree and then filter by virtual offset.
  const treeViewportStart = Math.max(0, effectiveViewportStart - totalExcludedSize)
  const treeViewportEnd = effectiveViewportEnd + totalExcludedSize

  const items: Item<unknown>[] = []
  const maxIndex = totalCount - 1
  const minStartIndex = 0
  const offsetPointRanges = rangesWithinOffsets(offsetTree, treeViewportStart, treeViewportEnd, minStartIndex)

  let listEnd = 0
  let listStart = 0
  let firstItemFound = false
  let excludePtr = 0
  let runningExcludedSize = 0

  for (const range of offsetPointRanges) {
    const {
      value: { offset, size },
    } = range
    let rangeStartIndex = range.start

    listEnd = offset

    if (offset < treeViewportStart) {
      rangeStartIndex += Math.floor((treeViewportStart - offset) / size)
      listEnd += (rangeStartIndex - range.start) * size
    }

    if (rangeStartIndex < minStartIndex) {
      listEnd += (minStartIndex - rangeStartIndex) * size
      rangeStartIndex = minStartIndex
    }

    const endIndex = Math.min(range.end, maxIndex)

    for (let i = rangeStartIndex; i <= endIndex; i++) {
      // Skip excluded indices - they're rendered separately (e.g., sticky columns)
      // We still advance listEnd to track the real offset position in the tree
      if (excludeIndices.has(i)) {
        listEnd += size
        continue
      }

      // Advance pointer past excluded indices before this item
      while (excludePtr < sortedExcludedIndices.length && sortedExcludedIndices[excludePtr]! < i) {
        runningExcludedSize = cumulativeExcludedSizes[excludePtr]!
        excludePtr++
      }
      const virtualOffset = listEnd - runningExcludedSize

      // Check visibility against the virtual viewport (without excluded items)
      if (virtualOffset >= effectiveViewportEnd) {
        break
      }

      // Skip items whose virtual offset is before the visible range
      if (virtualOffset + size <= effectiveViewportStart) {
        listEnd += size
        continue
      }

      if (stickyResult.excludedIndices.has(i)) {
        listEnd += size
        continue
      }

      const item: Item<unknown> = {
        data: data?.[i],
        prevData: data?.[i - 1] ?? null,
        nextData: data?.[i + 1] ?? null,
        size,
        index: i,
        offset: virtualOffset,
      }

      if (!firstItemFound) {
        firstItemFound = true
        listStart = virtualOffset
      }

      items.push(item)
      listEnd += size
    }
  }

  if (items.length === 0) {
    listStart = 0
    listEnd = 0
  }

  // Calculate padding based on virtual offsets (without excluded items)
  const lastItem = items.at(-1)
  const virtualListEnd = lastItem ? lastItem.offset + lastItem.size : 0
  const paddingEnd = effectiveTotalSize - virtualListEnd + stickyResult.endStickySize
  const paddingStart = (items[0]?.offset ?? 0) + stickyResult.startStickySize

  return {
    items,
    stickyStartItems: stickyResult.stickyStartItems,
    stickyStartTops: stickyResult.stickyStartTops,
    stickyEndItems: stickyResult.stickyEndItems,
    startStickySize: stickyResult.startStickySize,
    endStickySize: stickyResult.endStickySize,
    listStart,
    listEnd: virtualListEnd,
    paddingStart,
    paddingEnd,
  }
}
