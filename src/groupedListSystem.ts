import * as u from './urx'

import { findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { sizeSystem, hasGroups } from './sizeSystem'
export interface GroupIndexesAndCount {
  totalCount: number
  groupIndices: number[]
}

function reduceGroup(level: number, acc: GroupIndexesAndCount, count: number | number[]): GroupIndexesAndCount {
  acc.groupIndices.push(acc.totalCount + level)
  if (!Array.isArray(count)) {
    acc.totalCount += count + 1
  } else {
    count.reduce(reduceGroup.bind(null, level + 1), acc)
    acc.totalCount += 1
  }
  return acc
}

export function groupCountsToIndicesAndCount(counts: number[]) {
  const r = counts.reduce(reduceGroup.bind(null, 0), {
    totalCount: 0,
    groupIndices: [],
  } as GroupIndexesAndCount)

  return r
}

export const groupedListSystem = u.system(([{ totalCount, groupIndices, sizes }, { scrollTop, headerHeight }]) => {
  const groupCounts = u.stream<number[]>()
  const topItemsIndexes = u.stream<[number]>()
  const groupIndicesAndCount = u.streamFromEmitter(u.pipe(groupCounts, u.map(groupCountsToIndicesAndCount)))

  u.connect(
    u.pipe(
      groupIndicesAndCount,
      u.map((value) => value.totalCount)
    ),
    totalCount
  )
  u.connect(
    u.pipe(
      groupIndicesAndCount,
      u.map((value) => value.groupIndices)
    ),
    groupIndices
  )

  u.connect(
    u.pipe(
      u.combineLatest(scrollTop, sizes, headerHeight),
      u.filter(([_, sizes]) => hasGroups(sizes)),
      u.map(([scrollTop, state, headerHeight]) => findMaxKeyValue(state.groupOffsetTree, Math.max(scrollTop - headerHeight, 0), 'v')[0]),
      u.distinctUntilChanged(),
      u.map((index) => [index])
    ),
    topItemsIndexes
  )

  return { groupCounts, topItemsIndexes }
}, u.tup(sizeSystem, domIOSystem))
