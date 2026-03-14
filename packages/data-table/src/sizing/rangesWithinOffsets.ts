import { arrayToRanges } from './AATree'
import * as arrayBinarySearch from './binaryArraySearch'

import type { OffsetBreakpoint } from './SizeState'

export function indexComparator({ index: itemIndex }: { index: number }, index: number) {
  return index === itemIndex ? 0 : index < itemIndex ? -1 : 1
}

export function offsetComparator({ offset: itemOffset }: OffsetBreakpoint, offset: number) {
  return offset === itemOffset ? 0 : offset < itemOffset ? -1 : 1
}

function offsetPointParser(point: OffsetBreakpoint) {
  return { index: point.index, value: point }
}

export function rangesWithinOffsets(
  tree: OffsetBreakpoint[],
  startOffset: number,
  endOffset: number,
  minStartIndex = 0
): {
  start: number
  end: number
  value: OffsetBreakpoint
}[] {
  if (minStartIndex > 0) {
    startOffset = Math.max(startOffset, arrayBinarySearch.findClosestSmallerOrEqual(tree, minStartIndex, indexComparator).offset)
  }

  startOffset = Math.max(0, startOffset)

  return arrayToRanges(arrayBinarySearch.findRange(tree, startOffset, endOffset, offsetComparator), offsetPointParser)
}
