import { Cell, DerivedCell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { data$, groupIndices$, groupIndexSet$, totalCount$ } from '../core/data'
import { computeTotalSize } from '../sizing/offsetOf'
import { EMPTY_SIZE_STATE, updateSizeState } from '../sizing/SizeState'

import type { SizeRange } from '../interfaces'

export const recalcInProgress$ = Cell(false)

export const sizeState$ = Cell(EMPTY_SIZE_STATE)

export const ranges$ = Stream<SizeRange[]>()

const rangesWithGroupIndices$ = e.pipe(ranges$, e.withLatestFrom(groupIndexSet$))
e.changeWith(sizeState$, rangesWithGroupIndices$, (current, [ranges, groupIndexSet]) => {
  if (groupIndexSet.size > 0) {
    const groupIndicesList = e.getValue(groupIndices$)
    if (groupIndicesList.length > 0) {
      ranges = expandGroupHeaderRanges(ranges, groupIndicesList)
    }
  }
  return updateSizeState(current, ranges, groupIndexSet)
})

function expandGroupHeaderRanges(ranges: SizeRange[], groupIndicesList: { index: number; level: number }[]): SizeRange[] {
  let levelToSize: Map<number, number> | undefined
  for (const range of ranges) {
    if (range.startIndex !== range.endIndex) {
      continue
    }
    const group = groupIndicesList.find((g) => g.index === range.startIndex)
    if (!group) {
      continue
    }
    levelToSize ??= new Map()
    levelToSize.set(group.level, range.size)
  }
  if (!levelToSize) {
    return ranges
  }

  const extra: SizeRange[] = []
  for (const g of groupIndicesList) {
    const size = levelToSize.get(g.level)
    if (size === undefined) {
      continue
    }
    if (ranges.some((r) => r.startIndex <= g.index && r.endIndex >= g.index)) {
      continue
    }
    extra.push({ startIndex: g.index, endIndex: g.index, size })
  }
  return extra.length > 0 ? [...ranges, ...extra] : ranges
}
e.changeWith(sizeState$, data$, (current) => ({ ...EMPTY_SIZE_STATE, lastSize: current.lastSize }))

export const totalHeight$ = DerivedCell(
  0,
  e.pipe(
    e.combine(totalCount$, sizeState$),
    e.map(([totalCount, sizeState]) => computeTotalSize(totalCount, sizeState))
  )
)
