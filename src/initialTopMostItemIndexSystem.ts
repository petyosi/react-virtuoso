import * as u from '@virtuoso.dev/urx'
import { empty } from './AATree'
import { sizeSystem } from './sizeSystem'
import { domIOSystem } from './domIOSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { propsReadySystem } from './propsReadySystem'

export const initialTopMostItemIndexSystem = u.system(
  ([{ sizes, listRefresh, defaultItemSize }, { scrollTop }, { scrollToIndex }, { didMount }]) => {
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
        u.combineLatest(listRefresh, didMount),
        u.withLatestFrom(scrolledToInitialItem, sizes, defaultItemSize),
        u.filter(([[, didMount], scrolledToInitialItem, { sizeTree }, defaultItemSize]) => {
          return didMount && (!empty(sizeTree) || defaultItemSize !== undefined) && !scrolledToInitialItem
        }),
        u.withLatestFrom(initialTopMostItemIndex)
      ),
      ([, initialTopMostItemIndex]) => {
        u.handleNext(scrollTop, () => {
          u.publish(scrolledToInitialItem, true)
        })

        setTimeout(() => {
          u.publish(scrollToIndex, initialTopMostItemIndex)
        })
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
