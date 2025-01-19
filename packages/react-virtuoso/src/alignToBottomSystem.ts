import { domIOSystem } from './domIOSystem'
import { totalListHeightSystem } from './totalListHeightSystem'
import * as u from './urx'

export const alignToBottomSystem = u.system(
  ([{ viewportHeight }, { totalListHeight }]) => {
    const alignToBottom = u.statefulStream(false)

    // keep this for the table component only
    const paddingTopAddition = u.statefulStreamFromEmitter(
      u.pipe(
        u.combineLatest(alignToBottom, viewportHeight, totalListHeight),
        u.filter(([enabled]) => enabled),
        u.map(([, viewportHeight, totalListHeight]) => {
          return Math.max(0, viewportHeight - totalListHeight)
        }),
        u.throttleTime(0),
        u.distinctUntilChanged()
      ),
      0
    )

    return { alignToBottom, paddingTopAddition }
  },
  u.tup(domIOSystem, totalListHeightSystem),
  { singleton: true }
)
