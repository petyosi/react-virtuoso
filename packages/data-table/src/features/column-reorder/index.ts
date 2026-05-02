// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'

import { columnDeclarationOrder$, columns$ } from '../../columns/Column'

import type { ColumnInfo } from '../../columns/Column'
import type { DataTableStatePersistenceAdapter } from '../state-persistence'

/**
 * Payload for moving one column before or after another.
 *
 * @group Remote Control
 */
export interface ReorderColumnsPayload {
  sourceKey: string
  targetKey: string
  position: 'before' | 'after'
}

/**
 * Remote action that reorders columns.
 *
 * @group Remote Control
 */
export const reorderColumns$ = Stream<ReorderColumnsPayload>()

function reorderOne(columns: Map<string, ColumnInfo>, payload: ReorderColumnsPayload): Map<string, ColumnInfo> {
  const { sourceKey, targetKey, position } = payload
  if (sourceKey === targetKey) {
    return columns
  }
  const sourceEntry = columns.get(sourceKey)
  if (!sourceEntry || !columns.has(targetKey)) {
    return columns
  }

  const newMap = new Map<string, ColumnInfo>()
  for (const [key, info] of columns) {
    if (key === sourceKey) {
      continue
    }
    if (key === targetKey) {
      if (position === 'before') {
        newMap.set(sourceKey, sourceEntry)
        newMap.set(key, info)
      } else {
        newMap.set(key, info)
        newMap.set(sourceKey, sourceEntry)
      }
    } else {
      newMap.set(key, info)
    }
  }
  return newMap
}

e.changeWith(columns$, reorderColumns$, reorderOne)

/**
 * Serializable column order state keyed by stable column field names.
 *
 * @group Remote Control
 */
export interface ColumnOrderPersistenceState {
  version: 1
  fields: string[]
}

/**
 * Remote action that restores serialized column order state into the current
 * runtime column order.
 *
 * @group Remote Control
 */
export const restoreColumnOrderState$ = Stream<ColumnOrderPersistenceState>()

/**
 * Remote action that resets the current runtime column order back to component
 * declaration order.
 *
 * @group Remote Control
 */
export const resetColumnOrder$ = Stream<string[]>()

function isColumnOrderPersistenceState(state: ColumnOrderPersistenceState | null | undefined): state is ColumnOrderPersistenceState {
  return state?.version === 1 && Array.isArray(state.fields)
}

function sameColumnOrder(left: Map<string, ColumnInfo>, right: Map<string, ColumnInfo>) {
  if (left.size !== right.size) {
    return false
  }

  const leftKeys = [...left.keys()]
  const rightKeys = [...right.keys()]
  return leftKeys.every((key, index) => key === rightKeys[index])
}

function appendField(fields: string[], seenFields: Set<string>, field: string) {
  if (!seenFields.has(field)) {
    seenFields.add(field)
    fields.push(field)
  }
}

/**
 * Converts persisted field-keyed column order into a runtime column map for
 * the currently registered columns.
 *
 * @group Remote Control
 */
export function columnsFromColumnOrderState(
  columns: Map<string, ColumnInfo>,
  state: ColumnOrderPersistenceState | null | undefined
): Map<string, ColumnInfo> {
  if (!isColumnOrderPersistenceState(state)) {
    return columns
  }

  const availableByField = new Map<string, [string, ColumnInfo][]>()
  for (const entry of columns) {
    const fieldEntries = availableByField.get(entry[1].field)
    if (fieldEntries) {
      fieldEntries.push(entry)
    } else {
      availableByField.set(entry[1].field, [entry])
    }
  }

  const next = new Map<string, ColumnInfo>()
  const usedKeys = new Set<string>()
  const restoredFields = new Set<string>()

  for (const field of state.fields) {
    if (restoredFields.has(field)) {
      continue
    }
    restoredFields.add(field)

    const entries = availableByField.get(field)
    const entry = entries?.find(([key]) => !usedKeys.has(key))
    if (entry) {
      next.set(entry[0], entry[1])
      usedKeys.add(entry[0])
    }
  }

  for (const [key, column] of columns) {
    if (!usedKeys.has(key)) {
      next.set(key, column)
    }
  }

  return sameColumnOrder(columns, next) ? columns : next
}

