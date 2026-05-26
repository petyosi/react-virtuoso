import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { columns$, columnVisibilityOverrides$, columnWidths$, visibleColumns$ } from '../../../../columns/Column'
import { columnCount$, columnSizeState$, totalWidth$ } from '../../../../columns/column-sizes'
import { stickyColumnsState$ } from '../../../../columns/column-state'
import {
  columnVisibilityOverridesFromState,
  columnVisibilityPersistenceAdapter,
  columnVisibilityStateFromColumns,
  columnVisibilityState$,
  resetColumnVisibility$,
  setColumnVisibility$,
} from '../../index'

import type { ColumnInfo } from '../../../../columns/Column'
import type { ColumnVisibilityPersistenceState } from '../../index'

function columnMap(entries: [string, string, visible?: boolean][]) {
  return new Map(
    entries.map(([key, field, visible]) => [
      key,
      {
        field,
        ...(visible === false ? { visible: false } : {}),
      },
    ]) as [string, ColumnInfo][]
  )
}

function visibleFields(columns: Map<string, ColumnInfo>) {
  return [...columns.values()].map((column) => column.field)
}

function effectiveVisibleFields(columns: Map<string, ColumnInfo>, overrides: Map<string, boolean>) {
  return [...columns].filter(([key, column]) => overrides.get(key) ?? column.visible !== false).map(([, column]) => column.field)
}

