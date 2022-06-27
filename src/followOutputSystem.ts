/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as u from '@virtuoso.dev/urx'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { FollowOutput, FollowOutputScalarType } from './interfaces'
import { propsReadySystem } from './propsReadySystem'
import { loggerSystem, LogLevel } from './loggerSystem'
import { domIOSystem } from './domIOSystem'

function normalizeFollowOutput(follow: FollowOutputScalarType): FollowOutputScalarType {
  if (!follow) {
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
    { totalCount, listRefresh },
    { isAtBottom, atBottomState },
    { scrollToIndex },
    { scrolledToInitialItem },
    { propsReady, didMount },
    { log },
    { scrollingInProgress },
  ]) => {
    const followOutput = u.statefulStream<FollowOutput>(false)
    const autoscrollToBottom = u.stream<true>()
    let pendingScrollHandle: any = null

    function scrollToBottom(followOutputBehavior: FollowOutputScalarType) {
      u.publish(scrollToIndex, {
        index: 'LAST',
        align: 'end',
        behavior: followOutputBehavior,
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
            shouldFollow = shouldFollow && !!followOutputBehavior
          }

          return { totalCount, shouldFollow, followOutputBehavior }
        }),
        u.filter(({ shouldFollow }) => shouldFollow)
      ),
      ({ totalCount, followOutputBehavior }) => {
        if (pendingScrollHandle) {
          pendingScrollHandle()
          pendingScrollHandle = null
        }

        pendingScrollHandle = u.handleNext(listRefresh, () => {
          u.getValue(log)('following output to ', { totalCount }, LogLevel.DEBUG)
          scrollToBottom(followOutputBehavior)
          pendingScrollHandle = null
        })
      }
    )

    function trapNextSizeIncrease(followOutput: boolean) {
      const cancel = u.handleNext(atBottomState, (state) => {
        if (followOutput && !state.atBottom && state.notAtBottomBecause === 'SIZE_INCREASED' && !pendingScrollHandle) {
          u.getValue(log)('scrolling to bottom due to increased size', {}, LogLevel.DEBUG)
          scrollToBottom('auto')
        }
      })
      setTimeout(cancel, 100)
    }

    u.subscribe(
      u.pipe(
        u.combineLatest(u.duc(followOutput), totalCount, propsReady),
        u.filter(([follow, , ready]) => follow && ready),
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
        trapNextSizeIncrease(followOutput !== false)
      }
    )

    u.subscribe(autoscrollToBottom, () => {
      trapNextSizeIncrease(u.getValue(followOutput) !== false)
    })

    u.subscribe(u.combineLatest(u.duc(followOutput), atBottomState), ([followOutput, state]) => {
      if (followOutput && !state.atBottom && state.notAtBottomBecause === 'VIEWPORT_HEIGHT_DECREASING') {
        scrollToBottom('auto')
      }
    })

    return { followOutput, autoscrollToBottom }
  },
  u.tup(sizeSystem, stateFlagsSystem, scrollToIndexSystem, initialTopMostItemIndexSystem, propsReadySystem, loggerSystem, domIOSystem)
)
