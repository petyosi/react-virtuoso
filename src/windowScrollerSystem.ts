import * as u from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'
import { WindowViewportInfo, ScrollContainerState } from './interfaces'

export const windowScrollerSystem = u.system(([{ scrollTo, scrollContainerState }]) => {
  const windowScrollContainerState = u.stream<ScrollContainerState>()
  const windowViewportRect = u.stream<WindowViewportInfo>()
  const windowScrollTo = u.stream<ScrollToOptions>()
  const useWindowScroll = u.statefulStream(false)
  const customScrollParent = u.statefulStream<HTMLElement | undefined>(undefined)

  u.connect(
    u.pipe(
      u.combineLatest(windowScrollContainerState, windowViewportRect),
      u.map(([{ scrollTop: windowScrollTop, scrollHeight }, { offsetTop }]) => {
        return [Math.max(0, windowScrollTop - offsetTop), scrollHeight]
      })
    ),
    scrollContainerState
  )

  u.connect(
    u.pipe(
      scrollTo,
      u.withLatestFrom(windowViewportRect),
      u.map(([scrollTo, { offsetTop }]) => {
        return {
          ...scrollTo,
          top: scrollTo.top! + offsetTop,
        }
      })
    ),
    windowScrollTo
  )

  return {
    // config
    useWindowScroll,
    customScrollParent,

    // input
    windowScrollContainerState,
    windowViewportRect,

    // signals
    windowScrollTo,
  }
}, u.tup(domIOSystem))
