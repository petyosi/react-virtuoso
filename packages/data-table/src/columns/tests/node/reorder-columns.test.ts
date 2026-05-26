import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { beginColumnDrag$, columnDragState$, endColumnDrag$, reorderColumns$, setColumnDropTarget$ } from '../../../features/column-reorder'
import { columns$ } from '../../Column'

import type { ColumnInfo } from '../../Column'

describe('reorderColumns', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(columns$)
    engine.register(columnDragState$)
  })

  function setupColumns(keys: string[]) {
    engine.pub(columns$, new Map(keys.map((key) => [key, { field: key }] as [string, ColumnInfo])))
  }

  function columnKeys() {
    return [...engine.getValue(columns$).keys()]
  }

  it('moves a column before the target', () => {
    setupColumns(['a', 'b', 'c', 'd'])

    engine.pub(reorderColumns$, { sourceKey: 'c', targetKey: 'a', position: 'before' })

    expect(columnKeys()).toStrictEqual(['c', 'a', 'b', 'd'])
  })

  it('moves a column after the target', () => {
    setupColumns(['a', 'b', 'c', 'd'])

    engine.pub(reorderColumns$, { sourceKey: 'a', targetKey: 'c', position: 'after' })

    expect(columnKeys()).toStrictEqual(['b', 'c', 'a', 'd'])
  })

  it('is a no-op when source and target are the same', () => {
    setupColumns(['a', 'b', 'c'])

    engine.pub(reorderColumns$, { sourceKey: 'b', targetKey: 'b', position: 'before' })

    expect(columnKeys()).toStrictEqual(['a', 'b', 'c'])
  })

  it('is a no-op when source key does not exist', () => {
    setupColumns(['a', 'b', 'c'])

    engine.pub(reorderColumns$, { sourceKey: 'missing', targetKey: 'b', position: 'before' })

    expect(columnKeys()).toStrictEqual(['a', 'b', 'c'])
  })

  it('preserves all columns when target key does not exist', () => {
    setupColumns(['a', 'b', 'c'])

    engine.pub(reorderColumns$, { sourceKey: 'b', targetKey: 'missing', position: 'before' })

    expect(columnKeys()).toStrictEqual(['a', 'b', 'c'])
  })

  it('ignores drop target updates when no drag is active', () => {
    engine.pub(setColumnDropTarget$, { key: 'a', position: 'before' })

    expect(engine.getValue(columnDragState$)).toStrictEqual({
      sourceKeys: null,
      sourceSticky: undefined,
      dropTarget: null,
    })
  })

  it('does not resurrect the drop target after drag end', () => {
    engine.pub(beginColumnDrag$, { sourceKeys: ['a'], sourceSticky: undefined })
    engine.pub(setColumnDropTarget$, { key: 'b', position: 'after' })
    engine.pub(endColumnDrag$)
    engine.pub(setColumnDropTarget$, { key: 'c', position: 'before' })

    expect(engine.getValue(columnDragState$)).toStrictEqual({
      sourceKeys: null,
      sourceSticky: undefined,
      dropTarget: null,
    })
  })
})
