/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as u from '@virtuoso.dev/urx'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { FollowOutput, FollowOutputScalarType } from './interfaces'
import { propsReadySystem } from './propsReadySystem'

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
  ]) => {
    const followOutput = u.statefulStream<FollowOutput>(false)
    let pendingScrollHandle: any = null

    function scrollToBottom(totalCount: number, followOutputBehavior: FollowOutputScalarType) {
      u.publish(scrollToIndex, {
        index: totalCount - 1,
        align: 'end',
        behavior: followOutputBehavior,
      })
    }

    u.subscribe(
      u.pipe(
        u.combineLatest(u.pipe(u.duc(totalCount), u.skip(1)), didMount),
        u.withLatestFrom(u.duc(followOutput), isAtBottom, scrolledToInitialItem),
        u.map(([[totalCount, didMount], followOutput, isAtBottom, scrolledToInitialItem]) => {
          let shouldFollow = didMount && scrolledToInitialItem
          let followOutputBehavior: FollowOutputScalarType = 'auto'

          if (shouldFollow) {
            followOutputBehavior = behaviorFromFollowOutput(followOutput, isAtBottom)
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
          scrollToBottom(totalCount, followOutputBehavior)
          pendingScrollHandle = null
        })
      }
    )

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
      ([, followOutput, totalCount]) => {
        const cancel = u.handleNext(atBottomState, (state) => {
          if (followOutput && !state.atBottom && state.notAtBottomBecause === 'SIZE_INCREASED' && !pendingScrollHandle) {
            scrollToBottom(totalCount, 'auto')
          }
        })
        setTimeout(cancel, 100)
      }
    )

    u.subscribe(
      u.pipe(u.combineLatest(u.duc(followOutput), atBottomState), u.withLatestFrom(totalCount)),
      ([[followOutput, state], totalCount]) => {
        if (followOutput && !state.atBottom && state.notAtBottomBecause === 'VIEWPORT_HEIGHT_DECREASING') {
          scrollToBottom(totalCount, 'auto')
        }
      }
    )

    return { followOutput }
  },
  u.tup(sizeSystem, stateFlagsSystem, scrollToIndexSystem, initialTopMostItemIndexSystem, propsReadySystem)
)
