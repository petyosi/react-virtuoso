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
  ([{ sizes, listRefresh, defaultItemSize }, { scrollTop }, { scrollToIndex }, { didMount }]) => {
    const scrolledToInitialItem = u.statefulStream(true)
    const initialTopMostItemIndex = u.statefulStream<number | FlatIndexLocationWithAlign>(0)
    const scrollScheduled = u.statefulStream(false)

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialTopMostItemIndex),
        u.filter(([_, location]) => !!location),
        u.mapTo(false)
      ),
      scrolledToInitialItem
    )

    u.subscribe(
      u.pipe(
        u.combineLatest(listRefresh, didMount),
        u.withLatestFrom(scrolledToInitialItem, sizes, defaultItemSize, scrollScheduled),
        u.filter(([[, didMount], scrolledToInitialItem, { sizeTree }, defaultItemSize, scrollScheduled]) => {
          return didMount && (!empty(sizeTree) || u.isDefined(defaultItemSize)) && !scrolledToInitialItem && !scrollScheduled
        }),
        u.withLatestFrom(initialTopMostItemIndex)
      ),
      ([, initialTopMostItemIndex]) => {
        u.publish(scrollScheduled, true)
        skipFrames(3, () => {
          u.handleNext(scrollTop, () => u.publish(scrolledToInitialItem, true))
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
