import * as u from '@virtuoso.dev/urx'
import { empty } from './AATree'
import { sizeSystem } from './sizeSystem'
import { domIOSystem } from './domIOSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { propsReadySystem } from './propsReadySystem'

export const initialTopMostItemIndexSystem = u.system(
  ([{ sizes, listRefresh }, { scrollTop }, { scrollToIndex }, { didMount }]) => {
    const scrolledToInitialItem = u.statefulStream(true)
    const initialTopMostItemIndex = u.statefulStream(0)

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialTopMostItemIndex),
        u.filter(([_, index]) => index !== 0),
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
  u.tup(sizeSystem, domIOSystem, scrollToIndexSystem, propsReadySystem),
  { singleton: true }
)
