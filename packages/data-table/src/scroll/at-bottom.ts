import { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { sizeState$ } from '../resize/sizes'
import { empty } from '../sizing/AATree'
import { approximatelyEqual } from '../utils'
import {
  customScrollParent$,
  tableBodyForceBottomSpace$,
  tableBodyMarginTop$,
  scrollBy$,
  scrollHeight$,
  scrollTop$,
  useWindowScroll$,
  viewportHeight$,
  viewportWidth$,
} from './dom'
import { DOWN, lastJumpDueToRowResize$, NONE, scrollDirection$, UP, atBottomThreshold$, atTopThreshold$ } from './state'

import type { ScrollDirection } from './state'
import type { Operator } from '@virtuoso.dev/reactive-engine-core'

export { UP, DOWN, NONE, scrollDirection$, lastJumpDueToRowResize$ } from './state'
export type { ScrollDirection } from './state'
export { atBottomThreshold$, atTopThreshold$, isScrollingToBottom$ } from './state'

export interface ListBottomInfo {
  bottom: number
  offsetBottom: number
}

export interface AtBottomParams {
  offsetBottom: number
  scrollTop: number
  viewportHeight: number
  viewportWidth: number
  scrollHeight: number
  tableBodyMarginTop: number
}

export type NotAtBottomReason =
  | 'SIZE_INCREASED'
  | 'NOT_SHOWING_LAST_ITEM'
  | 'VIEWPORT_HEIGHT_DECREASING'
  | 'VIEWPORT_WIDTH_DECREASING'
  | 'SCROLLING_UPWARDS'
  | 'NOT_FULLY_SCROLLED_TO_LAST_ITEM_BOTTOM'

export type AtBottomReason = 'SIZE_DECREASED' | 'SCROLLED_DOWN' | 'LIST_TOO_SHORT'

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
    viewportWidth: 0,
    scrollHeight: 0,
  },
} as AtBottomState

export function skip<I>(skips: number) {
  return ((source, engine) => {
    const sink = engine.streamInstance<I>()
    engine.sub(source, (value) => {
      if (skips > 0) {
        skips--
      } else {
        engine.pub(sink, value)
      }
    })
    return sink
  }) as Operator<I, I>
}

export const isAtBottom$ = Cell(false)
export const isAtTop$ = Cell(true)
export const atBottomStateChange$ = Stream<boolean>()
export const atTopStateChange$ = Stream<boolean>()

e.link(e.pipe(isAtTop$, e.throttleTime(50)), atTopStateChange$)

e.link(
  e.pipe(
    e.combine(scrollTop$, atTopThreshold$),
    e.map(([top, atTopThreshold]) => top <= atTopThreshold)
  ),
  isAtTop$
)

export const isScrolling$ = Cell(false)
e.link(e.pipe(scrollTop$, skip(1), e.mapTo(true)), isScrolling$)
e.link(e.pipe(scrollTop$, skip(1), e.mapTo(false), e.debounceTime(100)), isScrolling$)

export const isScrollingBy$ = Cell(false)

e.link(e.pipe(scrollBy$, e.mapTo(true)), isScrollingBy$)
e.link(e.pipe(scrollBy$, e.mapTo(false), e.debounceTime(200)), isScrollingBy$)

export const shouldScrollDueToSizeIncrease$ = Cell(false)

export const atBottomState$ = Cell<AtBottomState | null>(null, (prev, next) => {
  if (!prev) {
    return false
  }
  if (prev.atBottom !== next?.atBottom) {
    return false
  }
  if (!prev.atBottom && !next.atBottom) {
    return prev.notAtBottomBecause === next.notAtBottomBecause
  }

  return true
})

