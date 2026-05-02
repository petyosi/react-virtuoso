import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { columnDeclarationOrder$, columns$ } from '../../../../columns/Column'
import {
  columnOrderPersistenceAdapter,
  columnOrderStateFromColumns,
  columnsFromDeclarationOrder,
  columnsFromColumnOrderState,
  reorderColumnGroup$,
  reorderColumns$,
  resetColumnOrder$,
  restoreColumnOrderState$,
} from '../../index'

import type { ColumnInfo } from '../../../../columns/Column'
import type { ColumnOrderPersistenceState } from '../../index'

function columnMap(entries: [string, string][]) {
  return new Map(entries.map(([key, field]) => [key, { field }] as [string, ColumnInfo]))
}

function fields(columns: Map<string, ColumnInfo>) {
  return [...columns.values()].map((column) => column.field)
}

describe('column order persistence', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(columns$)
    engine.register(columnDeclarationOrder$)
  })

  it('restores matching saved fields before new current fields', () => {
    const columns = columnMap([
      ['runtime-id', 'id'],
      ['runtime-name', 'name'],
      ['runtime-status', 'status'],
      ['runtime-city', 'city'],
    ])

    expect(
      fields(
        columnsFromColumnOrderState(columns, {
          version: 1,
          fields: ['status', 'id', 'missing'],
        })
      )
    ).toStrictEqual(['status', 'id', 'name', 'city'])
  })

  it('returns the same column map when no valid state is available', () => {
    const columns = columnMap([
      ['runtime-id', 'id'],
      ['runtime-name', 'name'],
    ])

    expect(columnsFromColumnOrderState(columns, null)).toBe(columns)
    expect(columnsFromColumnOrderState(columns, undefined)).toBe(columns)
    expect(columnsFromColumnOrderState(columns, { version: 1, fields: 'id' } as unknown as ColumnOrderPersistenceState)).toBe(columns)
  })

  it('deduplicates repeated saved fields while keeping all current columns visible', () => {
    expect(
      fields(
        columnsFromColumnOrderState(
          columnMap([
            ['runtime-id', 'id'],
            ['runtime-status', 'status'],
            ['runtime-status-copy', 'status'],
            ['runtime-city', 'city'],
          ]),
          {
            version: 1,
            fields: ['status', 'status', 'id'],
          }
        )
      )
    ).toStrictEqual(['status', 'id', 'status', 'city'])
  })

  it('captures current field order and preserves previously saved missing fields', () => {
    expect(
      columnOrderStateFromColumns(
        columnMap([
          ['runtime-status', 'status'],
          ['runtime-id', 'id'],
          ['runtime-name', 'name'],
        ]),
        {
          version: 1,
          fields: ['id', 'total', 'status', 'score'],
        }
      )
    ).toStrictEqual({
      version: 1,
      fields: ['status', 'id', 'name', 'total', 'score'],
    })
  })

  it('restores persisted order by replacing the runtime column order', () => {
    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
        ['runtime-status', 'status'],
        ['runtime-city', 'city'],
      ])
    )

    engine.pub(restoreColumnOrderState$, {
      version: 1,
      fields: ['status', 'id'],
    })

    expect(fields(engine.getValue(columns$))).toStrictEqual(['status', 'id', 'name', 'city'])
  })

  it('resets runtime order back to declaration order', () => {
    expect(
      fields(
        columnsFromDeclarationOrder(
          columnMap([
            ['runtime-status', 'status'],
            ['runtime-id', 'id'],
            ['runtime-name', 'name'],
          ]),
          ['runtime-id', 'runtime-name', 'runtime-status']
        )
      )
    ).toStrictEqual(['id', 'name', 'status'])
  })

  it('captures persisted state through the state persistence adapter after single-column reorder', () => {
    const adapter = columnOrderPersistenceAdapter()
    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
        ['runtime-status', 'status'],
      ])
    )

    engine.pub(reorderColumns$, { sourceKey: 'runtime-status', targetKey: 'runtime-id', position: 'before' })

    expect(adapter.capture(engine, null)).toStrictEqual({
      version: 1,
      fields: ['status', 'id', 'name'],
    })
  })

  it('captures persisted state through the state persistence adapter after group reorder', () => {
    const adapter = columnOrderPersistenceAdapter()
    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-first-name', 'firstName'],
        ['runtime-last-name', 'lastName'],
        ['runtime-city', 'city'],
      ])
    )

    engine.pub(reorderColumnGroup$, {
      sourceKeys: ['runtime-first-name', 'runtime-last-name'],
      targetKey: 'runtime-city',
      position: 'after',
    })

    expect(adapter.capture(engine, null)).toStrictEqual({
      version: 1,
      fields: ['id', 'city', 'firstName', 'lastName'],
    })
  })

  it('notifies saves for reorder actions and restores for non-reorder column changes', async () => {
    const adapter = columnOrderPersistenceAdapter()
    const onSave = vi.fn()
    const onRestore = vi.fn()
    const unsubscribeSave = adapter.subscribe(engine, onSave)
    const unsubscribeRestore = adapter.subscribeRestore!(engine, onRestore)

    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
        ['runtime-status', 'status'],
      ])
    )

    expect(onRestore).toHaveBeenCalledOnce()

    engine.pub(reorderColumns$, { sourceKey: 'runtime-status', targetKey: 'runtime-id', position: 'before' })

    expect(onSave).toHaveBeenCalledOnce()
    expect(onRestore).toHaveBeenCalledOnce()

    await Promise.resolve()

    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
        ['runtime-status', 'status'],
        ['runtime-city', 'city'],
      ])
    )

    expect(onRestore).toHaveBeenCalledTimes(2)

    unsubscribeSave()
    unsubscribeRestore()
    engine.pub(reorderColumns$, { sourceKey: 'runtime-city', targetKey: 'runtime-id', position: 'before' })
    engine.pub(columns$, columnMap([['runtime-id', 'id']]))

    expect(onSave).toHaveBeenCalledOnce()
    expect(onRestore).toHaveBeenCalledTimes(2)
  })

  it('notifies the save subscription when persisted order is restored', () => {
    const adapter = columnOrderPersistenceAdapter()
    const onSave = vi.fn()
    const unsubscribeSave = adapter.subscribe(engine, onSave)

    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
        ['runtime-status', 'status'],
      ])
    )
    engine.pub(restoreColumnOrderState$, {
      version: 1,
      fields: ['status', 'id'],
    })

    expect(onSave).toHaveBeenCalledOnce()

    unsubscribeSave()
    engine.pub(restoreColumnOrderState$, {
      version: 1,
      fields: ['name', 'id'],
    })

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('resets order through the state persistence adapter when no state is available', () => {
    const adapter = columnOrderPersistenceAdapter()
    engine.pub(
      columns$,
      columnMap([
        ['runtime-id', 'id'],
        ['runtime-name', 'name'],
        ['runtime-status', 'status'],
      ])
    )
    engine.pub(columnDeclarationOrder$, ['runtime-id', 'runtime-name', 'runtime-status'])
    engine.pub(reorderColumns$, { sourceKey: 'runtime-status', targetKey: 'runtime-id', position: 'before' })

    adapter.restore(engine, null)

    expect(fields(engine.getValue(columns$))).toStrictEqual(['id', 'name', 'status'])
  })

  it('notifies the save subscription when column order is reset', () => {
    const adapter = columnOrderPersistenceAdapter()
    const onSave = vi.fn()
    const unsubscribeSave = adapter.subscribe(engine, onSave)

    engine.pub(resetColumnOrder$, ['runtime-id'])

    expect(onSave).toHaveBeenCalledOnce()

    unsubscribeSave()
    engine.pub(resetColumnOrder$, ['runtime-name'])

    expect(onSave).toHaveBeenCalledOnce()
  })
})
