import * as u from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'

export const UP = 'up' as const
export const DOWN = 'down' as const
export type ScrollDirection = typeof UP | typeof DOWN

export interface ListBottomInfo {
  bottom: number
  offsetBottom: number
}

export interface AtBottomParams {
  offsetBottom: number
  scrollTop: number
  viewportHeight: number
  scrollHeight: number
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
    scrollHeight: 0,
  },
} as AtBottomState

export const stateFlagsSystem = u.system(([{ scrollTop, viewportHeight, headerHeight, footerHeight, scrollHeight }]) => {
  const isAtBottom = u.statefulStream(false)
  const isAtTop = u.statefulStream(true)
  const atBottomStateChange = u.stream<boolean>()
  const atTopStateChange = u.stream<boolean>()
  const atBottomThreshold = u.statefulStream(4)

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
      u.combineLatest(
        scrollHeight,
        u.duc(scrollTop),
        u.duc(viewportHeight),
        u.duc(headerHeight),
        u.duc(footerHeight),
        u.duc(atBottomThreshold)
      ),
      u.scan((current, [scrollHeight, scrollTop, viewportHeight, _headerHeight, _footerHeight, atBottomThreshold]) => {
        const isAtBottom = scrollTop + viewportHeight - scrollHeight > -atBottomThreshold
        const state = {
          viewportHeight,
          scrollTop,
          scrollHeight,
        }

        if (isAtBottom) {
          return {
            atBottom: true,
            state,
          } as AtBottomState
        }

        let notAtBottomBecause: NotAtBottomReason

        if (state.scrollHeight > current.state.scrollHeight) {
          notAtBottomBecause = 'SIZE_INCREASED'
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

  const scrollDirection = u.statefulStream<ScrollDirection>(DOWN)

  u.connect(
    u.pipe(
      scrollTop,
      u.scan(
        (acc, scrollTop) => {
          return { direction: scrollTop < acc.prevScrollTop && !u.getValue(isAtBottom) ? UP : DOWN, prevScrollTop: scrollTop }
        },
        { direction: DOWN, prevScrollTop: 0 } as { direction: ScrollDirection; prevScrollTop: number }
      ),
      u.map((value) => value.direction)
    ),
    scrollDirection
  )

  // connect(isAtBottom, atBottomStateChange)

  return { isScrolling, isAtTop, isAtBottom, atBottomState, atTopStateChange, atBottomStateChange, scrollDirection, atBottomThreshold }
}, u.tup(domIOSystem))
