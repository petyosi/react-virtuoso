import * as u from '@virtuoso.dev/urx'
import { listStateSystem } from './listStateSystem'
import { domIOSystem } from './domIOSystem'

export const totalListHeightSystem = u.system(
  ([{ footerHeight, headerHeight, fixedHeaderHeight }, { listState }]) => {
    const totalListHeightChanged = u.stream<number>()
    const totalListHeight = u.statefulStreamFromEmitter(
      u.pipe(
        u.combineLatest(footerHeight, headerHeight, fixedHeaderHeight, listState),
        u.map(([footerHeight, headerHeight, fixedHeaderHeight, listState]) => {
          return footerHeight + headerHeight + fixedHeaderHeight + listState.offsetBottom + listState.bottom
        })
      ),
      0
    )

    u.connect(u.duc(totalListHeight), totalListHeightChanged)

    return { totalListHeight, totalListHeightChanged }
  },
  u.tup(domIOSystem, listStateSystem),
  { singleton: true }
)
