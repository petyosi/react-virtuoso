import { findMaxKeyValue, newTree, rangesWithin } from './AATree'
import { findIndexOfClosestSmallerOrEqual } from './binaryArraySearch'
import { insertRanges } from './insertRanges'
import { indexComparator } from './rangesWithinOffsets'

import type { SizeRange } from '../interfaces'
import type { AANode } from './AATree'

export interface OffsetBreakpoint {
  offset: number
  size: number
  index: number
}

export interface SizeState {
  sizeTree: AANode
  offsetTree: OffsetBreakpoint[]
  lastIndex: number
  lastSize: number
  lastOffset: number
  hasSyntheticTail: boolean
  sizeFrequency: Map<number, number>
}

export const EMPTY_SIZE_STATE: SizeState = {
  sizeTree: newTree(),
  offsetTree: [],
  lastIndex: 0,
  lastSize: 0,
  lastOffset: 0,
  hasSyntheticTail: false,
  sizeFrequency: new Map(),
}

export function updateSizeState(current: SizeState, sizeRanges: SizeRange[], groupIndices?: Set<number>): SizeState {
  const [newSizeTree, lastRangeStart] = insertRanges(current.sizeTree, sizeRanges, groupIndices)

  if (newSizeTree === current.sizeTree) {
    return current
  }

  // Strip synthetic tail before operating on offset tree
  let currentOffsetTree = current.offsetTree
  if (current.hasSyntheticTail && currentOffsetTree.length > 0) {
    currentOffsetTree = currentOffsetTree.slice(0, -1)
  }

  let prevIndex = 0
  let prevSize = 0

  let prevOffset = 0
  let startAtIndex = 0

  let newOffsetTree: OffsetBreakpoint[] = []

  if (lastRangeStart === 0) {
    newOffsetTree = []
  } else {
    startAtIndex = findIndexOfClosestSmallerOrEqual(currentOffsetTree, lastRangeStart - 1, indexComparator)
    const offsetInfo = currentOffsetTree[startAtIndex]!
    prevOffset = offsetInfo.offset

    ;[prevIndex, prevSize] = findMaxKeyValue(newSizeTree, lastRangeStart - 1) as [number, number]

    if (currentOffsetTree.length > 0 && currentOffsetTree[startAtIndex]!.size === findMaxKeyValue(newSizeTree, lastRangeStart)[1]) {
      startAtIndex -= 1
    }

    newOffsetTree = currentOffsetTree.slice(0, startAtIndex + 1)
  }

  for (const { start: index, value: size } of rangesWithin(newSizeTree, lastRangeStart, Number.POSITIVE_INFINITY)) {
    const offset = (index - prevIndex) * prevSize + prevOffset
    newOffsetTree.push({ size, index, offset })
    prevIndex = index
    prevOffset = offset
    prevSize = size
  }

  // Build frequency map from the complete offset tree
  const freqMap = new Map<number, number>()
  for (let i = 0; i < newOffsetTree.length; i++) {
    const entry = newOffsetTree[i]!
    const nextIndex = i + 1 < newOffsetTree.length ? newOffsetTree[i + 1]!.index : entry.index + 1
    const span = nextIndex - entry.index
    freqMap.set(entry.size, (freqMap.get(entry.size) ?? 0) + span)
  }

  // Append synthetic tail if mode differs from last breakpoint's size.
  // Skip when group indices are present — group headers have variable sizes
  // that distort the mode, especially early when few items are measured.
  let hasSyntheticTail = false
  if (freqMap.size >= 2 && (!groupIndices || groupIndices.size === 0)) {
    let modeSize = prevSize
    let modeCount = 0
    for (const [size, count] of freqMap) {
      if (count > modeCount) {
        modeCount = count
        modeSize = size
      }
    }

    if (modeSize !== prevSize) {
      const syntheticOffset = prevOffset + prevSize
      const syntheticIndex = prevIndex + 1
      newOffsetTree.push({ size: modeSize, index: syntheticIndex, offset: syntheticOffset })
      prevIndex = syntheticIndex
      prevOffset = syntheticOffset
      prevSize = modeSize
      hasSyntheticTail = true
    }
  }

  return {
    sizeTree: newSizeTree,
    offsetTree: newOffsetTree,
    lastIndex: prevIndex,
    lastSize: prevSize,
    lastOffset: prevOffset,
    hasSyntheticTail,
    sizeFrequency: freqMap,
  }
}
