import * as u from '@virtuoso.dev/urx'
import { listStateSystem, buildListState } from './listStateSystem'
import { sizeSystem } from './sizeSystem'
import { propsReadySystem } from './propsReadySystem'

export const initialItemCountSystem = u.system(
  ([{ sizes, firstItemIndex, data, gap }, { listState }, { didMount }]) => {
    const initialItemCount = u.statefulStream(0)

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialItemCount),
        u.filter(([, count]) => count !== 0),
        u.withLatestFrom(sizes, firstItemIndex, gap, data),
        u.map(([[, count], sizes, firstItemIndex, gap, data = []]) => {
          let includedGroupsCount = 0
          if (sizes.groupIndices.length > 0) {
            for (const index of sizes.groupIndices) {
              if (index - includedGroupsCount >= count) {
                break
              }
              includedGroupsCount++
            }
          }
          const adjustedCount = count + includedGroupsCount
          const items = Array.from({ length: adjustedCount }).map((_, index) => ({ index, size: 0, offset: 0, data: data[index] }))
          return buildListState(items, [], adjustedCount, gap, sizes, firstItemIndex)
        })
      ),
      listState
    )

    return { initialItemCount }
  },
  u.tup(sizeSystem, listStateSystem, propsReadySystem),
  { singleton: true }
)
