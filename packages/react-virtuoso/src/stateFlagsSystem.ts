import { domIOSystem } from './domIOSystem'
import * as u from './urx'
import { approximatelyEqual } from './utils/approximatelyEqual'

export const UP = 'up'
export const DOWN = 'down'
const NONE = 'none'
export interface AtBottomParams {
  offsetBottom: number
  scrollHeight: number
  scrollTop: number
  viewportHeight: number
}

export type AtBottomReason = 'SCROLLED_DOWN' | 'SIZE_DECREASED'

export type AtBottomState =
  | {
      atBottom: false
      notAtBottomBecause: NotAtBottomReason
      state: AtBottomParams
    }
  | {
      atBottom: true
      atBottomBecause: AtBottomReason
      scrollTopDelta: number
      state: AtBottomParams
    }

export type NotAtBottomReason =
  | 'NOT_FULLY_SCROLLED_TO_LAST_ITEM_BOTTOM'
  | 'NOT_SHOWING_LAST_ITEM'
  | 'SCROLLING_UPWARDS'
  | 'SIZE_INCREASED'
  | 'VIEWPORT_HEIGHT_DECREASING'

export type ScrollDirection = typeof DOWN | typeof NONE | typeof UP

const INITIAL_BOTTOM_STATE = {
  atBottom: false,
  notAtBottomBecause: 'NOT_SHOWING_LAST_ITEM',
  state: {
    offsetBottom: 0,
    scrollHeight: 0,
    scrollTop: 0,
    viewportHeight: 0,
  },
} as AtBottomState

const DEFAULT_AT_TOP_THRESHOLD = 0

export const stateFlagsSystem = u.system(([{ footerHeight, headerHeight, scrollBy, scrollContainerState, scrollTop, viewportHeight }]) => {
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
      u.scan((current, [{ scrollHeight, scrollTop }, viewportHeight, _headerHeight, _footerHeight, atBottomThreshold]) => {
        const isAtBottom = scrollTop + viewportHeight - scrollHeight > -atBottomThreshold
        const state = {
          scrollHeight,
          scrollTop,
          viewportHeight,
        }

        if (isAtBottom) {
          let atBottomBecause: 'SCROLLED_DOWN' | 'SIZE_DECREASED'
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
            atBottomBecause,
            scrollTopDelta,
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

  const lastJumpDueToItemResize = u.statefulStreamFromEmitter(
    u.pipe(
      scrollContainerState,
      u.scan(
        (current, { scrollHeight, scrollTop, viewportHeight }) => {
          if (!approximatelyEqual(current.scrollHeight, scrollHeight)) {
            const atBottom = scrollHeight - (scrollTop + viewportHeight) < 1

            if (current.scrollTop !== scrollTop && atBottom) {
              return {
                changed: true,
                jump: current.scrollTop - scrollTop,
                scrollHeight,
                scrollTop,
              }
            } else {
              return {
                changed: true,
                jump: 0,
                scrollHeight,
                scrollTop,
              }
            }
          } else {
            return {
              changed: false,
              jump: 0,
              scrollHeight,
              scrollTop,
            }
          }
        },
        { changed: false, jump: 0, scrollHeight: 0, scrollTop: 0 }
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

          return { direction: scrollTop < acc.prevScrollTop ? UP : DOWN, prevScrollTop: scrollTop } as {
            direction: ScrollDirection
            prevScrollTop: number
          }
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
      u.filter(([_, isScrolling]) => isScrolling),
      u.scan(([_, prev], [next]) => [prev, next], [0, 0]),
      u.map(([prev, next]) => next - prev)
    ),
    scrollVelocity
  )

  return {
    atBottomState,
    atBottomStateChange,
    atBottomThreshold,
    atTopStateChange,
    atTopThreshold,
    isAtBottom,
    isAtTop,
    isScrolling,
    lastJumpDueToItemResize,
    scrollDirection,
    scrollVelocity,
  }
}, u.tup(domIOSystem))
