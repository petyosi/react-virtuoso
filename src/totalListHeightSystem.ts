import * as u from '@virtuoso.dev/urx'
import { listStateSystem } from './listStateSystem'
import { sizeRangeSystem } from './sizeRangeSystem'

export const totalListHeightSystem = u.system(
  ([{ footerHeight, headerHeight }, { listState }]) => {
    const totalListHeightChanged = u.stream<number>()
    const totalListHeight = u.statefulStreamFromEmitter(
      u.pipe(
        u.combineLatest(footerHeight, headerHeight, listState),
        u.map(([footerHeight, headerHeight, listState]) => {
          return footerHeight + headerHeight + listState.offsetBottom + listState.bottom
        })
      ),
      0
    )

    u.connect(u.duc(totalListHeight), totalListHeightChanged)

    return { totalListHeight, totalListHeightChanged }
  },
  u.tup(sizeRangeSystem, listStateSystem),
  { singleton: true }
)
