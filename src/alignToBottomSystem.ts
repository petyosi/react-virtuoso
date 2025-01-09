import * as u from './urx'
import { totalListHeightSystem } from './totalListHeightSystem'
import { domIOSystem } from './domIOSystem'

export const alignToBottomSystem = u.system(
  ([{ viewportHeight }, { totalListHeight }]) => {
    const alignToBottom = u.statefulStream(false)

    const paddingTopAddition = u.statefulStreamFromEmitter(
      u.pipe(
        u.combineLatest([alignToBottom, viewportHeight, totalListHeight]),
        u.filter(([enabled]) => enabled),
        u.map(([, viewportHeight, totalListHeight]) => 
          Math.max(0, viewportHeight - totalListHeight)
        ),
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
