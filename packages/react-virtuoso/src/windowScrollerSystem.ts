import { domIOSystem } from './domIOSystem'
import { ScrollContainerState, WindowViewportInfo } from './interfaces'
import * as u from './urx'

export const windowScrollerSystem = u.system(([{ scrollContainerState, scrollTo }]) => {
  const windowScrollContainerState = u.stream<ScrollContainerState>()
  const windowViewportRect = u.stream<WindowViewportInfo>()
  const windowScrollTo = u.stream<ScrollToOptions>()
  const useWindowScroll = u.statefulStream(false)
  const customScrollParent = u.statefulStream<HTMLElement | undefined>(undefined)

  u.connect(
    u.pipe(
      u.combineLatest(windowScrollContainerState, windowViewportRect),
      u.map(([{ scrollHeight, scrollTop: windowScrollTop, viewportHeight }, { offsetTop }]) => {
        return {
          scrollHeight,
          scrollTop: Math.max(0, windowScrollTop - offsetTop),
          viewportHeight,
        }
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
    customScrollParent,
    // config
    useWindowScroll,

    // input
    windowScrollContainerState,
    // signals
    windowScrollTo,

    windowViewportRect,
  }
}, u.tup(domIOSystem))
