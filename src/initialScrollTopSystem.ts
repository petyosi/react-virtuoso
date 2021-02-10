import * as u from '@virtuoso.dev/urx'
import { totalListHeightSystem } from './totalListHeightSystem'
import { propsReadySystem } from './propsReadySystem'
import { domIOSystem } from './domIOSystem'

export const initialScrollTopSystem = u.system(
  ([{ totalListHeight }, { didMount }, { scrollTo }]) => {
    const initialScrollTop = u.statefulStream(0)

    u.subscribe(
      u.pipe(
        didMount,
        u.withLatestFrom(initialScrollTop),
        u.filter(([, offset]) => offset !== 0),
        u.map(([, offset]) => ({ top: offset }))
      ),
      (location) => {
        u.handleNext(
          u.pipe(
            totalListHeight,
            u.filter((val) => val !== 0)
          ),
          () => {
            setTimeout(() => {
              u.publish(scrollTo, location)
            })
          }
        )
      }
    )

    return {
      initialScrollTop,
    }
  },
  u.tup(totalListHeightSystem, propsReadySystem, domIOSystem),
  { singleton: true }
)
