import { domIOSystem } from './domIOSystem'
import * as u from './urx'

import type { ScrollContainerState, WindowViewportInfo } from './interfaces'

export const windowScrollerSystem = u.system(([{ scrollBy, scrollContainerState, scrollTo }]) => {
  const windowScrollContainerState = u.stream<ScrollContainerState>()
  const windowViewportRect = u.stream<WindowViewportInfo>()
  const windowScrollTo = u.stream<ScrollToOptions>()
  const windowScrollBy = u.stream<ScrollToOptions>()
  const useWindowScroll = u.statefulStream(false)
  const customScrollParent = u.statefulStream<HTMLElement | undefined>(undefined)
  // the scroll container works in its own pixels and the list in its own, they differ when CSS zoom is set between them
  const latestZoomRatio = u.statefulStreamFromEmitter(
    u.pipe(
      windowViewportRect,
      u.map(({ zoomRatio }) => zoomRatio ?? 1)
    ),
    1
  )

  u.connect(
    u.pipe(
      u.combineLatest(windowScrollContainerState, windowViewportRect),
      u.map(([{ scrollTop: windowScrollTop, viewportHeight }, { listHeight, offsetTop, zoomRatio = 1 }]) => {
        return {
          scrollHeight: listHeight,
          scrollTop: Math.max(0, (windowScrollTop - offsetTop) * zoomRatio),
          viewportHeight: viewportHeight * zoomRatio,
        }
      })
    ),
    scrollContainerState
  )

  u.connect(
    u.pipe(
      scrollTo,
      u.withLatestFrom(windowViewportRect),
      u.map(([scrollTo, { offsetTop, zoomRatio = 1 }]) => {
        return {
          ...scrollTo,
          top: scrollTo.top! / zoomRatio + offsetTop,
        }
      })
    ),
    windowScrollTo
  )

  u.connect(
    u.pipe(
      scrollBy,
      u.withLatestFrom(latestZoomRatio),
      u.map(([scrollBy, zoomRatio]) => (scrollBy.top === undefined ? scrollBy : { ...scrollBy, top: scrollBy.top / zoomRatio }))
    ),
    windowScrollBy
  )

  return {
    customScrollParent,
    // config
    useWindowScroll,

    // input
    windowScrollContainerState,
    // signals
    windowScrollBy,
    windowScrollTo,

    windowViewportRect,
  }
}, u.tup(domIOSystem))
