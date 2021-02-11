import * as u from '@virtuoso.dev/urx'
import { UP, domIOSystem } from './domIOSystem'
import { listStateSystem } from './listStateSystem'
import { offsetOf, sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { ListItem } from './interfaces'

/**
 * Fixes upward scrolling by calculating and compensation from changed item heights, using scrollBy.
 */
export const upwardScrollFixSystem = u.system(
  ([
    { scrollBy, scrollTop, scrollDirection, deviation, scrollingInProgress },
    { isScrolling },
    { listState },
    { beforeUnshiftWith, sizes, listRefresh },
  ]) => {
    const deviationOffset = u.streamFromEmitter(
      u.pipe(
        listState,
        u.withLatestFrom(scrollTop, scrollDirection, scrollingInProgress),
        u.filter(([, scrollTop, scrollDirection, scrollingInProgress]) => {
          return !scrollingInProgress && scrollTop !== 0 && scrollDirection === UP
        }),
        u.map(([state]) => state),
        u.scan(
          ([, prevItems], { items }) => {
            let newDev = 0
            if (prevItems.length > 0 && items.length > 0) {
              const firstItemIndex = items[0].originalIndex
              const prevFirstItemIndex = prevItems[0].originalIndex
              const atStart = firstItemIndex === 0 && prevFirstItemIndex === 0

              if (!atStart) {
                // Handles an item taller than the viewport
                if (firstItemIndex === prevFirstItemIndex) {
                  newDev = items[0].size - prevItems[0].size
                } else {
                  for (let index = items.length - 1; index >= 0; index--) {
                    const item = items[index]

                    const prevItem = prevItems.find((pItem) => pItem.originalIndex === item.originalIndex)

                    if (!prevItem) {
                      continue
                    }

                    if (item.offset !== prevItem.offset) {
                      newDev = item.offset - prevItem.offset
                      break
                    }
                  }
                }
              }
            }

            return [newDev, items] as [number, ListItem<any>[]]
          },
          [0, []] as [number, ListItem<any>[]]
        ),
        u.filter(([amount]) => amount !== 0),
        u.map(([amount]) => amount)
      )
    )

    u.connect(
      u.pipe(
        deviationOffset,
        u.withLatestFrom(deviation),
        u.map(([amount, deviation]) => deviation - amount)
      ),
      deviation
    )

    // when the browser stops scrolling,
    // restore the position and reset the glitching
    u.subscribe(
      u.pipe(
        u.combineLatest(u.statefulStreamFromEmitter(isScrolling, false), deviation),
        u.filter(([is, deviation]) => !is && deviation !== 0),
        u.map(([_, deviation]) => deviation)
      ),
      (offset) => {
        if (offset > 0) {
          u.publish(scrollBy, { top: -offset, behavior: 'auto' })
          u.publish(deviation, 0)
        } else {
          u.publish(deviation, 0)
          u.publish(scrollBy, { top: -offset, behavior: 'auto' })
        }
      }
    )

    u.subscribe(
      u.pipe(
        beforeUnshiftWith,
        u.map((indexOffset) => {
          const currentTopIndex = u.getValue(listState).items[0].originalIndex!

          return {
            index: currentTopIndex + indexOffset,
            offset: offsetOf(currentTopIndex, u.getValue(sizes)),
          }
        })
      ),
      ({ index, offset }) => {
        // a list refresh will be triggered immediately from the unshiftWith pushing new items.
        // Skip it, and handle the one coming from the DOM.
        u.handleNext(u.pipe(listRefresh, u.skip(1)), () => {
          const newOffset = offsetOf(index, u.getValue(sizes))
          u.publish(deviationOffset, newOffset - offset)
        })
      }
    )

    return { deviation }
  },
  u.tup(domIOSystem, stateFlagsSystem, listStateSystem, sizeSystem)
)
