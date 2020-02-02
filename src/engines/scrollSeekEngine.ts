import {
  TObservable,
  subject,
  filter,
  mapTo,
  throttleTime,
  scan,
  map,
  withLatestFrom,
  duc,
  combineLatest,
} from '../tinyrx'

export interface ListRange {
  startIndex: number
  endIndex: number
}

export interface ScrollSeekToggle {
  (velocity: number, range: ListRange): boolean
}

export interface ScrollSeekConfiguration {
  enter: ScrollSeekToggle
  exit: ScrollSeekToggle
  change: (velocity: number, range: ListRange) => void
}
interface ScrollSeekParams {
  isScrolling$: TObservable<boolean>
  scrollTop$: TObservable<number>
  rangeChanged$: TObservable<ListRange>
}

export function scrollSeekEngine({ isScrolling$, scrollTop$, rangeChanged$: range$ }: ScrollSeekParams) {
  const scrollVelocity$ = subject(0)
  const isSeeking$ = subject(false)
  const scrollSeekConfiguration$ = subject<ScrollSeekConfiguration | undefined>(undefined)
  const theRange$ = subject({ startIndex: 0, endIndex: 0 })
  range$.subscribe(theRange$.next)

  isScrolling$
    .pipe(
      filter(val => !val),
      mapTo(0)
    )
    .subscribe(scrollVelocity$.next)

  scrollTop$
    .pipe(
      throttleTime(100),
      scan(([_, prev], next) => [prev, next], [0, 0]),
      map(([prev, next]) => next - prev)
    )
    .subscribe(scrollVelocity$.next)

  scrollVelocity$
    .pipe(
      withLatestFrom(scrollSeekConfiguration$, isSeeking$, theRange$),
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
      duc()
    )
    .subscribe(isSeeking$.next)

  combineLatest(isSeeking$, scrollVelocity$, theRange$)
    .pipe(withLatestFrom(scrollSeekConfiguration$))
    .subscribe(([[isSeeking, velocity, range], config]) => isSeeking && config!.change(velocity, range))

  return { isSeeking$, scrollSeekConfiguration$, scrollVelocity$ }
}
