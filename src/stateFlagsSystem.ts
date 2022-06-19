import * as u from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'
import { approximatelyEqual } from './utils/approximatelyEqual'

export const UP = 'up' as const
export const DOWN = 'down' as const
export const NONE = 'none' as const
export type ScrollDirection = typeof UP | typeof DOWN | typeof NONE

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

export type AtBottomReason = 'SIZE_DECREASED' | 'SCROLLED_DOWN'

export type AtBottomState =
  | {
      atBottom: false
      notAtBottomBecause: NotAtBottomReason
      state: AtBottomParams
    }
  | {
      atBottom: true
      state: AtBottomParams
      atBottomBecause: AtBottomReason
      scrollTopDelta: number
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

const DEFAULT_AT_TOP_THRESHOLD = 0

export const stateFlagsSystem = u.system(([{ scrollContainerState, scrollTop, viewportHeight, headerHeight, footerHeight, scrollBy }]) => {
  const isAtBottom = u.statefulStream(false)
  const isAtTop = u.statefulStream(true)
  const atBottomStateChange = u.stream<boolean>()
  const atTopStateChange = u.stream<boolean>()
  const atBottomThreshold = u.statefulStream(4)
  const atTopThreshold = u.statefulStream(DEFAULT_AT_TOP_THRESHOLD)

  // skip 1 to avoid an initial on/off flick
  const isScrolling = u.statefulStreamFromEmitter(
    u.pipe(
      u.merge(u.pipe(u.duc(scrollTop), u.skip(1), u.mapTo(true)), u.pipe(u.duc(scrollTop), u.skip(1), u.mapTo(false), u.debounceTime(100))),
      u.distinctUntilChanged()
    ),
    false
  )

  const isScrollingBy = u.statefulStreamFromEmitter(
    u.pipe(u.merge(u.pipe(scrollBy, u.mapTo(true)), u.pipe(scrollBy, u.mapTo(false), u.debounceTime(200))), u.distinctUntilChanged()),
    false
  )

  // u.subscribe(isScrollingBy, (isScrollingBy) => console.log({ isScrollingBy }))

  u.connect(
    u.pipe(
      u.combineLatest(u.duc(scrollTop), u.duc(atTopThreshold)),
      u.map(([top, atTopThreshold]) => top <= atTopThreshold),
      u.distinctUntilChanged()
    ),
    isAtTop
  )

  u.connect(u.pipe(isAtTop, u.throttleTime(50)), atTopStateChange)

  const atBottomState = u.streamFromEmitter(
    u.pipe(
      u.combineLatest(scrollContainerState, u.duc(viewportHeight), u.duc(headerHeight), u.duc(footerHeight), u.duc(atBottomThreshold)),
      u.scan((current, [{ scrollTop, scrollHeight }, viewportHeight, _headerHeight, _footerHeight, atBottomThreshold]) => {
        const isAtBottom = scrollTop + viewportHeight - scrollHeight > -atBottomThreshold
        const state = {
          viewportHeight,
          scrollTop,
          scrollHeight,
        }

        if (isAtBottom) {
          let atBottomBecause: 'SIZE_DECREASED' | 'SCROLLED_DOWN'
          let scrollTopDelta: number
          if (scrollTop > current.state.scrollTop) {
            atBottomBecause = 'SCROLLED_DOWN'
            scrollTopDelta = current.state.scrollTop - scrollTop
          } else {
            atBottomBecause = 'SIZE_DECREASED'
            scrollTopDelta = current.state.scrollTop - scrollTop || (current as { scrollTopDelta: number }).scrollTopDelta
          }
          return {
            atBottom: true,
            state,
            atBottomBecause,
            scrollTopDelta,
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

  const lastJumpDueToItemResize = u.statefulStreamFromEmitter(
    u.pipe(
      scrollContainerState,
      u.scan(
        (current, { scrollTop, scrollHeight, viewportHeight }) => {
          if (!approximatelyEqual(current.scrollHeight, scrollHeight)) {
            const atBottom = scrollHeight - (scrollTop + viewportHeight) < 1

            if (current.scrollTop !== scrollTop && atBottom) {
              return {
                scrollHeight,
                scrollTop,
                jump: current.scrollTop - scrollTop,
                changed: true,
              }
            } else {
              return {
                scrollHeight,
                scrollTop,
                jump: 0,
                changed: true,
              }
            }
          } else {
            return {
              scrollTop,
              scrollHeight,
              jump: 0,
              changed: false,
            }
          }
        },
        { scrollHeight: 0, jump: 0, scrollTop: 0, changed: false }
      ),
      u.filter((value) => value.changed),
      u.map((value) => value.jump)
    ),
    0
  )

  u.connect(
    u.pipe(
      atBottomState,
      u.map((state) => state.atBottom)
    ),
    isAtBottom
  )

  u.connect(u.pipe(isAtBottom, u.throttleTime(50)), atBottomStateChange)

  const scrollDirection = u.statefulStream<ScrollDirection>(DOWN)

  u.connect(
    u.pipe(
      scrollContainerState,
      u.map(({ scrollTop }) => scrollTop),
      u.distinctUntilChanged(),
      u.scan(
        (acc, scrollTop) => {
          // if things change while compensating for items, ignore,
          // but store the new scrollTop
          if (u.getValue(isScrollingBy)) {
            return { direction: acc.direction, prevScrollTop: scrollTop }
          }

          return { direction: scrollTop < acc.prevScrollTop ? UP : DOWN, prevScrollTop: scrollTop }
        },
        { direction: DOWN, prevScrollTop: 0 } as { direction: ScrollDirection; prevScrollTop: number }
      ),
      u.map((value) => value.direction)
    ),
    scrollDirection
  )

  u.connect(u.pipe(scrollContainerState, u.throttleTime(50), u.mapTo(NONE)), scrollDirection)

  const scrollVelocity = u.statefulStream(0)

  u.connect(
    u.pipe(
      isScrolling,
      u.filter((value) => !value),
      u.mapTo(0)
    ),
    scrollVelocity
  )

  u.connect(
    u.pipe(
      scrollTop,
      u.throttleTime(100),
      u.withLatestFrom(isScrolling),
      u.filter(([_, isScrolling]) => !!isScrolling),
      u.scan(([_, prev], [next]) => [prev, next], [0, 0]),
      u.map(([prev, next]) => next - prev)
    ),
    scrollVelocity
  )

  return {
    isScrolling,
    isAtTop,
    isAtBottom,
    atBottomState,
    atTopStateChange,
    atBottomStateChange,
    scrollDirection,
    atBottomThreshold,
    atTopThreshold,
    scrollVelocity,
    lastJumpDueToItemResize,
  }
}, u.tup(domIOSystem))
