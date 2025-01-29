import * as u from './urx'
import { empty } from './AATree'
import { sizeSystem } from './sizeSystem'
import { domIOSystem } from './domIOSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { propsReadySystem } from './propsReadySystem'
import { FlatIndexLocationWithAlign } from './interfaces'
import { skipFrames } from './utils/skipFrames'

export function getInitialTopMostItemIndexNumber(location: number | FlatIndexLocationWithAlign, totalCount: number): number {
  const lastIndex = totalCount - 1
  const index = typeof location === 'number' ? location : location.index === 'LAST' ? lastIndex : location.index
  return index
}

export const initialTopMostItemIndexSystem = u.system(
  ([{ sizes, listRefresh, defaultItemSize }, { scrollTop }, { scrollToIndex, scrollTargetReached }, { didMount }]) => {
    const scrolledToInitialItem = u.statefulStream(true)
    const initialTopMostItemIndex = u.statefulStream<number | FlatIndexLocationWithAlign>(0)
    const initialItemFinalLocationReached = u.statefulStream(true)

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialTopMostItemIndex),
        u.filter(([_, location]) => !!location),
        u.mapTo(false)
      ),
      scrolledToInitialItem
    )
    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialTopMostItemIndex),
        u.filter(([_, location]) => !!location),
        u.mapTo(false)
      ),
      initialItemFinalLocationReached
    )

    u.subscribe(
      u.pipe(
        u.combineLatest(listRefresh, didMount),
        u.withLatestFrom(scrolledToInitialItem, sizes, defaultItemSize, initialItemFinalLocationReached),
        u.filter(([[, didMount], scrolledToInitialItem, { sizeTree }, defaultItemSize, scrollScheduled]) => {
          return didMount && (!empty(sizeTree) || u.isDefined(defaultItemSize)) && !scrolledToInitialItem && !scrollScheduled
        }),
        u.withLatestFrom(initialTopMostItemIndex)
      ),
      ([, initialTopMostItemIndex]) => {
        u.handleNext(scrollTargetReached, () => {
          u.publish(initialItemFinalLocationReached, true)
        })

        skipFrames(4, () => {
          u.handleNext(scrollTop, () => {
            u.publish(scrolledToInitialItem, true)
          })
          u.publish(scrollToIndex, initialTopMostItemIndex)
        })
      }
    )

    return {
      scrolledToInitialItem,
      initialTopMostItemIndex,
      initialItemFinalLocationReached,
    }
  },
  u.tup(sizeSystem, domIOSystem, scrollToIndexSystem, propsReadySystem),
  { singleton: true }
)
