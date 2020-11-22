import { pipe, system, tup, combineLatest, map, stream, connect, statefulStreamFromEmitter, duc } from '@virtuoso.dev/urx'
import { listStateSystem } from './listStateSystem'
import { sizeRangeSystem } from './sizeRangeSystem'

export const totalListHeightSystem = system(
  ([{ footerHeight, headerHeight }, { listState }]) => {
    const totalListHeightChanged = stream<number>()
    const totalListHeight = statefulStreamFromEmitter(
      pipe(
        combineLatest(footerHeight, headerHeight, listState),
        map(([footerHeight, headerHeight, listState]) => {
          return footerHeight + headerHeight + listState.offsetBottom + listState.bottom
        })
      ),
      0
    )

    connect(duc(totalListHeight), totalListHeightChanged)

    return { totalListHeight, totalListHeightChanged }
  },
  tup(sizeRangeSystem, listStateSystem),
  { singleton: true }
)
