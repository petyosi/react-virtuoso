import { Cell, DerivedCell, e } from '@virtuoso.dev/reactive-engine-core'

import { totalCount$ } from '../core/data'
import { cardGeometry, EMPTY_CARD_MEASUREMENT } from './geometry'

import type { ViewportRange } from '../rows/row-state'

// Card geometry never enters the table's per-row size tree.
export const cardMeasurement$ = Cell(EMPTY_CARD_MEASUREMENT)
export const cardViewportRange$ = Cell<ViewportRange | null>(null)
export const cardRenderedData$ = Cell<unknown[]>([])
export const cardTotalHeight$ = DerivedCell(
  0,
  e.pipe(
    e.combine(cardMeasurement$, totalCount$),
    e.map(([measurement, count]) => cardGeometry(measurement, count).totalHeight)
  )
)
