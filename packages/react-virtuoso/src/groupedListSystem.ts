import { findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { hasGroups, sizeSystem } from './sizeSystem'
import * as u from './urx'
export interface GroupIndexesAndCount {
  groupIndices: number[]
  totalCount: number
}

export function groupCountsToIndicesAndCount(counts: number[]) {
  return counts.reduce<GroupIndexesAndCount>(
    (acc, groupCount) => {
      acc.groupIndices.push(acc.totalCount)
      acc.totalCount += groupCount + 1
      return acc
    },
    {
      groupIndices: [],
      totalCount: 0,
    }
  )
}

export const groupedListSystem = u.system(
  ([{ groupIndices, sizes, totalCount }, { headerHeight, scrollTop }]) => {
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
  },
  u.tup(sizeSystem, domIOSystem)
)
