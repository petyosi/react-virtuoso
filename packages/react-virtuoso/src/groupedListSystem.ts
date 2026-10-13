import { empty, findMaxKeyValue } from './AATree'
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
  ([{ groupIndices, resetSizes, sizeRanges, sizes, statefulTotalCount, totalCount, trackItemSizes }, { headerHeight, scrollTop }]) => {
    const groupCounts = u.stream<number[]>()
    const topItemsIndexes = u.stream<[number]>()
    const groupIndicesAndCount = u.streamFromEmitter(u.pipe(groupCounts, u.map(groupCountsToIndicesAndCount)))

    // a measurement while the groups have items puts an item size in the size tree
    const itemSizeMeasured = u.statefulStreamFromEmitter(
      u.pipe(
        sizeRanges,
        u.withLatestFrom(statefulTotalCount, groupIndices),
        u.filter(([, count, indices]) => count > indices.length),
        u.mapTo(true)
      ),
      false
    )

    // When all groups are empty and no item was measured yet, the size tree knows only the group header size, so reset it when items arrive.
    // This runs before the new total count and groups are published, so that the list never renders items with the header size.
    // The reset keeps the current groups - the new ones follow as with any other group change.
    // Resetting with the new groups would pair them with the old total count and report a false endReached.
    // Fixed item sizes are not measured, so they keep their sizes.
    u.connect(
      u.pipe(
        groupIndicesAndCount,
        u.scan(([, prev], next): [GroupIndexesAndCount, GroupIndexesAndCount] => [prev, next], [
          { groupIndices: [], totalCount: 0 },
          { groupIndices: [], totalCount: 0 },
        ] as [GroupIndexesAndCount, GroupIndexesAndCount]),
        u.withLatestFrom(sizes, trackItemSizes, itemSizeMeasured),
        u.filter(([[prev, next], { sizeTree }, track, measured]) => {
          const prevWasEmpty = prev.groupIndices.length > 0 && prev.totalCount === prev.groupIndices.length
          const nextHasItems = next.totalCount > next.groupIndices.length
          return track && !measured && prevWasEmpty && nextHasItems && !empty(sizeTree)
        }),
        u.mapTo(null)
      ),
      resetSizes
    )

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
