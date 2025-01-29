import * as u from './urx'
import { propsReadySystem } from './propsReadySystem'
import { domIOSystem } from './domIOSystem'
import { listStateSystem } from './listStateSystem'

export const initialScrollTopSystem = u.system(
  ([{ didMount }, { scrollTo }, { listState }]) => {
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
            listState,
            u.skip(1),
            u.filter((state) => state.items.length > 1)
          ),
          () => {
            requestAnimationFrame(() => {
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
  u.tup(propsReadySystem, domIOSystem, listStateSystem),
  { singleton: true }
)
