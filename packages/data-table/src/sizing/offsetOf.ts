import { findClosestSmallerOrEqual } from './binaryArraySearch'
import { indexComparator } from './rangesWithinOffsets'

import type { OffsetBreakpoint, SizeState } from './SizeState'

export function itemOffsetAndSize(index: number, offsetTree: OffsetBreakpoint[]): [number, number] {
  if (offsetTree.length === 0) {
    return [0, 0]
  }

  const match = findClosestSmallerOrEqual(offsetTree, index, indexComparator)
  if (match === undefined) {
    return [0, 0]
  }
  const { offset, index: startIndex, size } = match
  return [size * (index - startIndex) + offset, size]
}

export function offsetOf(index: number, offsetTree: OffsetBreakpoint[]) {
  return itemOffsetAndSize(index, offsetTree)[0]
}

export function computeTotalSize(count: number, { lastIndex, lastOffset, lastSize, offsetTree }: SizeState): number {
  if (count > 0 && lastIndex >= count) {
    const [offset, size] = itemOffsetAndSize(count - 1, offsetTree)
    return offset + size
  }
  return lastOffset + (count - lastIndex) * lastSize
}
