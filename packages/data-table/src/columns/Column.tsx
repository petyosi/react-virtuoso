import { createContext, useContext, useId, useLayoutEffect } from 'react'

// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { viewportWidth$ } from '../scroll/dom'
import { columnCount$, columnRanges$ } from './column-sizes'
import { computeAutoFillColumnWidths } from './column-width-distribution'
import { columnWidthOverrides$ } from './column-width-overrides'
import { ColumnGroupIdContext } from './ColumnGroup'
import { createRegistryCell } from './registry'

import type { SizeRange } from '../interfaces'

const ColumnIdContext = createContext<string>('')

/**
 * Describes a registered column in the table.
 *
 * @group Components
 */
export interface ColumnInfo {
  field: string
  sticky?: 'left' | 'right'
  groupId?: string
  visible?: boolean
}

const { cell$: columns$, register$: columnRegister$ } = createRegistryCell<ColumnInfo>()
export { columns$ }

/**
 * Runtime visibility overrides keyed by column key. When no override exists,
 * the column's declarative `visible` prop is used.
 *
 * @group State
 */
export const columnVisibilityOverrides$ = Cell<Map<string, boolean>>(new Map())

/**
 * Runtime columns that currently participate in rendering, layout, measurement,
 * virtualization, and sticky positioning.
 *
 * @group State
 */
export function visibleColumnsFromColumns(columns: Map<string, ColumnInfo>, visibilityOverrides: Map<string, boolean>) {
  return new Map([...columns].filter(([key, column]) => visibilityOverrides.get(key) ?? column.visible !== false))
}

export const visibleColumns$ = Cell<Map<string, ColumnInfo>>(new Map())

e.link(
  e.pipe(
    e.combine(columns$, columnVisibilityOverrides$),
    e.map(([columns, visibilityOverrides]) => visibleColumnsFromColumns(columns, visibilityOverrides))
  ),
  visibleColumns$
)

/**
 * Runtime column keys in component declaration order. Unlike {@link columns$},
 * this is not affected by user-driven column reorder operations.
 *
 * @group Remote Control
 */
export const columnDeclarationOrder$ = Cell<string[]>([])

e.changeWith(columnDeclarationOrder$, columnRegister$, (order, payload) => {
  if (payload.type === 'add') {
    return order.includes(payload.id) ? order : [...order, payload.id]
  }

  return order.filter((id) => id !== payload.id)
})

/**
 * Payload for changing the sticky side of a column.
 *
 * @group Remote Control
 */
export interface SetColumnStickyPayload {
  key: string
  sticky: 'left' | 'right' | undefined
}

/**
 * Remote action that toggles a column sticky state.
 *
 * @group Remote Control
 */
export const setColumnSticky$ = Stream<SetColumnStickyPayload>()

e.changeWith(columns$, setColumnSticky$, (columns, { key, sticky }) => {
  const existing = columns.get(key)
  if (!existing) {
    return columns
  }

  const updated: ColumnInfo = { ...existing }
  if (sticky === undefined) {
    delete updated.sticky
  } else {
    updated.sticky = sticky
  }

  const next = new Map(columns)
  // oxlint-disable-next-line no-immediate-mutation
  next.set(key, updated)
  return next
})

export function useColumnId() {
  return useContext(ColumnIdContext)
}

export namespace Column {
  /**
   * The properties accepted by the `Column` component.
   *
   * @group Components
   */
  export interface Props extends ColumnInfo {
    children?: React.ReactNode
    sticky?: 'left' | 'right'
    visible?: boolean
  }
}

/**
 * Declares a visible column in the table.
 *
 * @group Components
 */
export function Column({ children, field, sticky, visible }: Column.Props) {
  const colId = useId()
  const groupId = useContext(ColumnGroupIdContext) || undefined
  const columnRegister = usePublisher(columnRegister$)

  useLayoutEffect(() => {
    const info: ColumnInfo = { field }
    if (sticky) {
      info.sticky = sticky
    }
    if (groupId) {
      info.groupId = groupId
    }
    if (visible === false) {
      info.visible = false
    }
    columnRegister({ type: 'add', id: colId, value: info })
    return () => {
      columnRegister({ type: 'remove', id: colId })
    }
  }, [columnRegister, colId, field, sticky, groupId, visible])
  return <ColumnIdContext.Provider value={colId}>{children}</ColumnIdContext.Provider>
}

export const columnEntries$ = Stream<ResizeObserverEntry[]>()

export const measuredColumnWidths$ = Cell<Map<string, number>>(new Map())

function readInlineSize(entry: ResizeObserverEntry) {
  const borderBoxSize = entry.borderBoxSize as ResizeObserverSize | ResizeObserverSize[] | undefined
  const size = Array.isArray(borderBoxSize) ? borderBoxSize[0] : borderBoxSize
  return size?.inlineSize ?? entry.contentRect.width
}

