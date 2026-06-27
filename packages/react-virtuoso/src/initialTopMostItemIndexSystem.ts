import { empty } from './AATree'
import { domIOSystem } from './domIOSystem'
import { propsReadySystem } from './propsReadySystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeSystem } from './sizeSystem'
import * as u from './urx'
import { skipFrames } from './utils/skipFrames'

import type { FlatIndexLocationWithAlign } from './interfaces'

export type InitialTopMostItemIndexLocation = FlatIndexLocationWithAlign | number | undefined

export function getInitialTopMostItemIndexNumber(location: InitialTopMostItemIndexLocation, totalCount: number): number {
  if (location === undefined) {
    return 0
  }

  const lastIndex = totalCount - 1
  const index = typeof location === 'number' ? location : location.index === 'LAST' ? lastIndex : location.index
  return Math.max(0, Math.min(index, lastIndex))
}

export function initialTopMostItemIndexIsZero(location: InitialTopMostItemIndexLocation): boolean {
  if (location === undefined) {
    return true
  }

  if (typeof location === 'number') {
    return location === 0
  }

  return (
    location.index === 0 &&
    (location.align === undefined || location.align === 'start') &&
    (location.offset === undefined || location.offset === 0)
  )
}

export const initialTopMostItemIndexSystem = u.system(
  ([{ defaultItemSize, listRefresh, sizes }, { scrollTop }, { scrollTargetReached, scrollToIndex }, { didMount }]) => {
    const scrolledToInitialItem = u.statefulStream(true)
    const initialTopMostItemIndex = u.statefulStream<InitialTopMostItemIndexLocation>(0)
    const initialItemFinalLocationReached = u.statefulStream(true)

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialTopMostItemIndex),
        u.filter(([_, location]) => !initialTopMostItemIndexIsZero(location)),
        u.mapTo(false)
      ),
      scrolledToInitialItem
    )
    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialTopMostItemIndex),
        u.filter(([_, location]) => !initialTopMostItemIndexIsZero(location)),
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
        if (initialTopMostItemIndex === undefined) {
          u.publish(scrolledToInitialItem, true)
          u.publish(initialItemFinalLocationReached, true)
          return
        }

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
