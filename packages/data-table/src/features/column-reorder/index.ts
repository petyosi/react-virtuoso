// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'

import { columns$ } from '../../columns/Column'

import type { ColumnInfo } from '../../columns/Column'

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