e.changeWith(measuredColumnWidths$, columnEntries$, (widths, entries) => {
  const next = new Map(widths)
  for (const entry of entries) {
    const target = entry.target as HTMLElement
    const key = target.dataset.columnKey
    if (!key) {
      continue
    }
    next.set(key, readInlineSize(entry))
  }
  return next
})

export const columnBaseWidths$ = Cell<Map<string, number>>(new Map())

e.link(
  e.pipe(
    e.combine(visibleColumns$, measuredColumnWidths$, columnWidthOverrides$),
    e.map(([columns, measuredWidths, overrides]) => {
      const next = new Map<string, number>()
      for (const key of columns.keys()) {
        const baseWidth = overrides.get(key) ?? measuredWidths.get(key)
        if (baseWidth !== undefined) {
          next.set(key, baseWidth)
        }
      }
      return next
    })
  ),
  columnBaseWidths$
)

export const columnWidths$ = Cell<Map<string, number>>(new Map())

function hasCompleteWidths(columns: Map<string, ColumnInfo>, widths: Map<string, number>) {
  return [...columns.keys()].every((key) => (widths.get(key) ?? 0) > 0)
}

function nonOverriddenWidthsUseBaseWidths(
  columns: Map<string, ColumnInfo>,
  currentWidths: Map<string, number>,
  baseWidths: Map<string, number>,
  overrides: Map<string, number>
) {
  return [...columns.keys()].every((key) => overrides.has(key) || currentWidths.get(key) === baseWidths.get(key))
}

function computeInitialColumnWidthsWithOverrides(
  columns: Map<string, ColumnInfo>,
  baseWidths: Map<string, number>,
  defaultBaseWidths: Map<string, number>,
  overrides: Map<string, number>,
  viewportWidth: number
) {
  const realizedWidths = computeAutoFillColumnWidths([...columns.entries()], defaultBaseWidths, viewportWidth)

  for (const key of columns.keys()) {
    const override = overrides.get(key)
    if (override !== undefined) {
      realizedWidths.set(key, override)
    } else if (!realizedWidths.has(key)) {
      realizedWidths.set(key, baseWidths.get(key) ?? 0)
    }
  }

  return realizedWidths
}

e.changeWith(
  columnWidths$,
  e.combine(visibleColumns$, columnBaseWidths$, measuredColumnWidths$, columnWidthOverrides$, viewportWidth$),
  (currentWidths, [columns, baseWidths, measuredWidths, overrides, viewportWidth]) => {
    if (![...columns.keys()].every((key) => baseWidths.has(key))) {
      return new Map([...currentWidths].filter(([key]) => columns.has(key)))
    }

    if (overrides.size === 0) {
      return computeAutoFillColumnWidths([...columns.entries()], baseWidths, viewportWidth)
    }

    if (
      !hasCompleteWidths(columns, currentWidths) ||
      (nonOverriddenWidthsUseBaseWidths(columns, currentWidths, baseWidths, overrides) &&
        [...columns.keys()].reduce((sum, key) => sum + (currentWidths.get(key) ?? 0), 0) < viewportWidth)
    ) {
      return computeInitialColumnWidthsWithOverrides(columns, baseWidths, measuredWidths, overrides, viewportWidth)
    }

    const realizedWidths = new Map<string, number>()
    for (const key of columns.keys()) {
      realizedWidths.set(key, overrides.get(key) ?? currentWidths.get(key) ?? baseWidths.get(key) ?? 0)
    }
    return realizedWidths
  }
)

e.link(
  e.pipe(
    e.combine(visibleColumns$, columnWidths$),
    e.filter(([columns, widths]) => {
      return columns.size > 0 && [...columns.keys()].every((key) => (widths.get(key) ?? 0) > 0)
    }),
    e.map(([columns, widths]) => {
      const ranges: SizeRange[] = []
      let index = 0
      for (const key of columns.keys()) {
        ranges.push({ startIndex: index, endIndex: index, size: widths.get(key) ?? 0 })
        index += 1
      }
      return ranges
    })
  ),
  columnRanges$
)

e.link(
  e.pipe(
    visibleColumns$,
    e.map((columns) => columns.size)
  ),
  columnCount$
)

function sanitizeCssPropertyName(name: string): string {
  return name.replaceAll(/[^a-zA-Z0-9-_]/g, '-')
}

function columnKeyToCssVarName(key: string): string {
  return `--column-${sanitizeCssPropertyName(key)}-width`
}

export const columnWidthsCssVars$ = Cell<Record<string, string>>({})

e.link(
  e.pipe(
    columnWidths$,
    e.map((widths) => {
      return Object.fromEntries([...widths].map(([key, value]) => [columnKeyToCssVarName(key), `${value}px`]))
    })
  ),
  columnWidthsCssVars$
)
