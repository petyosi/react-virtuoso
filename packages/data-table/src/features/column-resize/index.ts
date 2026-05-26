// oxlint-disable require-hook
import { Stream, Trigger, e } from '@virtuoso.dev/reactive-engine-core'

import { columns$ } from '../../columns/Column'
import { columnWidthOverrides$ } from '../../columns/column-width-overrides'

import type { ColumnInfo } from '../../columns/Column'
import type { DataTableStatePersistenceAdapter } from '../state-persistence'

/**
 * Payload for changing a column width override.
 *
 * @group Remote Control
 */
export interface ResizeColumnPayload {
  key: string
  width: number
}

export interface ClearColumnWidthOverridePayload {
  key: string
}

/**
 * Serializable column width state keyed by stable column field names.
 *
 * @group Remote Control
 */
export interface ColumnWidthPersistenceState {
  version: 1
  widths: Record<string, number>
}

/**
 * Remote action that resizes a column.
 *
 * @group Remote Control
 */
export const resizeColumn$ = Stream<ResizeColumnPayload>()

/**
 * Remote action that clears a single column width override.
 *
 * @group Remote Control
 */
export const clearColumnWidthOverride$ = Stream<ClearColumnWidthOverridePayload>()

/**
 * Remote action that clears all stored column width overrides.
 *
 * @group Remote Control
 */
export const resetColumnWidthOverrides$ = Trigger()

/**
 * Remote action that restores serialized column width state into the current
 * runtime column width overrides.
 *
 * @group Remote Control
 */
export const restoreColumnWidthState$ = Stream<ColumnWidthPersistenceState>()

function isValidPersistedWidth(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Converts persisted field-keyed column widths into runtime column-keyed width
 * overrides for the currently registered columns.
 *
 * @group Remote Control
 */
export function columnWidthOverridesFromState(
  columns: Map<string, ColumnInfo>,
  state: ColumnWidthPersistenceState | null | undefined
): Map<string, number> {
  const overrides = new Map<string, number>()
  if (!state || state.version !== 1) {
    return overrides
  }

  for (const [key, column] of columns) {
    const width = state.widths[column.field]
    if (isValidPersistedWidth(width)) {
      overrides.set(key, width)
    }
  }

  return overrides
}

/**
 * Converts runtime column-keyed width overrides into serializable field-keyed
 * state while preserving saved widths for columns that are not currently
 * registered.
 *
 * @group Remote Control
 */
export function columnWidthStateFromOverrides(
  columns: Map<string, ColumnInfo>,
  overrides: Map<string, number>,
  previous?: ColumnWidthPersistenceState | null
): ColumnWidthPersistenceState {
  const widths: Record<string, number> = previous?.version === 1 ? { ...previous.widths } : {}
  const currentFields = new Set<string>()

  for (const column of columns.values()) {
    currentFields.add(column.field)
  }

  for (const field of currentFields) {
    delete widths[field]
  }

  for (const [key, width] of overrides) {
    const column = columns.get(key)
    if (column && isValidPersistedWidth(width)) {
      widths[column.field] = width
    }
  }

  return { version: 1, widths }
}

/**
 * Creates a state persistence adapter for column width overrides.
 *
 * @group Remote Control
 */
export function columnWidthPersistenceAdapter(): DataTableStatePersistenceAdapter<ColumnWidthPersistenceState> {
  return {
    key: 'columnWidths',
    capture({ engine }, previous) {
      return columnWidthStateFromOverrides(engine.getValue(columns$), engine.getValue(columnWidthOverrides$), previous)
    },
    restore({ engine }, state) {
      engine.pub(restoreColumnWidthState$, state ?? { version: 1, widths: {} })
    },
    subscribe({ engine }, onChange) {
      return engine.sub(columnWidthOverrides$, onChange)
    },
    subscribeRestore({ engine }, onChange) {
      return engine.sub(columns$, onChange)
    },
  }
}

e.changeWith(columnWidthOverrides$, resizeColumn$, (overrides, { key, width }) => {
  const next = new Map(overrides)
  // oxlint-disable-next-line no-immediate-mutation
  next.set(key, width)
  return next
})

e.changeWith(columnWidthOverrides$, clearColumnWidthOverride$, (overrides, { key }) => {
  if (!overrides.has(key)) {
    return overrides
  }

  const next = new Map(overrides)
  next.delete(key)
  return next
})

e.changeWith(columnWidthOverrides$, resetColumnWidthOverrides$, (overrides) => {
  return overrides.size === 0 ? overrides : new Map<string, number>()
})

e.changeWith(columnWidthOverrides$, e.pipe(restoreColumnWidthState$, e.withLatestFrom(columns$)), (_overrides, [state, columns]) =>
  columnWidthOverridesFromState(columns, state)
)
