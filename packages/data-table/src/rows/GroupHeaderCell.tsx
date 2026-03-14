import { useId, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'

// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import type { Row } from '../interfaces'

export interface GroupHeaderRenderParams {
  row: Row<unknown>
  level: number
}

export type GroupHeaderRenderFunction = (params: GroupHeaderRenderParams) => ReactNode
export type GroupHeaderCustomComponent = React.ComponentType<GroupHeaderRenderParams>

export const groupHeaderRenderer$ = Cell<{
  type: 'function' | 'component'
  renderer: GroupHeaderRenderFunction | GroupHeaderCustomComponent
} | null>(null)

type GroupHeaderRendererRegisterPayload =
  | {
      id: string
      type: 'add'
      renderer: GroupHeaderRenderFunction | GroupHeaderCustomComponent
      rendererType: 'function' | 'component'
    }
  | { type: 'remove'; id: string }

const groupHeaderRendererRegister$ = Stream<GroupHeaderRendererRegisterPayload>()

e.changeWith(groupHeaderRenderer$, groupHeaderRendererRegister$, (_current, payload) => {
  if (payload.type === 'add') {
    return { type: payload.rendererType, renderer: payload.renderer }
  }
  return null
})

export namespace GroupHeaderCell {
  export type Props =
    | {
        children: GroupHeaderRenderFunction
      }
    | {
        component: GroupHeaderCustomComponent
      }
}

export function GroupHeaderCell(props: GroupHeaderCell.Props) {
  const register = usePublisher(groupHeaderRendererRegister$)
  const id = useId()

  const renderer = 'children' in props ? props.children : props.component
  const rendererType = 'children' in props ? 'function' : 'component'

  useLayoutEffect(() => {
    register({ type: 'add', id, renderer, rendererType })
    return () => {
      register({ type: 'remove', id })
    }
  }, [register, rendererType, id, renderer])

  return null
}
