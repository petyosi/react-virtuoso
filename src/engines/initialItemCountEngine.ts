import { subject, TSubject } from '../tinyrx'
import { ItemHeight } from '../VirtuosoStore'

interface InitialItemCountEngineParams {
  itemHeights$: TSubject<ItemHeight[]>
  viewportHeight$: TSubject<number>
}
export function initialItemCountEngine({ itemHeights$, viewportHeight$ }: InitialItemCountEngineParams) {
  const initialItemCount$ = subject<number>()
  const pendingRenderAfterInitial$ = subject(false)

  const unsubscribeInitial = initialItemCount$.subscribe(count => {
    const dummyItemHeight = 30
    itemHeights$.next([{ start: 0, end: 0, size: dummyItemHeight }])
    viewportHeight$.next(dummyItemHeight * count)
    pendingRenderAfterInitial$.next(true)
    unsubscribeInitial()
  })

  return { initialItemCount$, pendingRenderAfterInitial$ }
}
