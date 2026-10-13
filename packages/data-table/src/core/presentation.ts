import { Cell, DerivedCell, e } from '@virtuoso.dev/reactive-engine-core'

export const presentation$ = Cell<'table' | 'card'>('table')

// A retired layout's delayed work must stay retired, even after switching back.
export const presentationEpoch$ = DerivedCell(
  0,
  e.pipe(
    presentation$,
    e.scan((epoch) => epoch + 1, 0)
  )
)
