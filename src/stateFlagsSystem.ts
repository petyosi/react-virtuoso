import * as u from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'

export interface ListBottomInfo {
  bottom: number
  offsetBottom: number
}

export interface AtBottomParams {
  offsetBottom: number
  scrollTop: number
  viewportHeight: number
  totalHeight: number
}

export type NotAtBottomReason =
  | 'SIZE_INCREASED'
  | 'NOT_SHOWING_LAST_ITEM'
  | 'VIEWPORT_HEIGHT_DECREASING'
  | 'SCROLLING_UPWARDS'
  | 'NOT_FULLY_SCROLLED_TO_LAST_ITEM_BOTTOM'

export type AtBottomState =
  | {
      atBottom: false
      notAtBottomBecause: NotAtBottomReason
      state: AtBottomParams
    }
  | {
      atBottom: true
      state: AtBottomParams
    }

const INITIAL_BOTTOM_STATE = {
  atBottom: false,
  notAtBottomBecause: 'NOT_SHOWING_LAST_ITEM',
  state: {
    offsetBottom: 0,
    scrollTop: 0,
    viewportHeight: 0,
    totalHeight: 0,
  },
} as AtBottomState

const BOTTOM_THRESHOLD_TOLERANCE = 4

export const stateFlagsSystem = u.system(([{ scrollTop, viewportHeight, headerHeight, footerHeight }]) => {
  const isAtBottom = u.statefulStream(false)
  const isAtTop = u.statefulStream(true)
  const atBottomStateChange = u.stream<boolean>()
  const atTopStateChange = u.stream<boolean>()
  const listStateListener = u.stream<ListBottomInfo>()

  // skip 1 to avoid an initial on/off flick
  const isScrolling = u.streamFromEmitter(
    u.pipe(
      u.merge(u.pipe(u.duc(scrollTop), u.skip(1), u.mapTo(true)), u.pipe(u.duc(scrollTop), u.skip(1), u.mapTo(false), u.debounceTime(100))),
      u.distinctUntilChanged()
    )
  )

  u.connect(
    u.pipe(
      u.duc(scrollTop),
      u.map((top) => top === 0),
      u.distinctUntilChanged()
    ),
    isAtTop
  )

  u.connect(isAtTop, atTopStateChange)

  const atBottomState = u.streamFromEmitter(
    u.pipe(
      u.combineLatest(listStateListener, u.duc(scrollTop), u.duc(viewportHeight), u.duc(headerHeight), u.duc(footerHeight)),
      u.scan((current, [{ bottom, offsetBottom }, scrollTop, viewportHeight, headerHeight, footerHeight]) => {
        const viewportContentsHeight = bottom + headerHeight + footerHeight
        const isAtBottom = offsetBottom === 0 && scrollTop + viewportHeight - viewportContentsHeight > -BOTTOM_THRESHOLD_TOLERANCE
        const state = {
          viewportHeight,
          scrollTop,
          offsetBottom,
          totalHeight: bottom + offsetBottom,
        }

        if (isAtBottom) {
          return {
            atBottom: true,
            state,
          } as AtBottomState
        }

        let notAtBottomBecause: NotAtBottomReason

        if (state.totalHeight > current.state.totalHeight) {
          notAtBottomBecause = 'SIZE_INCREASED'
        } else if (offsetBottom !== 0) {
          notAtBottomBecause = 'NOT_SHOWING_LAST_ITEM'
        } else if (viewportHeight < current.state.viewportHeight) {
          notAtBottomBecause = 'VIEWPORT_HEIGHT_DECREASING'
        } else if (scrollTop < current.state.scrollTop) {
          notAtBottomBecause = 'SCROLLING_UPWARDS'
        } else {
          notAtBottomBecause = 'NOT_FULLY_SCROLLED_TO_LAST_ITEM_BOTTOM'
        }

        return {
          atBottom: false,
          notAtBottomBecause,
          state,
        } as AtBottomState
      }, INITIAL_BOTTOM_STATE),
      u.distinctUntilChanged((prev, next) => {
        // prev && console.log(prev.atBottom, next.atBottom)
        return prev && prev.atBottom === next.atBottom
      })
    )
  )

  u.connect(
    u.pipe(
      atBottomState,
      u.map((state) => state.atBottom)
    ),
    isAtBottom
  )

  u.subscribe(isAtBottom, (value) => {
    setTimeout(() => u.publish(atBottomStateChange, value))
  })

  // connect(isAtBottom, atBottomStateChange)

  return { isScrolling, isAtTop, isAtBottom, atBottomState, atTopStateChange, atBottomStateChange, listStateListener }
}, u.tup(domIOSystem))
