import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { buildListStateFromItemCount, listStateSystem } from './listStateSystem'
import { propsReadySystem } from './propsReadySystem'
import { sizeSystem } from './sizeSystem'
import * as u from './urx'

export const initialItemCountSystem = u.system(
  ([{ sizes, firstItemIndex, data, gap }, { initialTopMostItemIndex }, { initialItemCount, listState }, { didMount }]) => {
    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialItemCount),
        u.filter(([, count]) => count !== 0),
        u.withLatestFrom(initialTopMostItemIndex, sizes, firstItemIndex, gap, data),
        u.map(([[, count], initialTopMostItemIndexValue, sizes, firstItemIndex, gap, data = []]) => {
          return buildListStateFromItemCount(count, initialTopMostItemIndexValue, sizes, firstItemIndex, gap, data)
        })
      ),
      listState
    )
    return {}
  },
  u.tup(sizeSystem, initialTopMostItemIndexSystem, listStateSystem, propsReadySystem),
  { singleton: true }
)
