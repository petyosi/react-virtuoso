import { Cell, e } from '@virtuoso.dev/reactive-engine-core'

import { columnCount$, columnSizeState$ } from '../columns/column-sizes'
import { rowsState$ } from '../rows/row-state'
import { viewportHeight$, viewportWidth$ } from '../scroll/dom'

export const tableReady$ = Cell(false)

e.link(
  e.pipe(
    e.combine(columnCount$, columnSizeState$, viewportHeight$, viewportWidth$, rowsState$),
    e.map(([columnCount, columnSizeState, viewportHeight, viewportWidth, rowsState]) => {
      return (
        columnCount > 0 && columnSizeState.offsetTree.length > 0 && viewportHeight > 0 && viewportWidth > 0 && rowsState.rows.length > 0
      )
    }),
    e.scan((wasReady, isReady) => wasReady || isReady, false)
  ),
  tableReady$
)
