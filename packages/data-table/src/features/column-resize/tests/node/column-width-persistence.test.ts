import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { columns$ } from '../../../../columns/Column'
import { columnWidthOverrides$ } from '../../../../columns/column-width-overrides'
import {
  columnWidthOverridesFromState,
  columnWidthPersistenceAdapter,
  columnWidthStateFromOverrides,
  restoreColumnWidthState$,
} from '../../index'

import type { ColumnInfo } from '../../../../columns/Column'
import type { ColumnWidthPersistenceState } from '../../index'

function columnMap(entries: [string, string][]) {
  return new Map(entries.map(([key, field]) => [key, { field }] as [string, ColumnInfo]))
}

describe('column width persistence', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(columns$)
    engine.register(columnWidthOverrides$)
  })

  it('applies matching saved field widths to runtime column keys', () => {
    const columns = columnMap([
      ['runtime-name', 'name'],
      ['runtime-status', 'status'],
      ['runtime-city', 'city'],
    ])

    expect(
      columnWidthOverridesFromState(columns, {
        version: 1,
        widths: {
          name: 240,
          missing: 180,
          status: 160,
        },
      })
    ).toStrictEqual(
      new Map([
        ['runtime-name', 240],
        ['runtime-status', 160],
      ])
    )
  })

  it('returns an empty override map when no state is available', () => {
    expect(columnWidthOverridesFromState(columnMap([['runtime-name', 'name']]), null)).toStrictEqual(new Map())
    expect(columnWidthOverridesFromState(columnMap([['runtime-name', 'name']]), undefined)).toStrictEqual(new Map())
  })

  it('ignores invalid saved widths', () => {
    const invalidState = {
      version: 1,
      widths: {
        nan: Number.NaN,
        negative: -1,
        zero: 0,
        infinite: Number.POSITIVE_INFINITY,
        valid: 120,
        string: '140',
      },
    } as unknown as ColumnWidthPersistenceState

    expect(
      columnWidthOverridesFromState(
        columnMap([
          ['runtime-nan', 'nan'],
          ['runtime-negative', 'negative'],
          ['runtime-zero', 'zero'],
          ['runtime-infinite', 'infinite'],
          ['runtime-valid', 'valid'],
          ['runtime-string', 'string'],
        ]),
        invalidState
      )
    ).toStrictEqual(new Map([['runtime-valid', 120]]))
  })

  it('converts runtime overrides back to field-keyed persistence state', () => {
    expect(
      columnWidthStateFromOverrides(
        columnMap([
          ['runtime-name', 'name'],
          ['runtime-status', 'status'],
        ]),
        new Map([
          ['runtime-name', 240],
          ['runtime-status', 160],
        ])
      )
    ).toStrictEqual({
      version: 1,
      widths: {
        name: 240,
        status: 160,
      },
    })
  })

  it('preserves previously saved widths for columns missing from the current render', () => {
    expect(
      columnWidthStateFromOverrides(
        columnMap([
          ['runtime-name', 'name'],
          ['runtime-city', 'city'],
        ]),
        new Map([['runtime-name', 260]]),
        {
          version: 1,
          widths: {
            name: 220,
            status: 180,
            score: 140,
          },
        }
      )
    ).toStrictEqual({
      version: 1,
      widths: {
        name: 260,
        status: 180,
        score: 140,
      },
    })
  })

  it('removes cleared widths only for fields present in the current render', () => {
    expect(
      columnWidthStateFromOverrides(
        columnMap([
          ['runtime-name', 'name'],
          ['runtime-city', 'city'],
        ]),
        new Map([['runtime-city', 190]]),
        {
          version: 1,
          widths: {
            name: 220,
            status: 180,
            city: 160,
          },
        }
      )
    ).toStrictEqual({
      version: 1,
      widths: {
        status: 180,
        city: 190,
      },
    })
  })

  it('ignores overrides for runtime keys that are no longer registered', () => {
    expect(
      columnWidthStateFromOverrides(
        columnMap([['runtime-name', 'name']]),
        new Map([
          ['runtime-name', 220],
          ['stale-runtime-status', 180],
        ])
      )
    ).toStrictEqual({
      version: 1,
      widths: {
        name: 220,
      },
    })
  })

  it('restores persisted widths by replacing stale runtime overrides', () => {
    engine.pub(
      columns$,
      columnMap([
        ['runtime-name', 'name'],
        ['runtime-city', 'city'],
      ])
    )
    engine.pub(
      columnWidthOverrides$,
      new Map([
        ['stale-status', 180],
        ['runtime-name', 200],
      ])
    )

    engine.pub(restoreColumnWidthState$, {
      version: 1,
      widths: {
        name: 260,
        status: 180,
      },
    })

    expect(engine.getValue(columnWidthOverrides$)).toStrictEqual(new Map([['runtime-name', 260]]))
  })

  it('captures persisted state through the state persistence adapter', () => {
    const adapter = columnWidthPersistenceAdapter()
    engine.pub(
      columns$,
      columnMap([
        ['runtime-name', 'name'],
        ['runtime-city', 'city'],
      ])
    )
    engine.pub(
      columnWidthOverrides$,
      new Map([
        ['runtime-name', 260],
        ['stale-runtime-status', 180],
      ])
    )

    expect(
      adapter.capture(engine, {
        version: 1,
        widths: {
          name: 220,
          status: 180,
        },
      })
    ).toStrictEqual({
      version: 1,
      widths: {
        name: 260,
        status: 180,
      },
    })
  })

  it('restores persisted state through the state persistence adapter', () => {
    const adapter = columnWidthPersistenceAdapter()
    engine.pub(
      columns$,
      columnMap([
        ['runtime-name', 'name'],
        ['runtime-city', 'city'],
      ])
    )
    engine.pub(columnWidthOverrides$, new Map([['runtime-city', 190]]))

    adapter.restore(engine, {
      version: 1,
      widths: {
        name: 260,
        status: 180,
      },
    })

    expect(engine.getValue(columnWidthOverrides$)).toStrictEqual(new Map([['runtime-name', 260]]))
  })

  it('notifies the state persistence adapter when widths or columns change', () => {
    const adapter = columnWidthPersistenceAdapter()
    const onWidthChange = vi.fn()
    const onColumnChange = vi.fn()
    const unsubscribeWidths = adapter.subscribe(engine, onWidthChange)
    const unsubscribeColumns = adapter.subscribeRestore!(engine, onColumnChange)

    engine.pub(columnWidthOverrides$, new Map([['runtime-name', 260]]))
    engine.pub(columns$, columnMap([['runtime-name', 'name']]))

    expect(onWidthChange).toHaveBeenCalledOnce()
    expect(onColumnChange).toHaveBeenCalledOnce()

    unsubscribeWidths()
    unsubscribeColumns()
    engine.pub(columnWidthOverrides$, new Map([['runtime-name', 280]]))
    engine.pub(columns$, columnMap([['runtime-city', 'city']]))

    expect(onWidthChange).toHaveBeenCalledOnce()
    expect(onColumnChange).toHaveBeenCalledOnce()
  })
})
