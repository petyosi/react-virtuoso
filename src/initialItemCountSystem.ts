import * as u from './urx'
import { listStateSystem, buildListState } from './listStateSystem'
import { sizeSystem } from './sizeSystem'
import { propsReadySystem } from './propsReadySystem'
import { getInitialTopMostItemIndexNumber, initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'

export const initialItemCountSystem = u.system(
  ([{ sizes, firstItemIndex, data, gap }, { initialTopMostItemIndex }, { listState }, { didMount }]) => {
    const initialItemCount = u.statefulStream(0)

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialItemCount),
        u.filter(([, count]) => count !== 0),
        u.withLatestFrom(initialTopMostItemIndex, sizes, firstItemIndex, gap, data),
        u.map(([[, count], initialTopMostItemIndexValue, sizes, firstItemIndex, gap, data = []]) => {
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
          const initialTopMostItemIndexNumber = getInitialTopMostItemIndexNumber(initialTopMostItemIndexValue, adjustedCount)

          const items = Array.from({ length: adjustedCount }).map((_, index) => ({
            index: index + initialTopMostItemIndexNumber,
            size: 0,
            offset: 0,
            data: data[index + initialTopMostItemIndexNumber],
          }))
          return buildListState(items, [], adjustedCount, gap, sizes, firstItemIndex)
        })
      ),
      listState
    )

    return { initialItemCount }
  },
  u.tup(sizeSystem, initialTopMostItemIndexSystem, listStateSystem, propsReadySystem),
  { singleton: true }
)
