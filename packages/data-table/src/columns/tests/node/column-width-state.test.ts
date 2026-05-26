import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearColumnWidthOverride$ } from '../../../features/column-resize'
import { viewportWidth$ } from '../../../scroll/dom'
import { columnBaseWidths$, columns$, columnWidths$, measuredColumnWidths$ } from '../../Column'
import { columnRanges$, columnSizeState$ } from '../../column-sizes'
import { columnWidthOverrides$ } from '../../column-width-overrides'

describe('column width state', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(columns$)
    engine.register(measuredColumnWidths$)
    engine.register(columnWidthOverrides$)
    engine.register(columnBaseWidths$)
    engine.register(columnWidths$)
    engine.register(columnRanges$)
    engine.register(columnSizeState$)
    engine.register(viewportWidth$)
  })

  it('fills the viewport before resize, then freezes sibling widths when a column is resized', () => {
    engine.pub(
      columns$,
      new Map([
        ['name', { field: 'name' }],
        ['status', { field: 'status' }],
      ])
    )
    engine.pub(
      measuredColumnWidths$,
      new Map([
        ['name', 100],
        ['status', 100],
      ])
    )
    engine.pub(viewportWidth$, 300)

    expect(engine.getValue(columnWidths$)).toStrictEqual(
      new Map([
        ['name', 150],
        ['status', 150],
      ])
    )

    engine.pub(columnWidthOverrides$, new Map([['name', 180]]))

    expect(engine.getValue(columnWidths$)).toStrictEqual(
      new Map([
        ['name', 180],
        ['status', 150],
      ])
    )

    engine.pub(viewportWidth$, 360)

    expect(engine.getValue(columnWidths$)).toStrictEqual(
      new Map([
        ['name', 180],
        ['status', 150],
      ])
    )
  })

  it('uses current viewport defaults for non-overridden columns when restored widths arrive before initial sizing', () => {
    engine.pub(
      columns$,
      new Map([
        ['id', { field: 'id' }],
        ['name', { field: 'name' }],
        ['status', { field: 'status' }],
        ['city', { field: 'city' }],
      ])
    )
    engine.pub(columnWidthOverrides$, new Map([['id', 400]]))
    engine.pub(
      measuredColumnWidths$,
      new Map([
        ['id', 80],
        ['name', 50],
        ['status', 60],
        ['city', 40],
      ])
    )
    engine.pub(viewportWidth$, 820)

    expect(engine.getValue(columnWidths$)).toStrictEqual(
      new Map([
        ['id', 400],
        ['name', 197.5],
        ['status', 207.5],
        ['city', 187.5],
      ])
    )
  })

  it('returns to auto-fill behavior when the last override is cleared', () => {
    engine.pub(
      columns$,
      new Map([
        ['name', { field: 'name' }],
        ['status', { field: 'status' }],
      ])
    )
    engine.pub(
      measuredColumnWidths$,
      new Map([
        ['name', 100],
        ['status', 100],
      ])
    )
    engine.pub(viewportWidth$, 300)
    engine.pub(columnWidthOverrides$, new Map([['name', 180]]))

    engine.pub(clearColumnWidthOverride$, { key: 'name' })

    expect(engine.getValue(columnWidthOverrides$)).toStrictEqual(new Map())
    expect(engine.getValue(columnWidths$)).toStrictEqual(
      new Map([
        ['name', 150],
        ['status', 150],
      ])
    )
  })
})
