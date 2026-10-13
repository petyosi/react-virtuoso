import { find } from './AATree'
import { domIOSystem } from './domIOSystem'
import { listStateSystem } from './listStateSystem'
import { loggerSystem, LogLevel } from './loggerSystem'
import { recalcSystem } from './recalcSystem'
import { sizeSystem } from './sizeSystem'
import { stateFlagsSystem, UP } from './stateFlagsSystem'
import * as u from './urx'
import { simpleMemoize } from './utils/simpleMemoize'

import type { ListItem } from './interfaces'

const isMobileSafari = simpleMemoize(() => {
  return /iP(ad|od|hone)/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent)
})

type UpwardFixState = [number, ListItem<any>[], number, number]
/**
 * Fixes upward scrolling by calculating and compensation from changed item heights, using scrollBy.
 */
export const upwardScrollFixSystem = u.system(
  ([
    { deviation, deviationCommitted, scrollBy, scrollingInProgress, scrollTop },
    { isAtBottom, isScrolling, lastJumpDueToItemResize, scrollDirection },
    { listState },
    { beforeUnshiftWith, gap, shiftWithOffset, sizes },
    { log },
    { recalcInProgress },
  ]) => {
    const deviationOffset = u.streamFromEmitter(
      u.pipe(
        listState,
        u.withLatestFrom(lastJumpDueToItemResize),
        u.scan(
          ([, prevItems, prevTotalCount, prevTotalHeight], [{ bottom, items, offsetBottom, totalCount }, lastJumpDueToItemResize]) => {
            const totalHeight = bottom + offsetBottom

            let newDev = 0
            if (prevTotalCount === totalCount) {
              if (prevItems.length > 0 && items.length > 0) {
                const atStart = items[0]!.originalIndex === 0 && prevItems[0]!.originalIndex === 0
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
        u.withLatestFrom(scrollTop, scrollDirection, scrollingInProgress, isAtBottom, log, recalcInProgress),
        u.filter(([, scrollTop, scrollDirection, scrollingInProgress, , , recalcInProgress]) => {
          return !recalcInProgress && !scrollingInProgress && scrollTop !== 0 && scrollDirection === UP
        }),
        u.map(([[amount], , , , , log]) => {
          log('Upward scrolling compensation', { amount }, LogLevel.DEBUG)
          return amount
        })
      )
    )

    function scrollByWith(offset: number) {
      if (offset > 0) {
        u.publish(scrollBy, { behavior: 'auto', top: -offset })
        u.publish(deviation, 0)
      } else {
        u.publish(deviation, 0)
        u.publish(scrollBy, { behavior: 'auto', top: -offset })
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

    // A prepend's compensation is pending from the moment its deviation is
    // published until it is applied — exactly once, by whichever comes first:
    // the renderer's acknowledgement that the deviation reached the DOM, or the
    // next-frame fallback. A second prepend replaces a pending one, which is
    // correct: `deviation` is absolute, so the later offset already subsumes it.
    let pendingPrepend: { acknowledgeable: boolean; offset: number } | null = null

    function compensatePrepend() {
      if (pendingPrepend === null) {
        return
      }
      const { offset } = pendingPrepend
      pendingPrepend = null
      u.publish(scrollBy, { top: offset })
      requestAnimationFrame(() => {
        u.publish(deviation, 0)
        u.publish(recalcInProgress, false)
      })
    }

    u.subscribe(deviationCommitted, (committed) => {
      if (pendingPrepend === null || !pendingPrepend.acknowledgeable) {
        return
      }
      // `deviation` is also published by the resize and mobile-Safari paths, so
      // the commit has to carry the pending offset. That is only unambiguous
      // because a pending compensation is `acknowledgeable` exclusively when
      // its own publish changed the value — see the publish site.
      if (committed !== pendingPrepend.offset) {
        return
      }
      compensatePrepend()
    })

    u.subscribe(
      u.pipe(
        beforeUnshiftWith,
        u.withLatestFrom(sizes, gap),
        u.map(([offset, { groupIndices, lastSize: defaultItemSize, sizeTree }, gap]) => {
          function getItemOffset(itemCount: number) {
            return itemCount * (defaultItemSize + gap)
          }
          if (groupIndices.length === 0) {
            return getItemOffset(offset)
          }

          let amount = 0
          const defaultGroupSize = find(sizeTree, 0)!

          let recognizedOffsetItems = 0
          let groupIndex = 0
          while (recognizedOffsetItems < offset) {
            // increase once for the group itself
            recognizedOffsetItems++
            amount += defaultGroupSize

            let groupItemCount =
              groupIndices.length === groupIndex + 1 ? Infinity : groupIndices[groupIndex + 1]! - groupIndices[groupIndex]! - 1

            // if the group is larger than the offset, we have an expanded group. remove the group size, and replace with 1 item.
            if (recognizedOffsetItems + groupItemCount > offset) {
              amount -= defaultGroupSize
              groupItemCount = offset - recognizedOffsetItems + 1
            }

            recognizedOffsetItems += groupItemCount
            amount += getItemOffset(groupItemCount)
            groupIndex++
          }

          return amount
        })
      ),
      (offset) => {
        // The deviation makes room for the prepended items by pushing the list
        // DOWN; the scroll cancels that push. Both have to reach the DOM before
        // the same paint. Deferring the scroll by a whole frame leaves one
        // painted frame in which the content is displaced by the full size of
        // the page with nothing compensating it — and because prepends fire
        // near scrollTop 0, that displacement is the whole viewport, so the
        // list paints empty.
        //
        // They cannot just be published together either. `deviation` reaches
        // the DOM through React state, so until that commit lands the content
        // has not grown and `scrollBy` is clamped to the old maxScrollTop,
        // silently losing part of the compensation — the upward jump on a large
        // prepend into a short list that the deferral was introduced to fix.
        //
        // So the scroll waits for the renderer to acknowledge the committed
        // deviation from a layout effect: after the DOM mutation, still before
        // paint. Ordering is then structural rather than a timing assumption.
        //
        // Acknowledgements are matched by value, so a compensation may only wait
        // for one when this publish actually changes the rendered deviation. If
        // it does not — a second prepend of the same size before the first has
        // been cleared — no commit and no acknowledgement can follow, and
        // waiting would leave it releasable by the *previous* prepend's
        // acknowledgement, which carries the same value. Such a compensation
        // takes the fallback instead, which is the behaviour before this change:
        // the blank frame is not removed in that case, but nothing regresses,
        // and no acknowledgement can be misattributed.
        pendingPrepend = { acknowledgeable: u.getValue(deviation) !== offset, offset }
        u.publish(deviation, offset)
        // If nothing acknowledges by the next frame — no renderer mounted, a
        // subtree without layout effects, SSR — fall back to the historic
        // deferred scroll. The worst case is the behaviour before this change,
        // never worse.
        requestAnimationFrame(compensatePrepend)
      }
    )

    return { deviation }
  },
  u.tup(domIOSystem, stateFlagsSystem, listStateSystem, sizeSystem, loggerSystem, recalcSystem)
)
