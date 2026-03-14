import { createContext, useContext, useId, useLayoutEffect } from 'react'

// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'
import invariant from 'tiny-invariant'

import { columnCount$, columnRanges$ } from './column-sizes'
import { ColumnGroupIdContext } from './ColumnGroup'

import type { SizeRange } from '../interfaces'

const ColumnIdContext = createContext<string>('')

export interface ColumnInfo {
  field: string
  sticky?: 'left' | 'right'
  groupId?: string
}

export const columns$ = Cell<Map<string, ColumnInfo>>(new Map())

type ColumnRegisterPayload =
  | {
      id: string
      type: 'add'
      info: ColumnInfo
    }
  | {
      id: string
      type: 'remove'
    }

const columnRegister$ = Stream<ColumnRegisterPayload>()

e.changeWith(columns$, columnRegister$, (columns, payload) => {
  if (payload.type === 'add') {
    return new Map([...columns, [payload.id, payload.info]])
  }
  return new Map([...columns].filter(([id]) => id !== payload.id))
})

export interface SetColumnStickyPayload {
  key: string
  sticky: 'left' | 'right' | undefined
}

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

  return new Map([...columns, [key, updated]])
})

export interface ReorderColumnsPayload {
  sourceKey: string
  targetKey: string
  position: 'before' | 'after'
}

export const reorderColumns$ = Stream<ReorderColumnsPayload>()

e.changeWith(columns$, reorderColumns$, (columns, { sourceKey, targetKey, position }) => {
  if (sourceKey === targetKey) {
    return columns
  }
  const sourceEntry = columns.get(sourceKey)
  if (!sourceEntry) {
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
  export interface Props extends ColumnInfo {
    children?: React.ReactNode
    sticky?: 'left' | 'right'
  }
}

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
    columnRegister({ type: 'add', id: colId, info })
    return () => {
      columnRegister({ type: 'remove', id: colId })
    }
  }, [columnRegister, colId, field, sticky, groupId])
  return <ColumnIdContext.Provider value={colId}>{children}</ColumnIdContext.Provider>
}

export const columnEntries$ = Stream<ResizeObserverEntry[]>()

export const columnWidths$ = Cell<Map<string, number>>(new Map())

e.changeWith(columnWidths$, columnEntries$, (widths, entries) => {
  return new Map([
    ...widths,
    ...entries.map((entry) => {
      invariant(entry.target instanceof HTMLDivElement, 'Expected HTMLDivElement')
      return [entry.target.dataset.columnKey ?? '', entry.borderBoxSize[0]!.inlineSize] as [string, number]
    }),
  ])
})

e.link(
  e.pipe(
    columnEntries$,
    e.withLatestFrom(columns$),
    e.map(([entries, columns]) => {
      const keys = [...columns.keys()]
      const ranges: SizeRange[] = []
      for (const entry of entries) {
        invariant(entry.target instanceof HTMLDivElement, 'Expected HTMLDivElement')
        const index = keys.indexOf(entry.target.dataset.columnKey ?? '')
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
