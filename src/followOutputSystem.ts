import { duc, filter, handleNext, pipe, publish, statefulStream, subscribe, system, tup, withLatestFrom } from '@virtuoso.dev/urx'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'

export type FollowOutput = boolean | 'smooth' | 'auto'

const behaviorFromFollowOutput = (follow: FollowOutput) => (follow === 'smooth' ? 'smooth' : 'auto')

export const followOutputSystem = system(([{ totalCount, listRefresh }, { isAtBottom }, { scrollToIndex }, { scrolledToInitialItem }]) => {
  const followOutput = statefulStream<FollowOutput>(false)

  subscribe(
    pipe(
      duc(totalCount),
      withLatestFrom(followOutput, isAtBottom, scrolledToInitialItem),
      filter(([_, followOutput, isAtBottom, scrolledToInitialItem]) => {
        return followOutput && isAtBottom && scrolledToInitialItem
      })
    ),
    ([totalCount, followOutput]) => {
      handleNext(listRefresh, () => {
        publish(scrollToIndex, {
          index: totalCount - 1,
          align: 'end',
          behavior: behaviorFromFollowOutput(followOutput),
        })
      })
    }
  )

  // subscribe(isAtBottom, value => console.log(value))
  return { followOutput }
}, tup(sizeSystem, stateFlagsSystem, scrollToIndexSystem, initialTopMostItemIndexSystem))
