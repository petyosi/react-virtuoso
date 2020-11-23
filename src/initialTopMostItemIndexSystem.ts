import {
  connect,
  duc,
  system,
  filter,
  mapTo,
  pipe,
  statefulStream,
  subscribe,
  combineLatest,
  tup,
  handleNext,
  publish,
  Operator,
  getValue,
} from '@virtuoso.dev/urx'
import { empty } from './AATree'
import { sizeSystem } from './sizeSystem'
import { domIOSystem } from './domIOSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'

function take<T>(times = 1): Operator<T> {
  return done => value => {
    if (times-- > 0) {
      done(value)
    }
  }
}

export const initialTopMostItemIndexSystem = system(
  ([{ sizes, listRefresh }, { scrollTop }, { scrollToIndex }]) => {
    const scrolledToInitialItem = statefulStream(true)
    const initialTopMostItemIndex = statefulStream(0)

    connect(
      pipe(
        duc(initialTopMostItemIndex),
        filter(index => index !== 0),
        take(1),
        mapTo(false)
      ),
      scrolledToInitialItem
    )

    subscribe(
      combineLatest(duc(initialTopMostItemIndex), duc(scrolledToInitialItem), listRefresh),
      ([initialTopMostItemIndex, scrolledTo, _]) => {
        const state = getValue(sizes)
        if (!empty(state.sizeTree) && !scrolledTo) {
          handleNext(scrollTop, () => {
            publish(scrolledToInitialItem, true)
          })

          publish(scrollToIndex, initialTopMostItemIndex)
        }
      }
    )

    return {
      scrolledToInitialItem,
      initialTopMostItemIndex,
    }
  },
  tup(sizeSystem, domIOSystem, scrollToIndexSystem),
  { singleton: true }
)
