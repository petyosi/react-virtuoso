import { useLayoutEffect, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'

// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useResizeObserver } from '../resize/resize-observer-singleton'
import { useColumnId } from './Column'

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

export const columnHeaders$ = Cell<
  Map<
    string,
    {
      type: 'function' | 'component'
      renderer: ColumnHeaderRenderFunction | ColumnHeaderCustomComponent
    }
  >
>(new Map())

type ColumnHeaderRegisterPayload =
  | {
      id: string
      type: 'add'
      renderer: ColumnHeaderRenderFunction | ColumnHeaderCustomComponent
      rendererType: 'function' | 'component'
    }
  | { type: 'remove'; id: string }

const columnHeaderRegister$ = Stream<ColumnHeaderRegisterPayload>()

e.changeWith(columnHeaders$, columnHeaderRegister$, (headers, payload) => {
  if (payload.type === 'add') {
    return new Map([...headers, [payload.id, { type: payload.rendererType, renderer: payload.renderer }]])
  }
  return new Map([...headers].filter(([id]) => id !== payload.id))
})

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
    columnHeaderRegister({ type: 'add', id: colId, renderer, rendererType })
    return () => {
      columnHeaderRegister({ type: 'remove', id: colId })
    }
  }, [columnHeaderRegister, rendererType, colId, renderer])

  return null
}

const DEFAULT_COLUMN_HEADER_STYLE: CSSProperties = {
  flexGrow: 1,
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
