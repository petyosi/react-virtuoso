import { filter, handleNext, pipe, publish, statefulStream, subscribe, system, tup, withLatestFrom } from '@virtuoso.dev/urx'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'

export type FollowOutput = boolean | 'smooth' | 'auto'

const behaviorFromFollowOutput = (follow: FollowOutput) => (follow === 'smooth' ? 'smooth' : 'auto')

export const followOutputSystem = system(([{ totalCount, listRefresh }, { isAtBottom }, { scrollToIndex }]) => {
  const followOutput = statefulStream<FollowOutput>(false)

  subscribe(
    pipe(
      totalCount,
      withLatestFrom(followOutput, isAtBottom),
      filter(([_, followOutput, isAtBottom]) => {
        return followOutput && isAtBottom
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
}, tup(sizeSystem, stateFlagsSystem, scrollToIndexSystem))