describe('column visibility persistence', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(columns$)
    engine.register(columnVisibilityOverrides$)
    engine.register(visibleColumns$)
    engine.register(columnVisibilityState$)
    engine.register(columnWidths$)
    engine.register(columnCount$)
    engine.register(columnSizeState$)
    engine.register(totalWidth$)
    engine.register(stickyColumnsState$)
  })

  function persistenceContext() {
    return { engine, model: null, viewId: 'default' }
  }

  it('defaults columns to visible when no valid state is available', () => {
    const columns = columnMap([
      ['runtime-id', 'id'],
      ['runtime-name', 'name'],
    ])

    expect(effectiveVisibleFields(columns, columnVisibilityOverridesFromState(columns, null))).toStrictEqual(['id', 'name'])
    expect(effectiveVisibleFields(columns, columnVisibilityOverridesFromState(columns, undefined))).toStrictEqual(['id', 'name'])
    expect(
      effectiveVisibleFields(
        columns,
        columnVisibilityOverridesFromState(columns, {
          version: 1,
          visibility: null,
        } as unknown as ColumnVisibilityPersistenceState)
      )
    ).toStrictEqual(['id', 'name'])
    expect(
      effectiveVisibleFields(
        columns,
        columnVisibilityOverridesFromState(columns, {
          version: 2,
          visibility: {
            name: false,
          },
        } as unknown as ColumnVisibilityPersistenceState)
      )
    ).toStrictEqual(['id', 'name'])
    expect(
      effectiveVisibleFields(
        columns,
        columnVisibilityOverridesFromState(columns, {
          version: 1,
          visibility: {
            id: 'false',
            name: false,
          },
        } as unknown as ColumnVisibilityPersistenceState)
      )
    ).toStrictEqual(['id'])
  })

  it('restores matching saved hidden fields and leaves newly discovered fields visible', () => {
    const columns = columnMap([
      ['runtime-id', 'id'],
      ['runtime-name', 'name'],
      ['runtime-city', 'city'],
    ])

    expect(
      effectiveVisibleFields(
        columns,
        columnVisibilityOverridesFromState(columns, {
          version: 1,
          visibility: {
            name: false,
            missing: false,
          },
        })
      )
    ).toStrictEqual(['id', 'city'])
  })

  it('captures visibility overrides while preserving previously saved missing fields', () => {
    expect(
      columnVisibilityStateFromColumns(
        columnMap([
          ['runtime-id', 'id'],
          ['runtime-name', 'name', false],
          ['runtime-status', 'status'],
        ]),
        new Map(),
        {
          version: 1,
          visibility: {
            city: false,
            name: false,
          },
        }
      )
    ).toStrictEqual({
      version: 1,
      visibility: {
        city: false,
      },
    })
  })

  it('removes saved hidden state when a current field becomes visible', () => {
    expect(
      columnVisibilityStateFromColumns(
        columnMap([
          ['runtime-id', 'id'],
          ['runtime-name', 'name'],
        ]),
        new Map(),
        {
          version: 1,
          visibility: {
            name: false,
            total: false,
          },
        }
      )
    ).toStrictEqual({
      version: 1,
      visibility: {
        total: false,
      },
    })
  })

  it('captures shown state for a default-hidden current field', () => {
    expect(
      columnVisibilityStateFromColumns(
        columnMap([
          ['runtime-id', 'id'],
          ['runtime-internal-id', 'internalId', false],
        ]),
        new Map([['runtime-internal-id', true]])
      )
    ).toStrictEqual({
      version: 1,
      visibility: {
        internalId: true,
      },
    })
  })

  it('publishes runtime visibility by column key', () => {
    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
      ])
    )

    engine.pub(setColumnVisibility$, { key: 'runtime-name', visible: false })

    expect(visibleFields(engine.getValue(visibleColumns$))).toStrictEqual(['id'])
    expect(engine.getValue(columnVisibilityState$)).toStrictEqual(
      new Map([
        ['runtime-id', true],
        ['runtime-name', false],
      ])
    )
  })

  it('shows default-hidden columns with a true visibility override', () => {
    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-internal-id', 'internalId', false],
      ])
    )

    expect(visibleFields(engine.getValue(visibleColumns$))).toStrictEqual(['id'])

    engine.pub(setColumnVisibility$, { key: 'runtime-internal-id', visible: true })

    expect(visibleFields(engine.getValue(visibleColumns$))).toStrictEqual(['id', 'internalId'])
    expect(engine.getValue(columnVisibilityState$)).toStrictEqual(
      new Map([
        ['runtime-id', true],
        ['runtime-internal-id', true],
      ])
    )
  })

  it('excludes hidden columns from count, total width, and sticky state', () => {
    engine.pub(
      columns$,
      new Map<string, ColumnInfo>([
        ['runtime-id', { field: 'id', sticky: 'left' }],
        ['runtime-name', { field: 'name' }],
        ['runtime-status', { field: 'status', sticky: 'right' }],
      ])
    )
    engine.pub(
      columnWidths$,
      new Map([
        ['runtime-id', 100],
        ['runtime-name', 150],
        ['runtime-status', 200],
      ])
    )

    expect(engine.getValue(columnCount$)).toBe(3)
    expect(engine.getValue(totalWidth$)).toBe(450)
    expect(engine.getValue(stickyColumnsState$).leftColumns.map((column) => column.key)).toStrictEqual(['runtime-id'])
    expect(engine.getValue(stickyColumnsState$).rightColumns.map((column) => column.key)).toStrictEqual(['runtime-status'])

    engine.pub(setColumnVisibility$, { key: 'runtime-id', visible: false })
    engine.pub(setColumnVisibility$, { key: 'runtime-status', visible: false })

    expect(engine.getValue(columnCount$)).toBe(1)
    expect(engine.getValue(totalWidth$)).toBe(150)
    expect(engine.getValue(stickyColumnsState$).leftColumns).toStrictEqual([])
    expect(engine.getValue(stickyColumnsState$).rightColumns).toStrictEqual([])
  })

  it('resets runtime visibility back to declaration defaults', () => {
    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name', false],
        ['runtime-status', 'status'],
      ])
    )
    engine.pub(setColumnVisibility$, { key: 'runtime-id', visible: false })
    engine.pub(setColumnVisibility$, { key: 'runtime-name', visible: true })

    engine.pub(resetColumnVisibility$)

    expect(visibleFields(engine.getValue(visibleColumns$))).toStrictEqual(['id', 'status'])
  })

  it('restores through the state persistence adapter', () => {
    const adapter = columnVisibilityPersistenceAdapter()
    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
        ['runtime-status', 'status'],
      ])
    )

    adapter.restore(persistenceContext(), {
      version: 1,
      visibility: {
        status: false,
      },
    })

    expect(visibleFields(engine.getValue(visibleColumns$))).toStrictEqual(['id', 'name'])
  })

  it('notifies saves for visibility actions and restores for schema changes', async () => {
    const adapter = columnVisibilityPersistenceAdapter()
    const onSave = vi.fn()
    const onRestore = vi.fn()
    const unsubscribeSave = adapter.subscribe(persistenceContext(), onSave)
    const unsubscribeRestore = adapter.subscribeRestore!(persistenceContext(), onRestore)

    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
      ])
    )

    expect(onRestore).toHaveBeenCalledOnce()

    engine.pub(setColumnVisibility$, { key: 'runtime-name', visible: false })

    expect(onSave).toHaveBeenCalledOnce()
    expect(onRestore).toHaveBeenCalledOnce()

    await Promise.resolve()

    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name', false],
        ['runtime-city', 'city'],
      ])
    )

    expect(onRestore).toHaveBeenCalledTimes(2)

    unsubscribeSave()
    unsubscribeRestore()
    engine.pub(setColumnVisibility$, { key: 'runtime-city', visible: false })
    engine.pub(columns$, columnMap([['runtime-id', 'id']]))

    expect(onSave).toHaveBeenCalledOnce()
    expect(onRestore).toHaveBeenCalledTimes(2)
  })
})
