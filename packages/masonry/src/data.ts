import { Cell, filter, link, map, pipe } from '@virtuoso.dev/gurx'

import type { Data } from './interfaces'

export const totalCount$ = Cell(0)
export const context$ = Cell<unknown>(null)

export const data$ = Cell<Data | null>(null, () => {
  link(
    pipe(
      data$,
      filter<Data | null, Data>((data) => data !== null),
      map((data) => data.length)
    ),
    totalCount$
  )
})
