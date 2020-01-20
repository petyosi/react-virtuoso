import { subject, skip, mapTo, debounceTime, TObservable } from './tinyrx'

interface TScrollLocationWithAlign {
  index: number
  align: 'start' | 'center' | 'end'
  behavior?: 'smooth' | 'auto'
}

export type TScrollLocation = number | TScrollLocationWithAlign

export const buildIsScrolling = (scrollTop$: TObservable<number>): TObservable<boolean> => {
  const isScrolling$ = subject(false)

  scrollTop$.pipe(skip(1), mapTo(true)).subscribe(isScrolling$.next)

  scrollTop$.pipe(skip(1), mapTo(false), debounceTime(200)).subscribe(isScrolling$.next)

  return isScrolling$
}
