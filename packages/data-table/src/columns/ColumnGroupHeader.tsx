import { useLayoutEffect } from 'react'
import type { ReactNode } from 'react'

// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useColumnGroupId } from './ColumnGroup'

import type { ColumnGroupInfo } from './ColumnGroup'

export interface ColumnGroupHeaderRenderParams {
  groupId: string
  group: ColumnGroupInfo
  columnKeys: string[]
  totalWidth: number
}

export type ColumnGroupHeaderRenderFunction = (params: ColumnGroupHeaderRenderParams) => ReactNode
export type ColumnGroupHeaderCustomComponent = React.ComponentType<ColumnGroupHeaderRenderParams>

export const columnGroupHeaders$ = Cell<
  Map<
    string,
    {
      type: 'function' | 'component'
      renderer: ColumnGroupHeaderRenderFunction | ColumnGroupHeaderCustomComponent
    }
  >
>(new Map())

type ColumnGroupHeaderRegisterPayload =
  | {
      id: string
      type: 'add'
      renderer: ColumnGroupHeaderRenderFunction | ColumnGroupHeaderCustomComponent
      rendererType: 'function' | 'component'
    }
  | { type: 'remove'; id: string }

const columnGroupHeaderRegister$ = Stream<ColumnGroupHeaderRegisterPayload>()

e.changeWith(columnGroupHeaders$, columnGroupHeaderRegister$, (headers, payload) => {
  if (payload.type === 'add') {
    return new Map([...headers, [payload.id, { type: payload.rendererType, renderer: payload.renderer }]])
  }
  return new Map([...headers].filter(([id]) => id !== payload.id))
})

export namespace ColumnGroupHeader {
  export type Props =
    | {
        children: ColumnGroupHeaderRenderFunction
      }
    | {
        component: ColumnGroupHeaderCustomComponent
      }
}

export function ColumnGroupHeader(props: ColumnGroupHeader.Props) {
  const groupId = useColumnGroupId()
  const columnGroupHeaderRegister = usePublisher(columnGroupHeaderRegister$)

  const renderer = 'children' in props ? props.children : props.component
  const rendererType = 'children' in props ? 'function' : 'component'

  useLayoutEffect(() => {
    columnGroupHeaderRegister({ type: 'add', id: groupId, renderer, rendererType })
    return () => {
      columnGroupHeaderRegister({ type: 'remove', id: groupId })
    }
  }, [columnGroupHeaderRegister, rendererType, groupId, renderer])

  return null
}
