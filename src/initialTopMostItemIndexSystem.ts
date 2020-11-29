import * as u from '@virtuoso.dev/urx'
import { empty } from './AATree'
import { sizeSystem } from './sizeSystem'
import { domIOSystem } from './domIOSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'

function take<T>(times = 1): u.Operator<T> {
  return done => value => {
    if (times-- > 0) {
      done(value)
    }
  }
}

export const initialTopMostItemIndexSystem = u.system(
  ([{ sizes, listRefresh }, { scrollTop }, { scrollToIndex }]) => {
    const scrolledToInitialItem = u.statefulStream(true)
    const initialTopMostItemIndex = u.statefulStream(0)

    u.connect(
      u.pipe(
        u.duc(initialTopMostItemIndex),
        u.filter(index => index !== 0),
        take(1),
        u.mapTo(false)
      ),
      scrolledToInitialItem
    )

    u.subscribe(
      u.pipe(
        listRefresh,
        u.withLatestFrom(scrolledToInitialItem, sizes),
        u.filter(([, scrolledToInitialItem, { sizeTree }]) => {
          return !empty(sizeTree) && !scrolledToInitialItem
        }),
        u.withLatestFrom(initialTopMostItemIndex)
      ),
      ([, initialTopMostItemIndex]) => {
        u.handleNext(scrollTop, () => {
          u.publish(scrolledToInitialItem, true)
        })

        u.publish(scrollToIndex, initialTopMostItemIndex)
      }
    )

    return {
      scrolledToInitialItem,
      initialTopMostItemIndex,
    }
  },
  u.tup(sizeSystem, domIOSystem, scrollToIndexSystem),
  { singleton: true }
)
