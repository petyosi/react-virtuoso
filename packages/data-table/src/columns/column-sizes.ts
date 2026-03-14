// oxlint-disable require-hook
import { e, Cell, DerivedCell, Stream } from '@virtuoso.dev/reactive-engine-core'

import { itemOffsetAndSize } from '../sizing/offsetOf'
import { EMPTY_SIZE_STATE, updateSizeState } from '../sizing/SizeState'

import type { SizeRange } from '../interfaces'

export const columnCount$ = Cell(0)

export const columnSizeState$ = Cell(EMPTY_SIZE_STATE)

export const columnRanges$ = Stream<SizeRange[]>()

e.changeWith(columnSizeState$, columnRanges$, (current, ranges) => updateSizeState(current, ranges))

export const totalWidth$ = DerivedCell(
  0,
  e.pipe(
    e.combine(columnCount$, columnSizeState$),
    e.map(([count, { lastIndex, lastOffset, lastSize, offsetTree }]) => {
      if (count > 0 && lastIndex >= count) {
        const [offset, size] = itemOffsetAndSize(count - 1, offsetTree)
        return offset + size
      }
      return lastOffset + (count - lastIndex) * lastSize
    })
  )
)
