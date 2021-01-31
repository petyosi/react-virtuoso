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
  ([{ scrollBy, scrollTop, scrollDirection, deviation }, { isScrolling }, { listState }, { beforeUnshiftWith, sizes, listRefresh }]) => {
    const deviationOffset = u.streamFromEmitter(
      u.pipe(
        listState,
        u.withLatestFrom(scrollTop, scrollDirection),
        u.filter(([, scrollTop, scrollDirection]) => {
          return scrollTop !== 0 && scrollDirection === UP
        }),
        u.map(([state]) => state),
        u.scan(
          ([, prevItems], { items }) => {
            let newDev = 0
            if (prevItems.length > 0 && items.length > 0) {
              const atStart = prevItems[0].originalIndex === 0 && items[0].originalIndex === 0

              if (!atStart) {
                for (let index = items.length - 1; index >= 0; index--) {
                  const item = items[index]

                  const prevItem = prevItems.find(pItem => pItem.originalIndex === item.originalIndex)

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
      offset => {
        u.publish(scrollBy, { top: -offset, behavior: 'auto' })
        u.publish(deviation, 0)
      }
    )

    u.subscribe(
      u.pipe(
        beforeUnshiftWith,
        u.map(indexOffset => {
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
