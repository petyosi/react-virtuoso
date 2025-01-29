import * as u from './urx'
import { listStateSystem, buildListStateFromItemCount } from './listStateSystem'
import { sizeSystem } from './sizeSystem'
import { propsReadySystem } from './propsReadySystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'

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
