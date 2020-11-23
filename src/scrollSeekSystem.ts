import {
  combineLatest,
  connect,
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  pipe,
  scan,
  statefulStream,
  stream,
  subscribe,
  system,
  throttleTime,
  tup,
  withLatestFrom,
} from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'
import { ListRange } from './interfaces'
import { stateFlagsSystem } from './stateFlagsSystem'

export interface ScrollSeekToggle {
  (velocity: number, range: ListRange): boolean
}

export interface ScrollSeekConfiguration {
  /**
   * Callback to determine if the list should enter "scroll seek" mode.
   */
  enter: ScrollSeekToggle
  /**
   * called during scrolling in scroll seek mode - use to display a hint where the list is.
   */
  change?: (velocity: number, range: ListRange) => void
  /**
   * Callback to determine if the list should enter "scroll seek" mode.
   */
  exit: ScrollSeekToggle
}

export const scrollSeekSystem = system(
  ([{ scrollTop }, { isScrolling }]) => {
    const scrollVelocity = statefulStream(0)
    const isSeeking = statefulStream(false)
    const rangeChanged = stream<ListRange>()
    const scrollSeekConfiguration = statefulStream<ScrollSeekConfiguration | undefined | false>(false)

    connect(
      pipe(
        isScrolling,
        filter(value => !value),
        mapTo(0)
      ),
      scrollVelocity
    )

    connect(
      pipe(
        scrollTop,
        throttleTime(100),
        scan(([_, prev], next) => [prev, next], [0, 0]),
        map(([prev, next]) => next - prev)
      ),
      scrollVelocity
    )

    connect(
      pipe(
        scrollVelocity,
        withLatestFrom(scrollSeekConfiguration, isSeeking, rangeChanged),
        filter(([_, config]) => !!config),
        map(([speed, config, isSeeking, range]: any) => {
          const { exit, enter } = config!
          if (isSeeking) {
            if (exit(speed, range)) {
              return false
            }
          } else {
            if (enter(speed, range)) {
              return true
            }
          }
          return isSeeking
        }),
        distinctUntilChanged()
      ),
      isSeeking
    )

    subscribe(
      pipe(combineLatest(isSeeking, scrollVelocity, rangeChanged), withLatestFrom(scrollSeekConfiguration)),
      ([[isSeeking, velocity, range], config]) => isSeeking && config && config.change && config!.change(velocity, range)
    )

    return { isSeeking, scrollSeekConfiguration, scrollVelocity, scrollSeekRangeChanged: rangeChanged }
  },
  tup(domIOSystem, stateFlagsSystem),
  { singleton: true }
)
