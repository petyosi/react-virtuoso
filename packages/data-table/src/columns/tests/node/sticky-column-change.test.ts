import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { scrollLeft$, viewportWidth$ } from '../../../scroll/dom'
import { columns$, columnWidths$, setColumnSticky$ } from '../../Column'
import { columnCount$, columnRanges$, columnSizeState$ } from '../../column-sizes'
import { columnItemsState$, stickyColumnsState$ } from '../../column-state'

function sortedNumbers(values: Iterable<number>) {
  // oxlint-disable-next-line unicorn/no-array-sort
  return [...values].sort((a, b) => a - b)
}

describe('sticky column change', () => {
  let engine!: Engine
  const DEFAULT_VIEWPORT_WIDTH = 500

  beforeEach(() => {
    engine = new Engine()
    engine.register(columns$)
    engine.register(columnWidths$)
    engine.register(columnCount$)
    engine.register(columnSizeState$)
    engine.register(stickyColumnsState$)
    engine.register(columnItemsState$)
    engine.register(scrollLeft$)
    engine.register(viewportWidth$)
  })

  function setupColumns(opts: {
    keys: string[]
    widths: number[]
    sticky?: Record<string, 'left' | 'right'>
    viewportWidth?: number
    scrollLeft?: number
  }) {
    const { keys, widths, sticky, viewportWidth = DEFAULT_VIEWPORT_WIDTH, scrollLeft = 0 } = opts

    engine.pub(columns$, new Map(keys.map((key) => [key, { field: key, ...(sticky?.[key] ? { sticky: sticky[key] } : {}) }] as const)))
    engine.pub(columnWidths$, new Map(keys.map((key, index) => [key, widths[index] ?? 0] as const)))
    engine.pub(
      columnRanges$,
      keys.map((_, index) => ({ startIndex: index, endIndex: index, size: widths[index] ?? 0 }))
    )
    engine.pub(viewportWidth$, viewportWidth)
    engine.pub(scrollLeft$, scrollLeft)
  }

  function expectStickyState(expected: {
    left: string[]
    right: string[]
    leftWidth: number
    rightWidth: number
    stickyIndices: number[]
    totalStickyWidth: number
  }) {
    const stickyState = engine.getValue(stickyColumnsState$)
    expect(stickyState.leftColumns.map((c) => c.key)).toStrictEqual(expected.left)
    expect(stickyState.rightColumns.map((c) => c.key)).toStrictEqual(expected.right)
    expect(stickyState.leftWidth).toBe(expected.leftWidth)
    expect(stickyState.rightWidth).toBe(expected.rightWidth)
    expect(sortedNumbers(stickyState.stickyIndices)).toStrictEqual(sortedNumbers(expected.stickyIndices))
    expect(stickyState.totalStickyWidth).toBe(expected.totalStickyWidth)
  }

  function expectItemsState(expected: { keys: string[]; paddingStart: number; paddingEnd: number; offsets?: number[] }) {
    const itemsState = engine.getValue(columnItemsState$)
    expect(itemsState.columns.map((c) => c.key)).toStrictEqual(expected.keys)
    expect(itemsState.paddingStart).toBe(expected.paddingStart)
    expect(itemsState.paddingEnd).toBe(expected.paddingEnd)
    if (expected.offsets) {
      expect(itemsState.columns.map((c) => c.offset)).toStrictEqual(expected.offsets)
    }
  }

  it('starts non-sticky', () => {
    setupColumns({ keys: ['id', 'col0', 'col1', 'col2', 'col3'], widths: [100, 100, 100, 100, 100] })

    expectStickyState({ left: [], right: [], leftWidth: 0, rightWidth: 0, stickyIndices: [], totalStickyWidth: 0 })
    expectItemsState({ keys: ['id', 'col0', 'col1', 'col2', 'col3'], paddingStart: 0, paddingEnd: 0, offsets: [0, 100, 200, 300, 400] })
  })

  it.each([
    {
      name: 'non-sticky -> first column left-sticky',
      startSticky: undefined,
      action: { key: 'id', sticky: 'left' as const },
      expectedSticky: { left: ['id'], right: [], leftWidth: 100, rightWidth: 0, stickyIndices: [0], totalStickyWidth: 100 },
      expectedItems: { keys: ['col0', 'col1', 'col2', 'col3'], paddingStart: 0, paddingEnd: 0, offsets: [0, 100, 200, 300] },
    },
    {
      name: 'non-sticky -> middle column right-sticky',
      startSticky: undefined,
      action: { key: 'col1', sticky: 'right' as const },
      expectedSticky: { left: [], right: ['col1'], leftWidth: 0, rightWidth: 100, stickyIndices: [2], totalStickyWidth: 100 },
      expectedItems: { keys: ['id', 'col0', 'col2', 'col3'], paddingStart: 0, paddingEnd: 0, offsets: [0, 100, 200, 300] },
    },
    {
      name: 'non-sticky -> last column left-sticky',
      startSticky: undefined,
      action: { key: 'col3', sticky: 'left' as const },
      expectedSticky: { left: ['col3'], right: [], leftWidth: 100, rightWidth: 0, stickyIndices: [4], totalStickyWidth: 100 },
      expectedItems: { keys: ['id', 'col0', 'col1', 'col2'], paddingStart: 0, paddingEnd: 0, offsets: [0, 100, 200, 300] },
    },
  ])('$name', ({ startSticky, action, expectedSticky, expectedItems }) => {
    setupColumns({
      keys: ['id', 'col0', 'col1', 'col2', 'col3'],
      widths: [100, 100, 100, 100, 100],
      ...(startSticky ? { sticky: startSticky } : {}),
    })

    engine.pub(setColumnSticky$, action)

    expectStickyState(expectedSticky)
    expectItemsState(expectedItems)
  })

  it('unsticks to non-sticky', () => {
    setupColumns({ keys: ['id', 'col0', 'col1', 'col2', 'col3'], widths: [100, 100, 100, 100, 100], sticky: { id: 'left' } })

    engine.pub(setColumnSticky$, { key: 'id', sticky: undefined })

    expectStickyState({ left: [], right: [], leftWidth: 0, rightWidth: 0, stickyIndices: [], totalStickyWidth: 0 })
    expectItemsState({ keys: ['id', 'col0', 'col1', 'col2', 'col3'], paddingStart: 0, paddingEnd: 0, offsets: [0, 100, 200, 300, 400] })
  })

  it('moves between sticky sides', () => {
    setupColumns({ keys: ['id', 'col0', 'col1', 'col2', 'col3'], widths: [100, 100, 100, 100, 100], sticky: { id: 'left' } })

    engine.pub(setColumnSticky$, { key: 'id', sticky: 'right' })

    expectStickyState({ left: [], right: ['id'], leftWidth: 0, rightWidth: 100, stickyIndices: [0], totalStickyWidth: 100 })
    expectItemsState({ keys: ['col0', 'col1', 'col2', 'col3'], paddingStart: 0, paddingEnd: 0, offsets: [0, 100, 200, 300] })
  })

  it('supports both left and right sticky columns', () => {
    setupColumns({ keys: ['id', 'col0', 'col1', 'col2', 'col3'], widths: [100, 100, 100, 100, 100], sticky: { id: 'left', col3: 'right' } })

    expectStickyState({ left: ['id'], right: ['col3'], leftWidth: 100, rightWidth: 100, stickyIndices: [0, 4], totalStickyWidth: 200 })
    expectItemsState({ keys: ['col0', 'col1', 'col2'], paddingStart: 0, paddingEnd: 0, offsets: [0, 100, 200] })
  })

  it('computes visible columns when scrolled with sticky columns', () => {
    const keys = ['col0', 'col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8', 'col9']
    setupColumns({ keys, widths: Array.from({ length: keys.length }, () => 100), sticky: { col0: 'left' }, scrollLeft: 200 })

    expectItemsState({ keys: ['col3', 'col4', 'col5', 'col6'], paddingStart: 200, paddingEnd: 300, offsets: [200, 300, 400, 500] })
  })

  it('supports variable column widths with sticky columns', () => {
    setupColumns({
      keys: ['a', 'b', 'c', 'd', 'e', 'f'],
      widths: [80, 120, 60, 140, 100, 90],
      sticky: { b: 'left', e: 'right' },
      viewportWidth: 400,
      scrollLeft: 0,
    })

    expectStickyState({ left: ['b'], right: ['e'], leftWidth: 120, rightWidth: 100, stickyIndices: [1, 4], totalStickyWidth: 220 })
    expectItemsState({ keys: ['a', 'c', 'd'], paddingStart: 0, paddingEnd: 90, offsets: [0, 80, 140] })

    engine.pub(scrollLeft$, 160)

    expectItemsState({ keys: ['d', 'f'], paddingStart: 140, paddingEnd: 0, offsets: [140, 280] })
  })
})
