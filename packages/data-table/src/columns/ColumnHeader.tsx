import { useLayoutEffect, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useResizeObserver } from '../resize/resize-observer-singleton'
import { useColumnId } from './Column'
import { createRegistryCell } from './registry'

import type { ColumnInfo } from './Column'
import type { ColumnState } from './column-state'

export interface ColumnHeaderRenderParams {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  overlaidByScrollbar: boolean
}

export type ColumnHeaderRenderFunction = (params: ColumnHeaderRenderParams) => ReactNode
export type ColumnHeaderCustomComponent = React.ComponentType<ColumnHeaderRenderParams>

interface ColumnHeaderEntry {
  type: 'function' | 'component'
  renderer: ColumnHeaderRenderFunction | ColumnHeaderCustomComponent
}

const { cell$: columnHeaders$, register$: columnHeaderRegister$ } = createRegistryCell<ColumnHeaderEntry>()
export { columnHeaders$ }

export namespace ColumnHeader {
  export type Props =
    | {
        children: ColumnHeaderRenderFunction
      }
    | {
        component: ColumnHeaderCustomComponent
      }
}

export function ColumnHeader(props: ColumnHeader.Props) {
  const colId = useColumnId()
  const columnHeaderRegister = usePublisher(columnHeaderRegister$)

  const renderer = 'children' in props ? props.children : props.component
  const rendererType = 'children' in props ? 'function' : 'component'

  useLayoutEffect(() => {
    columnHeaderRegister({ type: 'add', id: colId, value: { type: rendererType, renderer } })
    return () => {
      columnHeaderRegister({ type: 'remove', id: colId })
    }
  }, [columnHeaderRegister, rendererType, colId, renderer])

  return null
}

const DEFAULT_COLUMN_HEADER_STYLE: CSSProperties = {
  flexGrow: 1,
  minWidth: 1,
}

export interface ColumnHeaderRendererProps {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  renderer: ColumnHeaderCustomComponent | ColumnHeaderRenderFunction | undefined
  rendererType: 'component' | 'function' | undefined
  overlaidByScrollbar: boolean
}

export function ColumnHeaderRenderer({
  columnKey,
  column,
  columnState,
  renderer,
  rendererType,
  overlaidByScrollbar,
}: ColumnHeaderRendererProps) {
  const ref = useResizeObserver('border-box')
  const content = useMemo(() => {
    if (!renderer) {
      return column.field
    }

    if (rendererType === 'component') {
      const Comp = renderer
      return <Comp columnKey={columnKey} column={column} columnState={columnState} overlaidByScrollbar={overlaidByScrollbar} />
    }

    return (renderer as ColumnHeaderRenderFunction)({ columnKey, column, columnState, overlaidByScrollbar })
  }, [columnKey, column, columnState, overlaidByScrollbar, renderer, rendererType])

  return (
    <div ref={ref} data-column-key={columnKey} data-observer-group="column-header" style={DEFAULT_COLUMN_HEADER_STYLE}>
      {content}
    </div>
  )
}
