import { useLayoutEffect } from 'react'
import type { ReactNode } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useColumnGroupId } from './ColumnGroup'
import { createRegistryCell } from './registry'

import type { ColumnGroupInfo } from './ColumnGroup'

export interface ColumnGroupHeaderRenderParams {
  groupId: string
  group: ColumnGroupInfo
  columnKeys: string[]
  totalWidth: number
}

export type ColumnGroupHeaderRenderFunction = (params: ColumnGroupHeaderRenderParams) => ReactNode
export type ColumnGroupHeaderCustomComponent = React.ComponentType<ColumnGroupHeaderRenderParams>

interface ColumnGroupHeaderEntry {
  type: 'function' | 'component'
  renderer: ColumnGroupHeaderRenderFunction | ColumnGroupHeaderCustomComponent
}

const { cell$: columnGroupHeaders$, register$: columnGroupHeaderRegister$ } = createRegistryCell<ColumnGroupHeaderEntry>()
export { columnGroupHeaders$ }

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
    columnGroupHeaderRegister({ type: 'add', id: groupId, value: { type: rendererType, renderer } })
    return () => {
      columnGroupHeaderRegister({ type: 'remove', id: groupId })
    }
  }, [columnGroupHeaderRegister, rendererType, groupId, renderer])

  return null
}
