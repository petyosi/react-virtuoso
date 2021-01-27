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
  ([{ totalCount, listRefresh }, { isAtBottom }, { scrollToIndex }, { scrolledToInitialItem }, { didMount }]) => {
    const followOutput = u.statefulStream<FollowOutput>(false)

    u.subscribe(
      u.pipe(
        u.combineLatest(u.duc(totalCount), didMount),
        u.withLatestFrom(followOutput, isAtBottom, scrolledToInitialItem),
        u.map(([[totalCount, didMount], followOutput, isAtBottom, scrolledToInitialItem]) => {
          let shouldFollow = didMount && scrolledToInitialItem
          let followOutputBehavior: FollowOutputScalarType = 'auto'

          if (shouldFollow) {
            followOutputBehavior = behaviorFromFollowOutput(followOutput, isAtBottom)
            shouldFollow = shouldFollow && !!followOutputBehavior
          }

          return { totalCount, shouldFollow, followOutputBehavior }
        }),
        u.filter(u.prop('shouldFollow'))
      ),
      ({ totalCount, followOutputBehavior }) => {
        u.handleNext(listRefresh, () => {
          u.publish(scrollToIndex, {
            index: totalCount - 1,
            align: 'end',
            behavior: followOutputBehavior,
          })
        })
      }
    )

    return { followOutput }
  },
  u.tup(sizeSystem, stateFlagsSystem, scrollToIndexSystem, initialTopMostItemIndexSystem, propsReadySystem)
)
