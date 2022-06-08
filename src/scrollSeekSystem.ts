import * as u from '@virtuoso.dev/urx'
import { ListRange } from './interfaces'
import { stateFlagsSystem } from './stateFlagsSystem'
import { ScrollSeekConfiguration } from './interfaces'

export const scrollSeekSystem = u.system(
  ([{ scrollVelocity }]) => {
    const isSeeking = u.statefulStream(false)
    const rangeChanged = u.stream<ListRange>()
    const scrollSeekConfiguration = u.statefulStream<ScrollSeekConfiguration | undefined | false>(false)

    u.connect(
      u.pipe(
        scrollVelocity,
        u.withLatestFrom(scrollSeekConfiguration, isSeeking, rangeChanged),
        u.filter(([_, config]) => !!config),
        u.map(([speed, config, isSeeking, range]) => {
          const { exit, enter } = config as ScrollSeekConfiguration
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
        u.distinctUntilChanged()
      ),
      isSeeking
    )

    u.subscribe(
      u.pipe(u.combineLatest(isSeeking, scrollVelocity, rangeChanged), u.withLatestFrom(scrollSeekConfiguration)),
      ([[isSeeking, velocity, range], config]) => isSeeking && config && config.change && config.change(velocity, range)
    )

    return { isSeeking, scrollSeekConfiguration, scrollVelocity, scrollSeekRangeChanged: rangeChanged }
  },
  u.tup(stateFlagsSystem),
  { singleton: true }
)
