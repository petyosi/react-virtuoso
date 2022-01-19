import * as u from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'
import { listStateSystem } from './listStateSystem'
import { sizeSystem } from './sizeSystem'
import { UP, stateFlagsSystem } from './stateFlagsSystem'
import { ListItem } from './interfaces'
import { loggerSystem, LogLevel } from './loggerSystem'

/**
 * Fixes upward scrolling by calculating and compensation from changed item heights, using scrollBy.
 */
export const upwardScrollFixSystem = u.system(
  ([
    { scrollBy, scrollTop, deviation, scrollingInProgress },
    { isScrolling, isAtBottom, atBottomState, scrollDirection, lastJumpDueToItemResize },
    { listState },
    { beforeUnshiftWith, sizes },
    { log },
  ]) => {
    const deviationOffset = u.streamFromEmitter(
      u.pipe(
        listState,
        u.withLatestFrom(lastJumpDueToItemResize),
        u.scan(
          ([, prevItems, prevTotalCount], [{ items, totalCount }, lastJumpDueToItemResize]) => {
            let newDev = 0
            if (prevTotalCount === totalCount) {
              if (prevItems.length > 0 && items.length > 0) {
                const firstItemIndex = items[0].originalIndex
                const prevFirstItemIndex = prevItems[0].originalIndex
                const atStart = firstItemIndex === 0 && prevFirstItemIndex === 0
                const onlyItem = items.length === 1

                if (!atStart) {
                  for (let index = items.length - 1; index >= 0; index--) {
                    const item = items[index]

                    const prevItem = prevItems.find((pItem) => pItem.originalIndex === item.originalIndex)

                    if (!prevItem) {
                      continue
                    }

                    if (item.offset !== prevItem.offset || onlyItem) {
                      newDev = item.offset - prevItem.offset + item.size - prevItem.size
                      break
                    }
                  }
                }
              }

              if (newDev !== 0) {
                newDev += lastJumpDueToItemResize
              }
            }

            return [newDev, items, totalCount] as [number, ListItem<any>[], number]
          },
          [0, [], 0] as [number, ListItem<any>[], number]
        ),
        u.filter(([amount]) => amount !== 0),
        u.withLatestFrom(scrollTop, scrollDirection, scrollingInProgress, log, isAtBottom, atBottomState),
        u.filter(([, scrollTop, scrollDirection, scrollingInProgress]) => {
          // console.log({ amount, scrollTop, scrollDirection, scrollingInProgress, isAtBottom, atBottomState })
          return !scrollingInProgress && scrollTop !== 0 && scrollDirection === UP // && (isAtBottom ? amount > 0 : true)
        }),
        u.map(([[amount], , , , log]) => {
          log('Upward scrolling compensation', { amount }, LogLevel.DEBUG)
          return amount
        })
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
        u.map(([_, deviation]) => deviation),
        u.throttleTime(1)
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

    u.connect(
      u.pipe(
        beforeUnshiftWith,
        u.withLatestFrom(sizes),
        u.map(([offset, { lastSize }]) => offset * lastSize)
      ),
      deviationOffset
    )

    return { deviation }
  },
  u.tup(domIOSystem, stateFlagsSystem, listStateSystem, sizeSystem, loggerSystem)
)
