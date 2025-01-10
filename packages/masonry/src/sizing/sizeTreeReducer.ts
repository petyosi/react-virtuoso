import type { SizeRange } from '../interfaces'
import { type AANode, empty, insert, newTree } from './AATree'
import { insertRanges } from './insertRanges'

export const SIZE_TREE_SEED = [newTree(), 0] as [AANode, number]
export function sizeTreeReducer(currentTree: AANode, [ranges, groupIndices]: [SizeRange[], number[]]) {
  // We receive probe item results from a group probe,
  // which should always pass an item and a group
  // the results contain two ranges, which we consider to mean that groups and items have different heights
  if (groupIndices.length > 0 && empty(currentTree) && ranges.length === 2) {
    const groupSize = ranges[0].size
    const itemSize = ranges[1].size

    return [
      groupIndices.reduce((tree, groupIndex) => {
        return insert(insert(tree, groupIndex, groupSize), groupIndex + 1, itemSize)
      }, newTree()),
      0,
    ] as [AANode, number]
  }
  return insertRanges(currentTree, ranges)
}
