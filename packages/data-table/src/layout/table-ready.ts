import { Cell, e } from '@virtuoso.dev/reactive-engine-core'

import { columnCount$, columnSizeState$ } from '../columns/column-sizes'
import { totalCount$ } from '../core/data'
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

if (process.env.NODE_ENV !== 'production') {
  let warnTimer: ReturnType<typeof setTimeout> | null = null

  e.sub(
    e.pipe(
      e.combine(viewportHeight$, totalCount$),
      e.map(([viewportHeight, totalCount]) => viewportHeight === 0 && totalCount > 0)
    ),
    (shouldWarn) => {
      if (warnTimer !== null) {
        clearTimeout(warnTimer)
        warnTimer = null
      }
      if (shouldWarn) {
        warnTimer = setTimeout(() => {
          if (e.getValue(viewportHeight$) === 0 && e.getValue(totalCount$) > 0) {
            console.warn(
              '[VirtuosoDataTable] Container element has zero height. No rows will render. Set a height on the container element or use useWindowScroll.'
            )
          }
        }, 2000)
      }
    }
  )
}
