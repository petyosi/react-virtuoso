import { domIOSystem } from './domIOSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { ScrollContainerState, StateCallback, StateSnapshot, WindowViewportInfo } from './interfaces'
import { propsReadySystem } from './propsReadySystem'
import { sizeSystem, sizeTreeToRanges } from './sizeSystem'
import * as u from './urx'
import { windowScrollerSystem } from './windowScrollerSystem'

export const stateLoadSystem = u.system(
  ([
    { sizeRanges, sizes },
    { headerHeight, scrollTop },
    { initialTopMostItemIndex },
    { didMount },
    { useWindowScroll, windowScrollContainerState, windowViewportRect },
  ]) => {
    const getState = u.stream<StateCallback>()
    const restoreStateFrom = u.statefulStream<StateSnapshot | undefined>(undefined)

    const statefulWindowScrollContainerState = u.statefulStream<null | ScrollContainerState>(null)
    const statefulWindowViewportRect = u.statefulStream<null | WindowViewportInfo>(null)

    u.connect(windowScrollContainerState, statefulWindowScrollContainerState)
    u.connect(windowViewportRect, statefulWindowViewportRect)

    u.subscribe(
      u.pipe(
        getState,
        u.withLatestFrom(sizes, scrollTop, useWindowScroll, statefulWindowScrollContainerState, statefulWindowViewportRect, headerHeight)
      ),
      ([callback, sizes, scrollTop, useWindowScroll, windowScrollContainerState, windowViewportRect, headerHeight]) => {
        const ranges = sizeTreeToRanges(sizes.sizeTree)
        if (useWindowScroll && windowScrollContainerState !== null && windowViewportRect !== null) {
          scrollTop = windowScrollContainerState.scrollTop - windowViewportRect.offsetTop
        }
        scrollTop -= headerHeight
        callback({ ranges, scrollTop })
      }
    )

    u.connect(u.pipe(restoreStateFrom, u.filter(u.isDefined), u.map(locationFromSnapshot)), initialTopMostItemIndex)

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(restoreStateFrom),
        u.filter(([, state]) => state !== undefined),
        u.distinctUntilChanged(),
        u.map(([, snapshot]) => {
          return snapshot!.ranges
        })
      ),
      sizeRanges
    )

    return {
      getState,
      restoreStateFrom,
    }
  },
  u.tup(sizeSystem, domIOSystem, initialTopMostItemIndexSystem, propsReadySystem, windowScrollerSystem)
)

function locationFromSnapshot(snapshot: StateSnapshot | undefined) {
  return { align: 'start', index: 0, offset: snapshot!.scrollTop }
}
