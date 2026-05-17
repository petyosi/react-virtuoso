// oxlint-disable require-hook
import { DerivedCell, Stream, Trigger, e } from '@virtuoso.dev/reactive-engine-core'

import { columns$, columnVisibilityOverrides$ } from '../../columns/Column'

import type { ColumnInfo } from '../../columns/Column'
import type { DataTableStatePersistenceAdapter } from '../state-persistence'

/**
 * Payload for changing a column visibility override.
 *
 * @group Remote Control
 */
export interface SetColumnVisibilityPayload {
  key: string
  visible: boolean
}

/**
 * Remote action that changes column visibility by runtime column key.
 *
 * @group Remote Control
 */
export const setColumnVisibility$ = Stream<SetColumnVisibilityPayload>()

/**
 * Remote action that resets runtime column visibility back to declarative
 * `Column` / `DataTableColumn` visibility defaults.
 *
 * @group Remote Control
 */
export const resetColumnVisibility$ = Trigger()

/**
 * Serializable column visibility state keyed by stable column field names.
 *
 * @group Remote Control
 */
export interface ColumnVisibilityPersistenceState {
  version: 1
  visibility: Record<string, boolean>
}

/**
 * Remote action that restores serialized column visibility state into the
 * current runtime columns.
 *
 * @group Remote Control
 */
export const restoreColumnVisibilityState$ = Stream<ColumnVisibilityPersistenceState>()

/**
 * Runtime column visibility by column key.
 *
 * @group State
 */
export const columnVisibilityState$ = DerivedCell(
  new Map<string, boolean>(),
  e.pipe(
    e.combine(columns$, columnVisibilityOverrides$),
    e.map(([columns, visibilityOverrides]) => {
      return new Map([...columns].map(([key, column]) => [key, visibilityOverrides.get(key) ?? column.visible !== false]))
    })
  )
)

function isColumnVisibilityPersistenceState(
  state: ColumnVisibilityPersistenceState | null | undefined
): state is ColumnVisibilityPersistenceState {
  return state?.version === 1 && typeof state.visibility === 'object' && state.visibility !== null
}

/**
 * Converts persisted field-keyed column visibility into runtime column-keyed
 * visibility overrides for the currently registered columns.
 *
 * @group Remote Control
 */
export function columnVisibilityOverridesFromState(
  columns: Map<string, ColumnInfo>,
  state: ColumnVisibilityPersistenceState | null | undefined
): Map<string, boolean> {
  const overrides = new Map<string, boolean>()
  if (!isColumnVisibilityPersistenceState(state)) {
    return overrides
  }

  for (const [key, column] of columns) {
    const persistedVisibility = state.visibility[column.field]
    if (typeof persistedVisibility !== 'boolean') {
      continue
    }

    const defaultVisibility = column.visible !== false
    if (persistedVisibility !== defaultVisibility) {
      overrides.set(key, persistedVisibility)
    }
  }

  return overrides
}

/**
 * Converts runtime column visibility into serializable field-keyed state while
 * preserving saved visibility for columns that are not currently registered.
 *
 * @group Remote Control
 */
export function columnVisibilityStateFromColumns(
  columns: Map<string, ColumnInfo>,
  visibilityOverrides: Map<string, boolean>,
  previous?: ColumnVisibilityPersistenceState | null
): ColumnVisibilityPersistenceState {
  const visibility: Record<string, boolean> = isColumnVisibilityPersistenceState(previous) ? { ...previous.visibility } : {}
  const currentFields = new Set<string>()

  for (const column of columns.values()) {
    currentFields.add(column.field)
  }

  for (const field of currentFields) {
    delete visibility[field]
  }

  for (const [key, column] of columns) {
    const visible = visibilityOverrides.get(key) ?? column.visible !== false
    if (!visible) {
      visibility[column.field] = false
    }
  }

  return { version: 1, visibility }
}

/**
 * Creates a state persistence adapter for column visibility.
 *
 * @group Remote Control
 */
export function columnVisibilityPersistenceAdapter(): DataTableStatePersistenceAdapter<ColumnVisibilityPersistenceState> {
  return {
    key: 'columnVisibility',
    capture({ engine }, previous) {
      return columnVisibilityStateFromColumns(engine.getValue(columns$), engine.getValue(columnVisibilityOverrides$), previous)
    },
    restore({ engine }, state) {
      const nextOverrides = columnVisibilityOverridesFromState(engine.getValue(columns$), state)
      engine.pub(restoreColumnVisibilityState$, state ?? { version: 1, visibility: {} })
      engine.pub(columnVisibilityOverrides$, nextOverrides)
    },
    subscribe({ engine }, onChange) {
      const unsubscribeVisibility = engine.sub(columnVisibilityOverrides$, onChange)
      const unsubscribeRestore = engine.sub(restoreColumnVisibilityState$, onChange)
      const unsubscribeReset = engine.sub(resetColumnVisibility$, onChange)
      return () => {
        unsubscribeVisibility()
        unsubscribeRestore()
        unsubscribeReset()
      }
    },
    subscribeRestore({ engine }, onChange) {
      const unsubscribeColumns = engine.sub(columns$, onChange)

      return () => {
        unsubscribeColumns()
      }
    },
  }
}

e.changeWith(columnVisibilityOverrides$, setColumnVisibility$, (overrides, { key, visible }) => {
  const next = new Map(overrides)
  if (visible) {
    next.delete(key)
  } else {
    // oxlint-disable-next-line no-immediate-mutation
    next.set(key, false)
  }
  return next
})

e.changeWith(columnVisibilityOverrides$, resetColumnVisibility$, (overrides) =>
  overrides.size === 0 ? overrides : new Map<string, boolean>()
)

e.changeWith(
  columnVisibilityOverrides$,
  e.pipe(restoreColumnVisibilityState$, e.withLatestFrom(columns$)),
  (_overrides, [state, columns]) => columnVisibilityOverridesFromState(columns, state)
)
