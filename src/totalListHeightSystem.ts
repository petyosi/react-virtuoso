import * as u from '@virtuoso.dev/urx'

import { domIOSystem } from './domIOSystem'
import { listStateSystem } from './listStateSystem'

export const totalListHeightSystem = u.system(
  ([{ footerHeight, headerHeight }, { listState }]) => {
    const totalListHeightChanged = u.stream<number>()
    const totalListHeight = u.statefulStreamFromEmitter(
      u.pipe(
        u.combineLatest(footerHeight, headerHeight, listState),
        u.map(([footerHeight, headerHeight, listState]) => {
          // FIXME: this footerHeight, headerHeight calculate is not correct, should find where to apply totalListHeightSystem
          // console.log('-------- [totalListHeightSystem Log] --------');
          // console.log(footerHeight, headerHeight, listState);
          // console.log('---------------- [Log End] ----------------');
          return footerHeight + headerHeight + listState.offsetBottom + listState.bottom
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
