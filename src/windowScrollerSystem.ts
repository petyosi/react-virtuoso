import * as u from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'
import { WindowViewportInfo } from './interfaces'

export const windowScrollerSystem = u.system(([{ scrollTo, scrollContainerState }]) => {
  const windowScrollContainerState = u.stream<[number, number]>()
  const windowViewportRect = u.stream<WindowViewportInfo>()
  const windowScrollTo = u.stream<ScrollToOptions>()
  const useWindowScroll = u.statefulStream(false)

  u.connect(
    u.pipe(
      u.combineLatest(windowScrollContainerState, windowViewportRect),
      u.map(([[windowScrollTop, scrollHeight], { offsetTop }]) => {
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

    // input
    windowScrollContainerState,
    windowViewportRect,

    // signals
    windowScrollTo,
  }
}, u.tup(domIOSystem))
