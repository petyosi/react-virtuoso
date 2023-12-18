import * as u from '@virtuoso.dev/urx'
import { empty } from './AATree'
import { sizeSystem } from './sizeSystem'
import { domIOSystem } from './domIOSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { propsReadySystem } from './propsReadySystem'
import { FlatIndexLocationWithAlign } from './interfaces'

export function getInitialTopMostItemIndexNumber(location: number | FlatIndexLocationWithAlign, totalCount: number): number {
  const lastIndex = totalCount - 1
  const index = typeof location === 'number' ? location : location.index === 'LAST' ? lastIndex : location.index
  return index
}

export const initialTopMostItemIndexSystem = u.system(
  ([{ sizes, listRefresh, defaultItemSize }, { scrollTop }, { scrollToIndex }, { didMount }]) => {
    const scrolledToInitialItem = u.statefulStream(true)
    const initialTopMostItemIndex = u.statefulStream<number | FlatIndexLocationWithAlign>(0)

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
        u.withLatestFrom(scrolledToInitialItem, sizes, defaultItemSize),
        u.filter(([[, didMount], scrolledToInitialItem, { sizeTree }, defaultItemSize]) => {
          return didMount && (!empty(sizeTree) || defaultItemSize !== undefined) && !scrolledToInitialItem
        }),
        u.withLatestFrom(initialTopMostItemIndex)
      ),
      ([, initialTopMostItemIndex]) => {
        setTimeout(() => {
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
    }
  },
  u.tup(sizeSystem, domIOSystem, scrollToIndexSystem, propsReadySystem),
  { singleton: true }
)
