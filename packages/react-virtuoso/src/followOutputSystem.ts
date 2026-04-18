import { contextSystem } from './contextSystem'
import { domIOSystem } from './domIOSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { loggerSystem, LogLevel } from './loggerSystem'
import { propsReadySystem } from './propsReadySystem'
import { scrollIntoViewSystem } from './scrollIntoViewSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import * as u from './urx'

import type { FollowOutput, FollowOutputScalarType, ScrollIntoViewLocation } from './interfaces'

function normalizeFollowOutput(follow: FollowOutputScalarType): FollowOutputScalarType {
  if (follow === false) {
    return false
  }
  return follow === 'smooth' ? 'smooth' : 'auto'
}

const behaviorFromFollowOutput = (follow: FollowOutput, isAtBottom: boolean) => {
  if (typeof follow === 'function') {
    return normalizeFollowOutput(follow(isAtBottom))
  }
  return isAtBottom && normalizeFollowOutput(follow)
}

export const followOutputSystem = u.system(
  ([
    { listRefresh, totalCount, fixedItemSize, data },
    { atBottomState, isAtBottom },
    { scrollToIndex },
    { scrolledToInitialItem },
    { didMount, propsReady },
    { log },
    { scrollingInProgress },
    { context },
    { scrollIntoView },
  ]) => {
    const followOutput = u.statefulStream<FollowOutput>(false)
    const autoscrollToBottom = u.stream<true>()
    let pendingScrollHandle: any = null

    function scrollToBottom(followOutputBehavior: FollowOutputScalarType) {
      u.publish(scrollToIndex, {
        align: 'end',
        behavior: followOutputBehavior,
        index: 'LAST',
      })
    }

    u.subscribe(
      u.pipe(
        u.combineLatest(u.pipe(u.duc(totalCount), u.skip(1)), didMount),
        u.withLatestFrom(u.duc(followOutput), isAtBottom, scrolledToInitialItem, scrollingInProgress),
        u.map(([[totalCount, didMount], followOutput, isAtBottom, scrolledToInitialItem, scrollingInProgress]) => {
          let shouldFollow = didMount && scrolledToInitialItem
          let followOutputBehavior: FollowOutputScalarType = 'auto'

          if (shouldFollow) {
            // if scrolling to index is in progress,
            // assume that a previous followOutput response is going
            followOutputBehavior = behaviorFromFollowOutput(followOutput, isAtBottom || scrollingInProgress)
            shouldFollow = shouldFollow && followOutputBehavior !== false
          }

          return { followOutputBehavior, shouldFollow, totalCount }
        }),
        u.filter(({ shouldFollow }) => shouldFollow)
      ),
      ({ followOutputBehavior, totalCount }) => {
        if (pendingScrollHandle !== null) {
          pendingScrollHandle()
          pendingScrollHandle = null
        }

        // if the items have fixed size, we can scroll immediately
        if (u.getValue(fixedItemSize) === undefined) {
          pendingScrollHandle = u.handleNext(listRefresh, () => {
            u.getValue(log)('following output to ', { totalCount }, LogLevel.DEBUG)
            scrollToBottom(followOutputBehavior)
            pendingScrollHandle = null
          })
        } else {
          requestAnimationFrame(() => {
            u.getValue(log)('following output to ', { totalCount }, LogLevel.DEBUG)
            scrollToBottom(followOutputBehavior)
          })
        }
      }
    )

    function trapNextSizeIncrease(followOutput: boolean) {
      const cancel = u.handleNext(atBottomState, (state) => {
        if (followOutput && !state.atBottom && state.notAtBottomBecause === 'SIZE_INCREASED' && pendingScrollHandle === null) {
          u.getValue(log)('scrolling to bottom due to increased size', {}, LogLevel.DEBUG)
          scrollToBottom('auto')
        }
      })
      setTimeout(cancel, 100)
    }

    u.subscribe(
      u.pipe(
        u.combineLatest(u.duc(followOutput), totalCount, propsReady),
        u.filter(([follow, , ready]) => follow !== false && ready),
        u.scan(
          ({ value }, [, next]) => {
            return { refreshed: value === next, value: next }
          },
          { refreshed: false, value: 0 }
        ),
        u.filter(({ refreshed }) => refreshed),
        u.withLatestFrom(followOutput, totalCount)
      ),
      ([, followOutput]) => {
        // activate adjustment only if the initial item is already scrolled to
        if (u.getValue(scrolledToInitialItem)) {
          trapNextSizeIncrease(followOutput !== false)
        }
      }
    )

    u.subscribe(autoscrollToBottom, () => {
      trapNextSizeIncrease(u.getValue(followOutput) !== false)
    })

    u.subscribe(u.combineLatest(u.duc(followOutput), atBottomState), ([followOutput, state]) => {
      if (followOutput !== false && !state.atBottom && state.notAtBottomBecause === 'VIEWPORT_HEIGHT_DECREASING') {
        scrollToBottom('auto')
      }
    })

    const scrollIntoViewOnChange = u.statefulStream<
      | null
      | ((params: {
          context: unknown
          totalCount: number
          scrollingInProgress: boolean
        }) => ScrollIntoViewLocation | null | undefined | false)
    >(null)

    const tcOrDataChange = u.stream<number>()

    u.connect(
      u.merge(
        u.pipe(
          u.duc(data),
          u.map((data) => data?.length ?? 0)
        ),
        u.pipe(u.duc(totalCount))
      ),
      tcOrDataChange
    )

    u.subscribe(
      u.pipe(
        u.combineLatest(u.pipe(tcOrDataChange, u.skip(1)), didMount),
        u.withLatestFrom(u.duc(scrollIntoViewOnChange), scrolledToInitialItem, scrollingInProgress, context),
        u.map(([[totalCount, didMount], scrollIntoViewOnChange, scrolledToInitialItem, scrollingInProgress, context]) => {
          return didMount && scrolledToInitialItem && scrollIntoViewOnChange?.({ context, totalCount, scrollingInProgress })
        }),
        u.filter((viewLocation) => Boolean(viewLocation)),
        u.throttleTime(0)
      ),
      (viewLocation) => {
        if (pendingScrollHandle !== null) {
          pendingScrollHandle()
          pendingScrollHandle = null
        }

        // if the items have fixed size, we can scroll immediately
        if (u.getValue(fixedItemSize) === undefined) {
          pendingScrollHandle = u.handleNext(listRefresh, () => {
            u.getValue(log)('scrolling into view', {})
            u.publish(scrollIntoView, viewLocation)
            pendingScrollHandle = null
          })
        } else {
          requestAnimationFrame(() => {
            u.getValue(log)('scrolling into view', {})
            u.publish(scrollIntoView, viewLocation)
          })
        }
      }
    )

    return { autoscrollToBottom, followOutput, scrollIntoViewOnChange }
  },
  u.tup(
    sizeSystem,
    stateFlagsSystem,
    scrollToIndexSystem,
    initialTopMostItemIndexSystem,
    propsReadySystem,
    loggerSystem,
    domIOSystem,
    contextSystem,
    scrollIntoViewSystem
  )
)
