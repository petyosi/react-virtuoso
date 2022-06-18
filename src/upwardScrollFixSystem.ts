import * as u from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'
import { listStateSystem } from './listStateSystem'
import { sizeSystem } from './sizeSystem'
import { UP, stateFlagsSystem } from './stateFlagsSystem'
import { ListItem } from './interfaces'
import { loggerSystem, LogLevel } from './loggerSystem'
import { simpleMemoize } from './utils/simpleMemoize'
import { recalcSystem } from './recalcSystem'

const isMobileSafari = simpleMemoize(() => {
  return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent)
})

type UpwardFixState = [number, ListItem<any>[], number, number]
/**
 * Fixes upward scrolling by calculating and compensation from changed item heights, using scrollBy.
 */
export const upwardScrollFixSystem = u.system(
  ([
    { scrollBy, scrollTop, deviation, scrollingInProgress },
    { isScrolling, isAtBottom, atBottomState, scrollDirection, lastJumpDueToItemResize },
    { listState },
    { beforeUnshiftWith, shiftWithOffset, sizes },
    { log },
    { recalcInProgress },
  ]) => {
    const deviationOffset = u.streamFromEmitter(
      u.pipe(
        listState,
        u.withLatestFrom(lastJumpDueToItemResize),
        u.scan(
          ([, prevItems, prevTotalCount, prevTotalHeight], [{ items, totalCount, bottom, offsetBottom }, lastJumpDueToItemResize]) => {
            const totalHeight = bottom + offsetBottom

            let newDev = 0
            if (prevTotalCount === totalCount) {
              if (prevItems.length > 0 && items.length > 0) {
                const atStart = items[0].originalIndex === 0 && prevItems[0].originalIndex === 0
                if (!atStart) {
                  newDev = totalHeight - prevTotalHeight
                  if (newDev !== 0) {
                    newDev += lastJumpDueToItemResize
                  }
                }
              }
            }

            return [newDev, items, totalCount, totalHeight] as UpwardFixState
          },
          [0, [], 0, 0] as UpwardFixState
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

    function scrollByWith(offset: number) {
      if (offset > 0) {
        u.publish(scrollBy, { top: -offset, behavior: 'auto' })
        u.publish(deviation, 0)
      } else {
        u.publish(deviation, 0)
        u.publish(scrollBy, { top: -offset, behavior: 'auto' })
      }
    }

    u.subscribe(u.pipe(deviationOffset, u.withLatestFrom(deviation, isScrolling)), ([offset, deviationAmount, isScrolling]) => {
      if (isScrolling && isMobileSafari()) {
        u.publish(deviation, deviationAmount - offset)
      } else {
        scrollByWith(-offset)
      }
    })

    // this hack is only necessary for mobile safari which does not support scrollBy while scrolling is in progress.
    // when the browser stops scrolling, restore the position and reset the glitching
    u.subscribe(
      u.pipe(
        u.combineLatest(u.statefulStreamFromEmitter(isScrolling, false), deviation, recalcInProgress),
        u.filter(([is, deviation, recalc]) => !is && !recalc && deviation !== 0),
        u.map(([_, deviation]) => deviation),
        u.throttleTime(1)
      ),
      scrollByWith
    )

    u.connect(
      u.pipe(
        shiftWithOffset,
        u.map((offset) => {
          return { top: -offset }
        })
      ),
      scrollBy
    )

    u.subscribe(
      u.pipe(
        beforeUnshiftWith,
        u.withLatestFrom(sizes),
        u.map(([offset, { lastSize }]) => offset * lastSize)
      ),
      (offset) => {
        u.publish(deviation, offset)
        requestAnimationFrame(() => {
          u.publish(scrollBy, { top: offset })
          requestAnimationFrame(() => {
            u.publish(deviation, 0)
            u.publish(recalcInProgress, false)
          })
        })
      }
    )

    return { deviation }
  },
  u.tup(domIOSystem, stateFlagsSystem, listStateSystem, sizeSystem, loggerSystem, recalcSystem)
)
