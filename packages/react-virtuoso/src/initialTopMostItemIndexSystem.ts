import { empty } from './AATree'
import { domIOSystem } from './domIOSystem'
import { FlatIndexLocationWithAlign } from './interfaces'
import { propsReadySystem } from './propsReadySystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeSystem } from './sizeSystem'
import * as u from './urx'
import { skipFrames } from './utils/skipFrames'

export function getInitialTopMostItemIndexNumber(location: FlatIndexLocationWithAlign | number, totalCount: number): number {
  const lastIndex = totalCount - 1
  const index = typeof location === 'number' ? location : location.index === 'LAST' ? lastIndex : location.index
  return index
}

export const initialTopMostItemIndexSystem = u.system(
  ([{ defaultItemSize, listRefresh, sizes }, { scrollTop }, { scrollTargetReached, scrollToIndex }, { didMount }]) => {
    const scrolledToInitialItem = u.statefulStream(true)
    const initialTopMostItemIndex = u.statefulStream<FlatIndexLocationWithAlign | number>(0)
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
      initialItemFinalLocationReached,
      initialTopMostItemIndex,
      scrolledToInitialItem,
    }
  },
  u.tup(sizeSystem, domIOSystem, scrollToIndexSystem, propsReadySystem),
  { singleton: true }
)
