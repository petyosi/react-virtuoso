import { bench, describe } from 'vitest'

interface RowLike {
  index: number
  offset: number
  size: number
  data: unknown
}

function buildRows(count: number, rowHeight: number): RowLike[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    offset: i * rowHeight,
    size: rowHeight,
    data: { id: i },
  }))
}

const groupIndexSet = new Set<number>()

function shiftLoop(rows: RowLike[], scrollTop: number, groups: Set<number>) {
  const copy = [...rows]
  while (copy.length > 0 && copy[0]!.offset + copy[0]!.size < scrollTop) {
    copy.shift()
  }
  return copy.filter((row) => !groups.has(row.index)).map((row) => row.data)
}

function findIndexSlice(rows: RowLike[], scrollTop: number, groups: Set<number>) {
  const idx = rows.findIndex((r) => r.offset + r.size >= scrollTop)
  const visible = idx === -1 ? [] : rows.slice(idx)
  return visible.filter((row) => !groups.has(row.index)).map((row) => row.data)
}

describe('currentlyRenderedRows - 1,000 rows, scroll to middle', () => {
  const rows = buildRows(1000, 40)
  const scrollTop = 500 * 40

  bench('shift loop (current)', () => {
    shiftLoop(rows, scrollTop, groupIndexSet)
  })

  bench('findIndex + slice (proposed)', () => {
    findIndexSlice(rows, scrollTop, groupIndexSet)
  })
})

describe('currentlyRenderedRows - 10,000 rows, scroll to middle', () => {
  const rows = buildRows(10_000, 40)
  const scrollTop = 5000 * 40

  bench('shift loop (current)', () => {
    shiftLoop(rows, scrollTop, groupIndexSet)
  })

  bench('findIndex + slice (proposed)', () => {
    findIndexSlice(rows, scrollTop, groupIndexSet)
  })
})

describe('currentlyRenderedRows - 10,000 rows, scroll near end', () => {
  const rows = buildRows(10_000, 40)
  const scrollTop = 9500 * 40

  bench('shift loop (current)', () => {
    shiftLoop(rows, scrollTop, groupIndexSet)
  })

  bench('findIndex + slice (proposed)', () => {
    findIndexSlice(rows, scrollTop, groupIndexSet)
  })
})

describe('currentlyRenderedRows - 10,000 rows, scroll at top (no shift needed)', () => {
  const rows = buildRows(10_000, 40)
  const scrollTop = 0

  bench('shift loop (current)', () => {
    shiftLoop(rows, scrollTop, groupIndexSet)
  })

  bench('findIndex + slice (proposed)', () => {
    findIndexSlice(rows, scrollTop, groupIndexSet)
  })
})
