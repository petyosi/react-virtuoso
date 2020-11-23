import { system, combineLatest, statefulStream, connect, pipe, filter, withLatestFrom, map, tup } from '@virtuoso.dev/urx'
import { listStateSystem, buildListState } from './listStateSystem'
import { sizeSystem } from './sizeSystem'
import { propsReadySystem } from './propsReadySystem'

export const initialItemCountSystem = system(
  ([{ sizes, firstItemIndex }, { listState }, { propsReady }]) => {
    const initialItemCount = statefulStream(0)

    connect(
      pipe(
        combineLatest(initialItemCount, propsReady),
        filter(([count, ready]) => ready && count !== 0),
        withLatestFrom(sizes, firstItemIndex),
        map(([[count], sizes, firstItemIndex]) => {
          let includedGroupsCount = 0
          if (sizes.groupIndices.length > 0) {
            for (let index of sizes.groupIndices) {
              if (index - includedGroupsCount >= count) {
                break
              }
              includedGroupsCount++
            }
          }
          const adjustedCount = count + includedGroupsCount
          const items = Array.from({ length: adjustedCount }).map((_, index) => ({ index, size: 0, offset: 0 }))
          return buildListState(items, [], adjustedCount, sizes, firstItemIndex)
        })
      ),
      listState
    )

    return { initialItemCount }
  },
  tup(sizeSystem, listStateSystem, propsReadySystem),
  { singleton: true }
)
