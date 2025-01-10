import type { OffsetPoint } from '../interfaces'
import { type AANode, findMaxKeyValue, rangesWithin } from './AATree'
import { findIndexOfClosestSmallerOrEqual } from './binaryArraySearch'
import { indexComparator } from './rangesWithinOffsets'

export const OFFSET_TREE_SEED = [[], 0, 0, 0] as [OffsetPoint[], number, number, number]
export function offsetTreeReducer(offsetTree: OffsetPoint[], [sizeTree, lastRangeStart]: [AANode, number]) {
  let prevIndex = 0
  let prevHeight = 0

  let prevOffset = 0
  let startAtIndex = 0

  if (lastRangeStart !== 0) {
    startAtIndex = findIndexOfClosestSmallerOrEqual(offsetTree, lastRangeStart - 1, indexComparator)
    const offsetInfo = offsetTree[startAtIndex]
    prevOffset = offsetInfo.offset
    const kv = findMaxKeyValue(sizeTree, lastRangeStart - 1)
    if (kv[1] === undefined) {
      throw new Error('Invariant violation')
    }
    prevIndex = kv[0]
    prevHeight = kv[1]

    if (offsetTree.length && offsetTree[startAtIndex].height === findMaxKeyValue(sizeTree, lastRangeStart)[1]) {
      startAtIndex -= 1
    }

    offsetTree = offsetTree.slice(0, startAtIndex + 1)
  } else {
    offsetTree = []
  }

  for (const { start: index, value: height } of rangesWithin(sizeTree, lastRangeStart, Number.POSITIVE_INFINITY)) {
    const offset = (index - prevIndex) * prevHeight + prevOffset
    offsetTree.push({ height, index, offset })
    prevIndex = index
    prevOffset = offset
    prevHeight = height
  }

  return [offsetTree, prevHeight, prevOffset, prevIndex] as typeof OFFSET_TREE_SEED
}