/**
 * Reorders the current column map by runtime declaration order.
 *
 * @group Remote Control
 */
export function columnsFromDeclarationOrder(columns: Map<string, ColumnInfo>, declarationOrder: string[]): Map<string, ColumnInfo> {
  const next = new Map<string, ColumnInfo>()

  for (const key of declarationOrder) {
    const column = columns.get(key)
    if (column) {
      next.set(key, column)
    }
  }

  for (const [key, column] of columns) {
    if (!next.has(key)) {
      next.set(key, column)
    }
  }

  return sameColumnOrder(columns, next) ? columns : next
}

/**
 * Converts runtime column order into serializable field-keyed state while
 * preserving saved fields that are not currently registered.
 *
 * @group Remote Control
 */
export function columnOrderStateFromColumns(
  columns: Map<string, ColumnInfo>,
  previous?: ColumnOrderPersistenceState | null
): ColumnOrderPersistenceState {
  const fields: string[] = []
  const seenFields = new Set<string>()
  const currentFields = new Set<string>()

  for (const column of columns.values()) {
    currentFields.add(column.field)
    appendField(fields, seenFields, column.field)
  }

  if (isColumnOrderPersistenceState(previous)) {
    for (const field of previous.fields) {
      if (!currentFields.has(field)) {
        appendField(fields, seenFields, field)
      }
    }
  }

  return { version: 1, fields }
}

/**
 * Payload for moving a contiguous group of columns before or after a target.
 * Used to drag whole column groups while preserving the relative order of the
 * grouped columns.
 *
 * @group Remote Control
 */
export interface ReorderColumnGroupPayload {
  sourceKeys: string[]
  targetKey: string
  position: 'before' | 'after'
}

/**
 * Remote action that reorders a contiguous group of columns. Iterates the
 * source keys in reverse when `position === 'after'` so the group's internal
 * order is preserved after the move.
 *
 * @group Remote Control
 */
export const reorderColumnGroup$ = Stream<ReorderColumnGroupPayload>()

e.changeWith(columns$, reorderColumnGroup$, (columns, { sourceKeys, targetKey, position }) => {
  if (sourceKeys.length === 0 || sourceKeys.includes(targetKey)) {
    return columns
  }
  const ordered = position === 'after' ? sourceKeys.toReversed() : sourceKeys
  let next = columns
  for (const sourceKey of ordered) {
    next = reorderOne(next, { sourceKey, targetKey, position })
  }
  return next
})

/**
 * Creates a state persistence adapter for column order.
 *
 * @group Remote Control
 */
