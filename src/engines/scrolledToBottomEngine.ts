import { TObservable, subject, combineLatest, map } from '../tinyrx'

interface ScrolledToBottomParams {
  scrollTop$: TObservable<number>
  viewportHeight$: TObservable<number>
  totalHeight$: TObservable<number>
}

export function scrolledToBottomEngine({ totalHeight$, viewportHeight$, scrollTop$ }: ScrolledToBottomParams) {
  const scrolledToBottom$ = subject(false)

  let notAtBottom: number

  combineLatest(scrollTop$, viewportHeight$, totalHeight$)
    .pipe(
      map(([scrollTop, viewportHeight, totalHeight]) => {
        if (viewportHeight === 0) return false
        return totalHeight - viewportHeight - scrollTop <= 1 || totalHeight <= viewportHeight
      })
    )
    .subscribe(value => {
      clearTimeout(notAtBottom)
      if (!value) {
        notAtBottom = setTimeout(() => scrolledToBottom$.next(false))
      } else {
        scrolledToBottom$.next(true)
      }
    })

  return {
    scrolledToBottom$,
  }
}