e.link(
  e.pipe(
    e.combine(
      scrollHeight$,
      scrollTop$,
      viewportHeight$,
      viewportWidth$,
      atBottomThreshold$,
      tableBodyMarginTop$,
      tableBodyForceBottomSpace$,
      sizeState$
    ),
    e.filter(([, , , , , , , { sizeTree }]) => !empty(sizeTree)),
    e.scan((current, [scrollHeight, scrollTop, viewportHeight, viewportWidth, atBottomThreshold, tableBodyMarginTop]) => {
      const bottomOffset = scrollTop + viewportHeight - scrollHeight + tableBodyMarginTop
      const isAtBottom = bottomOffset > -atBottomThreshold

      const state = {
        viewportWidth,
        viewportHeight,
        scrollTop,
        scrollHeight,
        tableBodyMarginTop,
      }

      if (isAtBottom) {
        let atBottomBecause: 'SIZE_DECREASED' | 'SCROLLED_DOWN' | 'LIST_TOO_SHORT'
        let scrollTopDelta: number
        if (scrollTop > current.state.scrollTop) {
          atBottomBecause = 'SCROLLED_DOWN'
          scrollTopDelta = current.state.scrollTop - scrollTop
        } else {
          atBottomBecause = scrollHeight === viewportHeight ? 'LIST_TOO_SHORT' : 'SIZE_DECREASED'
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

      if (viewportHeight < current.state.viewportHeight) {
        notAtBottomBecause = 'VIEWPORT_HEIGHT_DECREASING'
      } else if (viewportWidth < current.state.viewportWidth) {
        notAtBottomBecause = 'VIEWPORT_WIDTH_DECREASING'
      } else if (scrollTop < current.state.scrollTop) {
        notAtBottomBecause = 'SCROLLING_UPWARDS'
      } else if (state.scrollHeight > current.state.scrollHeight || state.tableBodyMarginTop < current.state.tableBodyMarginTop) {
        if (current.atBottom) {
          notAtBottomBecause = 'SIZE_INCREASED'
        } else {
          ;({ notAtBottomBecause } = current)
        }
      } else {
        if (current.atBottom) {
          notAtBottomBecause = 'NOT_FULLY_SCROLLED_TO_LAST_ITEM_BOTTOM'
        } else {
          ;({ notAtBottomBecause } = current)
        }
      }

      return {
        atBottom: false,
        notAtBottomBecause,
        state,
      } as AtBottomState
    }, INITIAL_BOTTOM_STATE)
  ),
  atBottomState$
)

e.link(
  e.pipe(
    atBottomState$,
    e.scan(
      ({ prev }, next) => {
        const shouldScroll = Boolean(prev && next && prev.atBottom && !next.atBottom && next.notAtBottomBecause === 'SIZE_INCREASED')
        return {
          prev: next,
          shouldScroll,
        }
      },
      { prev: null as null | AtBottomState, shouldScroll: false }
    ),
    e.map(({ shouldScroll }) => shouldScroll)
  ),
  shouldScrollDueToSizeIncrease$
)

e.sub(
  e.pipe(
    viewportHeight$,
    e.withLatestFrom(atBottomState$, useWindowScroll$, customScrollParent$),
    e.filter(([, , useWindowScroll, customScrollParent]) => !useWindowScroll && !customScrollParent),
    e.scan(
      (prev, [viewportHeight, state]) => {
        let delta = 0
        if (prev.viewportHeight > viewportHeight && state && !state.atBottom && state.notAtBottomBecause === 'VIEWPORT_HEIGHT_DECREASING') {
          delta = prev.viewportHeight - viewportHeight
        }
        return { viewportHeight, delta }
      },
      { viewportHeight: 0, delta: 0 }
    )
  ),
  (val) => {
    if (val.delta) {
      e.pub(scrollBy$, val.delta)
    }
  }
)

e.link(
  e.pipe(
    e.combine(scrollTop$, scrollHeight$, viewportHeight$),
    e.scan(
      (current, [scrollTop, scrollHeight, viewportHeight]) => {
        if (!approximatelyEqual(current.scrollHeight, scrollHeight)) {
          const atBottom = scrollHeight - (scrollTop + viewportHeight) < 1

          if (current.scrollTop !== scrollTop && atBottom) {
            return {
              scrollHeight,
              scrollTop,
              jump: current.scrollTop - scrollTop,
              changed: true,
            }
          }
          return {
            scrollHeight,
            scrollTop,
            jump: 0,
            changed: true,
          }
        }
        return {
          scrollTop,
          scrollHeight,
          jump: 0,
          changed: false,
        }
      },
      { scrollHeight: 0, jump: 0, scrollTop: 0, changed: false }
    ),
    e.filter((value) => value.changed),
    e.map((value) => value.jump)
  ),
  lastJumpDueToRowResize$
)

e.link(
  e.pipe(
    scrollTop$,
    e.scan(
      (acc, scrollTop) => {
        // we're in the dark zone of the elastic scrolling of safari
        const inElasticPhase = scrollTop < 0
        if (inElasticPhase) {
          return { direction: UP as ScrollDirection, prevScrollTop: 0 }
        }
        // if things change while compensating for items, ignore,
        // but store the new scrollTop
        if (e.getValue(isScrollingBy$)) {
          return { direction: acc.direction, prevScrollTop: scrollTop }
        }

        const safariIsBouncing = scrollTop === acc.prevScrollTop && scrollTop === 0
        return {
          direction: (scrollTop < acc.prevScrollTop || safariIsBouncing ? UP : DOWN) as ScrollDirection,
          prevScrollTop: scrollTop,
        }
      },
      { direction: DOWN, prevScrollTop: 0 } as { direction: ScrollDirection; prevScrollTop: number }
    ),
    e.map((value) => value.direction)
  ),
  scrollDirection$
)

e.link(e.pipe(scrollTop$, e.debounceTime(100), e.mapTo(NONE)), scrollDirection$)
