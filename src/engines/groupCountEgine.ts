import { GroupIndexTransposer, Transposer } from '../GroupIndexTransposer'
import { TSubject, subject } from '../tinyrx'

interface GroupCountParams {
  totalCount$: TSubject<number>
  stickyItems$: TSubject<number[]>
  transposer$: TSubject<Transposer>
}
export function groupCountEngine({ transposer$, stickyItems$, totalCount$ }: GroupCountParams) {
  const groupCounts$ = subject<number[]>()
  const groupIndices$ = stickyItems$.pipe()

  groupCounts$.subscribe(counts => {
    const transposer = new GroupIndexTransposer(counts)
    totalCount$.next(transposer.totalCount())
    stickyItems$.next(transposer.groupIndices())
    transposer$.next(transposer)
  })

  return {
    groupCounts$,
    groupIndices$,
  }
}
