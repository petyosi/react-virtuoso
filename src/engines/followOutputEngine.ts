import { TScrollLocation } from '../EngineCommons'
import { TObservable, TSubject, subject, combineLatest, withLatestFrom } from '../tinyrx'

interface FollowOutputParams {
  totalCount$: TObservable<number>
  scrolledToBottom$: TSubject<boolean>
  scrollToIndex$: TSubject<TScrollLocation>
}
export function followOutputEngine({ scrollToIndex$, scrolledToBottom$, totalCount$ }: FollowOutputParams) {
  const followOutput$ = subject(false)

  combineLatest(followOutput$, totalCount$)
    .pipe(withLatestFrom(scrolledToBottom$))
    .subscribe(([[followOutput, totalCount], scrolledToBottom]) => {
      if (followOutput && scrolledToBottom) {
        setTimeout(() => {
          scrollToIndex$.next({ index: totalCount - 1, align: 'end', behavior: 'auto' })
        })
      }
    })
  return {
    followOutput$,
  }
}
