import type { SizeRange } from '../interfaces'
import { type AANode, type Range, empty, insert, rangesWithin, remove } from './AATree'

function rangeIncludes(refRange: SizeRange) {
  const { size, startIndex, endIndex } = refRange
  return (range: Range) => {
    return range.start === startIndex && (range.end === endIndex || range.end === Number.POSITIVE_INFINITY) && range.value === size
  }
}

export function insertRanges(sizeTree: AANode, ranges: SizeRange[]) {
  let firstChangedIndex = empty(sizeTree) ? 0 : Number.POSITIVE_INFINITY

  for (const range of ranges) {
    const { size, startIndex, endIndex } = range
    firstChangedIndex = Math.min(firstChangedIndex, startIndex)

    if (empty(sizeTree)) {
      sizeTree = insert(sizeTree, 0, size)
      continue
    }

    // extend the range in both directions, so that we can get adjacent neighbours.
    // if the previous / next ones have the same value as the one we are about to insert,
    // we 'merge' them.
    const overlappingRanges = rangesWithin(sizeTree, startIndex - 1, endIndex + 1)

    if (overlappingRanges.some(rangeIncludes(range))) {
      continue
    }

    let firstPassDone = false
    let shouldInsert = false
    for (const { start: rangeStart, end: rangeEnd, value: rangeValue } of overlappingRanges) {
      // previous range
      if (!firstPassDone) {
        shouldInsert = rangeValue !== size
        firstPassDone = true
      } else {
        // remove the range if it starts within the new range OR if
        // it has the same value as it, in order to perform a merge
        if (endIndex >= rangeStart || size === rangeValue) {
          sizeTree = remove(sizeTree, rangeStart)
        }
      }

      // next range
      if (rangeEnd > endIndex && endIndex >= rangeStart) {
        if (rangeValue !== size) {
          sizeTree = insert(sizeTree, endIndex + 1, rangeValue)
        }
      }
    }

    if (shouldInsert) {
      sizeTree = insert(sizeTree, startIndex, size)
    }
  }
  return [sizeTree, firstChangedIndex] as [AANode, number]
}
