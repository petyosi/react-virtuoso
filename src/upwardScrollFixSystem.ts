import * as u from '@virtuoso.dev/urx'
import { UP, domIOSystem } from './domIOSystem'
import { listStateSystem } from './listStateSystem'
import { offsetOf, sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { ListItem } from './interfaces'

const UA = typeof window !== 'undefined' && window?.navigator?.userAgent
const GLITCHY_SCROLL_BY = UA && (!!UA.match(/iPad/i) || !!UA.match(/iPhone/i))
/**
 * Fixes upward scrolling by calculating and compensation from changed item heights, using scrollBy.
 */
export const upwardScrollFixSystem = u.system(
  ([{ scrollBy, scrollTop, scrollDirection, deviation }, { isScrolling }, { listState }, { unshiftWith, beforeUnshiftWith, sizes }]) => {
    const deviationOffset = u.pipe(
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

    if (GLITCHY_SCROLL_BY) {
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
          isScrolling,
          u.filter(is => !is),
          u.withLatestFrom(deviation),
          u.filter(([_, deviation]) => deviation !== 0),
          u.map(([_, deviation]) => deviation)
        ),
        offset => {
          u.publish(scrollBy, { top: -offset, behavior: 'auto' })
          u.publish(deviation, 0)
        }
      )
    } else {
      u.connect(
        u.pipe(
          deviationOffset,
          u.map(offset => ({ top: offset, behavior: 'auto' }))
        ),
        scrollBy
      )
    }

    const unshiftPayload = u.stream<{ index: number; offset: number }>()

    u.connect(
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
      unshiftPayload
    )

    u.connect(
      u.pipe(
        unshiftWith,
        u.withLatestFrom(unshiftPayload),
        u.map(([, { index, offset }]) => {
          const newOffset = offsetOf(index, u.getValue(sizes))
          return { top: newOffset - offset }
        })
      ),
      scrollBy
    )

    return { deviation }
  },
  u.tup(domIOSystem, stateFlagsSystem, listStateSystem, sizeSystem)
)
