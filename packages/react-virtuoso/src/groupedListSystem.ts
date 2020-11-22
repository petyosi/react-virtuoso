import {
  combineLatest,
  connect,
  distinctUntilChanged,
  system,
  filter,
  map,
  pipe,
  prop,
  stream,
  streamFromEmitter,
  tup,
} from '@virtuoso.dev/urx'
import { empty, findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { sizeSystem } from './sizeSystem'
export interface GroupIndexesAndCount {
  totalCount: number
  groupIndices: number[]
}

export function groupCountsToIndicesAndCount(counts: number[]) {
  return counts.reduce(
    (acc, groupCount) => {
      acc.groupIndices.push(acc.totalCount)
      acc.totalCount += groupCount + 1
      return acc
    },
    {
      totalCount: 0,
      groupIndices: [],
    } as GroupIndexesAndCount
  )
}

export const groupedListSystem = system(([{ totalCount, groupIndices, sizes }, { scrollTop }]) => {
  const groupCounts = stream<number[]>()
  const topItemsIndexes = stream<[number]>()
  const groupIndicesAndCount = streamFromEmitter(pipe(groupCounts, map(groupCountsToIndicesAndCount)))
  connect(pipe(groupIndicesAndCount, map(prop('totalCount'))), totalCount)
  connect(pipe(groupIndicesAndCount, map(prop('groupIndices'))), groupIndices)

  connect(
    pipe(
      combineLatest(scrollTop, sizes),
      filter(([_, state]) => !empty(state.groupOffsetTree)),
      map(([scrollTop, state]) => findMaxKeyValue(state.groupOffsetTree, scrollTop, 'v')[0]),
      distinctUntilChanged(),
      map(index => [index])
    ),
    topItemsIndexes
  )

  return { groupCounts, topItemsIndexes }
}, tup(sizeSystem, domIOSystem))
