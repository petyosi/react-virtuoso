import * as u from '@virtuoso.dev/urx'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { FollowOutput } from './interfaces'
import { propsReadySystem } from './propsReadySystem'

const behaviorFromFollowOutput = (follow: FollowOutput) => (follow === 'smooth' ? 'smooth' : 'auto')

export const followOutputSystem = u.system(
  ([{ totalCount, listRefresh }, { isAtBottom }, { scrollToIndex }, { scrolledToInitialItem }, { didMount }]) => {
    const followOutput = u.statefulStream<FollowOutput>(false)

    u.subscribe(
      u.pipe(
        u.combineLatest(u.duc(totalCount), didMount),
        u.withLatestFrom(followOutput, isAtBottom, scrolledToInitialItem),
        u.filter(([[, didMount], followOutput, isAtBottom, scrolledToInitialItem]) => {
          return followOutput && isAtBottom && scrolledToInitialItem && didMount
        })
      ),
      ([[totalCount], followOutput]) => {
        u.handleNext(listRefresh, () => {
          u.publish(scrollToIndex, {
            index: totalCount - 1,
            align: 'end',
            behavior: behaviorFromFollowOutput(followOutput),
          })
        })
      }
    )

    return { followOutput }
  },
  u.tup(sizeSystem, stateFlagsSystem, scrollToIndexSystem, initialTopMostItemIndexSystem, propsReadySystem)
)
