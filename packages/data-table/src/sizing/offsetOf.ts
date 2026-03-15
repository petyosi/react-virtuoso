import { findClosestSmallerOrEqual } from './binaryArraySearch'
import { indexComparator } from './rangesWithinOffsets'

import type { OffsetBreakpoint } from './SizeState'

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