export function columnOrderPersistenceAdapter(): DataTableStatePersistenceAdapter<ColumnOrderPersistenceState> {
  return {
    key: 'columnOrder',
    capture(engine, previous) {
      return columnOrderStateFromColumns(engine.getValue(columns$), previous)
    },
    restore(engine, state) {
      engine.register(restoreColumnOrderState$)
      engine.register(resetColumnOrder$)
      if (state) {
        engine.pub(columns$, columnsFromColumnOrderState(engine.getValue(columns$), state))
        engine.pub(restoreColumnOrderState$, state)
      } else {
        const declarationOrder = engine.getValue(columnDeclarationOrder$)
        engine.pub(columns$, columnsFromDeclarationOrder(engine.getValue(columns$), declarationOrder))
        engine.pub(resetColumnOrder$, declarationOrder)
      }
    },
    subscribe(engine, onChange) {
      const unsubscribeColumn = engine.sub(reorderColumns$, onChange)
      const unsubscribeGroup = engine.sub(reorderColumnGroup$, onChange)
      const unsubscribeRestore = engine.sub(restoreColumnOrderState$, onChange)
      const unsubscribeReset = engine.sub(resetColumnOrder$, onChange)
      return () => {
        unsubscribeColumn()
        unsubscribeGroup()
        unsubscribeRestore()
        unsubscribeReset()
      }
    },
    subscribeRestore(engine, onChange) {
      let skipRestoreForCurrentReorder = false

      const markUserReorder = () => {
        skipRestoreForCurrentReorder = true
        queueMicrotask(() => {
          skipRestoreForCurrentReorder = false
        })
      }

      const unsubscribeColumn = engine.sub(reorderColumns$, markUserReorder)
      const unsubscribeGroup = engine.sub(reorderColumnGroup$, markUserReorder)
      const unsubscribeColumns = engine.sub(columns$, () => {
        if (skipRestoreForCurrentReorder) {
          skipRestoreForCurrentReorder = false
          return
        }

        onChange()
      })

      return () => {
        unsubscribeColumn()
        unsubscribeGroup()
        unsubscribeColumns()
      }
    },
  }
}

/**
 * Reactive drag-coordination state shared between the grip and drop-zone UIs.
 * `sourceKeys` is `null` when no drag is in progress, a single-element array
 * for a single-column drag, or a multi-element array for a column-group drag —
 * so both flows share the same shape.
 *
 * @group Remote Control
 */
export interface ColumnDragState {
  sourceKeys: string[] | null
  sourceSticky: 'left' | 'right' | undefined
  dropTarget: { key: string; position: 'before' | 'after' } | null
}

const INITIAL_DRAG_STATE: ColumnDragState = { sourceKeys: null, sourceSticky: undefined, dropTarget: null }

/**
 * Reactive cell holding the active drag state. Subscribe to derive UI like
 * "is any column being dragged?" or to drive a drop indicator's position.
 *
 * @group Remote Control
 */
export const columnDragState$ = Cell<ColumnDragState>(INITIAL_DRAG_STATE)

/**
 * Begin a drag. Publish from the grip's `onDragStart`. The state must be
 * updated synchronously inside the dragstart handler — Chrome and Safari
 * return `""` from `dataTransfer.getData()` during `dragover`, so a reactive
 * cell is the only way for sibling drop zones to read the source identity.
 *
 * @group Remote Control
 */
export const beginColumnDrag$ = Stream<{ sourceKeys: string[]; sourceSticky: 'left' | 'right' | undefined }>()

/**
 * End a drag. Publish from `onDragEnd` (and after a successful drop). Resets
 * the cell back to its idle shape.
 *
 * @group Remote Control
 */
export const endColumnDrag$ = Stream<void>()

/**
 * Update the active drop target. Publish `null` to clear the indicator (e.g.
 * on `dragleave`).
 *
 * @group Remote Control
 */
export const setColumnDropTarget$ = Stream<{ key: string; position: 'before' | 'after' } | null>()

e.changeWith(columnDragState$, beginColumnDrag$, (_state, { sourceKeys, sourceSticky }) => ({
  sourceKeys,
  sourceSticky,
  dropTarget: null,
}))

e.changeWith(columnDragState$, endColumnDrag$, () => INITIAL_DRAG_STATE)

e.changeWith(columnDragState$, setColumnDropTarget$, (state, dropTarget) => {
  if (dropTarget === null) {
    return state.dropTarget === null ? state : { ...state, dropTarget: null }
  }

  // Native drag events can still arrive after `dragend`/`drop`; ignore them
  // once the drag has already been torn down so the marker cannot reappear.
  if (state.sourceKeys === null) {
    return state
  }

  return { ...state, dropTarget }
})

e.changeWith(columns$, restoreColumnOrderState$, columnsFromColumnOrderState)
e.changeWith(columns$, resetColumnOrder$, columnsFromDeclarationOrder)
