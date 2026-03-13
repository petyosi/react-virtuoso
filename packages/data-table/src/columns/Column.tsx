import { createContext, useContext, useId, useLayoutEffect } from 'react'

// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { columnCount$, columnRanges$ } from './column-sizes'
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
}

const { cell$: columns$, register$: columnRegister$ } = createRegistryCell<ColumnInfo>()
export { columns$ }

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

e.changeWith(columns$, reorderColumns$, (columns, { sourceKey, targetKey, position }) => {
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
  }
}

/**
 * Declares a visible column in the table.
 *
 * @group Components
 */
export function Column({ children, field, sticky }: Column.Props) {
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
    columnRegister({ type: 'add', id: colId, value: info })
    return () => {
      columnRegister({ type: 'remove', id: colId })
    }
  }, [columnRegister, colId, field, sticky, groupId])
  return <ColumnIdContext.Provider value={colId}>{children}</ColumnIdContext.Provider>
}

export const columnEntries$ = Stream<ResizeObserverEntry[]>()

export const columnWidths$ = Cell<Map<string, number>>(new Map())

e.changeWith(columnWidths$, columnEntries$, (widths, entries) => {
  const next = new Map(widths)
  for (const entry of entries) {
    const target = entry.target as HTMLElement
    next.set(target.dataset.columnKey ?? '', entry.borderBoxSize[0]!.inlineSize)
  }
  return next
})

e.link(
  e.pipe(
    columnEntries$,
    e.withLatestFrom(columns$),
    e.map(([entries, columns]) => {
      const keys = [...columns.keys()]
      const ranges: SizeRange[] = []
      for (const entry of entries) {
        const target = entry.target as HTMLElement
        const index = keys.indexOf(target.dataset.columnKey ?? '')
        ranges.push({ startIndex: index, endIndex: index, size: entry.borderBoxSize[0]!.inlineSize })
      }
      return ranges
    })
  ),
  columnRanges$
)

e.link(
  e.pipe(
    columns$,
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
