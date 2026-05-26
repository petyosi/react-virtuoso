import { useLayoutEffect } from 'react'
import type { ReactNode } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useColumnGroupId } from './ColumnGroup'
import { createRegistryCell } from './registry'

import type { ColumnGroupInfo } from './ColumnGroup'

/**
 * The parameters passed to a column group header renderer.
 *
 * @group Components
 */
export interface ColumnGroupHeaderRenderParams {
  groupId: string
  group: ColumnGroupInfo
  columnKeys: string[]
  totalWidth: number
}

/**
 * The render function used by a column group header.
 *
 * @group Components
 */
export type ColumnGroupHeaderRenderFunction = (params: ColumnGroupHeaderRenderParams) => ReactNode
/**
 * A React component variant for a column group header.
 *
 * @group Components
 */
export type ColumnGroupHeaderCustomComponent = React.ComponentType<ColumnGroupHeaderRenderParams>

interface ColumnGroupHeaderEntry {
  type: 'function' | 'component'
  renderer: ColumnGroupHeaderRenderFunction | ColumnGroupHeaderCustomComponent
  className?: string
}

const { cell$: columnGroupHeaders$, register$: columnGroupHeaderRegister$ } = createRegistryCell<ColumnGroupHeaderEntry>()
export { columnGroupHeaders$ }

export namespace ColumnGroupHeader {
  /**
   * The properties accepted by the `ColumnGroupHeader` component.
   *
   * @group Components
   */
  export type Props =
    | {
        children: ColumnGroupHeaderRenderFunction
        className?: string
      }
    | {
        component: ColumnGroupHeaderCustomComponent
        className?: string
      }
}

export type ColumnGroupHeaderProps = ColumnGroupHeader.Props

/**
 * Declares the header renderer for the current column group.
 *
 * @group Components
 */
export function ColumnGroupHeader(props: ColumnGroupHeader.Props) {
  const groupId = useColumnGroupId()
  const columnGroupHeaderRegister = usePublisher(columnGroupHeaderRegister$)

  const renderer = 'children' in props ? props.children : props.component
  const rendererType = 'children' in props ? 'function' : 'component'
  const { className } = props

  useLayoutEffect(() => {
    columnGroupHeaderRegister({
      type: 'add',
      id: groupId,
      value: className === undefined ? { type: rendererType, renderer } : { type: rendererType, renderer, className },
    })
    return () => {
      columnGroupHeaderRegister({ type: 'remove', id: groupId })
    }
  }, [className, columnGroupHeaderRegister, rendererType, groupId, renderer])

  return null
}
