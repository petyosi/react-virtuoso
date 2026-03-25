import { useId, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'

// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import type { Row } from '../interfaces'

/**
 * The parameters passed to a group header renderer.
 *
 * @group Components
 */
export interface GroupHeaderRenderParams {
  row: Row<unknown>
  level: number
}

/**
 * The render function used by a group header row.
 *
 * @group Components
 */
export type GroupHeaderRenderFunction = (params: GroupHeaderRenderParams) => ReactNode
/**
 * A React component variant for a group header row.
 *
 * @group Components
 */
export type GroupHeaderCustomComponent = React.ComponentType<GroupHeaderRenderParams>

export const groupHeaderRenderer$ = Cell<{
  type: 'function' | 'component'
  renderer: GroupHeaderRenderFunction | GroupHeaderCustomComponent
  className?: string
} | null>(null)

type GroupHeaderRendererRegisterPayload =
  | {
      id: string
      type: 'add'
      renderer: GroupHeaderRenderFunction | GroupHeaderCustomComponent
      rendererType: 'function' | 'component'
      className: string | undefined
    }
  | { type: 'remove'; id: string }

const groupHeaderRendererRegister$ = Stream<GroupHeaderRendererRegisterPayload>()

e.changeWith(groupHeaderRenderer$, groupHeaderRendererRegister$, (_current, payload) => {
  if (payload.type === 'add') {
    return payload.className === undefined
      ? { type: payload.rendererType, renderer: payload.renderer }
      : { type: payload.rendererType, renderer: payload.renderer, className: payload.className }
  }
  return null
})

export namespace GroupHeaderCell {
  /**
   * The properties accepted by the `GroupHeaderCell` component.
   *
   * @group Components
   */
  export type Props =
    | {
        children: GroupHeaderRenderFunction
        className?: string
      }
    | {
        component: GroupHeaderCustomComponent
        className?: string
      }
}

export type GroupHeaderCellProps = GroupHeaderCell.Props

/**
 * Declares the renderer used for group header rows.
 *
 * @group Components
 */
export function GroupHeaderCell(props: GroupHeaderCell.Props) {
  const register = usePublisher(groupHeaderRendererRegister$)
  const id = useId()

  const renderer = 'children' in props ? props.children : props.component
  const rendererType = 'children' in props ? 'function' : 'component'
  const { className } = props

  useLayoutEffect(() => {
    register({ type: 'add', id, renderer, rendererType, className })
    return () => {
      register({ type: 'remove', id })
    }
  }, [className, register, rendererType, id, renderer])

  return null
}
