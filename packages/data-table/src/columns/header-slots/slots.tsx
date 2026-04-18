import { useId, useLayoutEffect } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useColumnId } from '../Column'
import { headerSlotEdgeRegister$, headerSlotEndRegister$, headerSlotOverlayRegister$, headerSlotStartRegister$ } from './registry'

import type { HeaderSlotCustomComponent, HeaderSlotRenderFunction } from './registry'

type HeaderSlotRegister = typeof headerSlotStartRegister$

type HeaderSlotProps =
  | ({
      children: HeaderSlotRenderFunction
      component?: never
    } & Record<string, unknown>)
  | ({
      component: HeaderSlotCustomComponent
      children?: never
    } & Record<string, unknown>)

function createHeaderSlot(register$: HeaderSlotRegister) {
  return function HeaderSlot(props: HeaderSlotProps) {
    const columnId = useColumnId()
    const slotId = useId()
    const register = usePublisher(register$)
    const renderer = 'component' in props ? props.component : props.children
    const type = 'component' in props ? 'component' : 'function'
    const { children: _children, component: _component, ...extraProps } = props

    useLayoutEffect(() => {
      register({
        type: 'add',
        id: slotId,
        value: {
          columnId,
          type,
          renderer,
          ...(Object.keys(extraProps).length > 0 ? { extraProps } : {}),
        },
      })
      return () => {
        register({ type: 'remove', id: slotId })
      }
    }, [columnId, extraProps, register, renderer, slotId, type])

    return null
  }
}

export const HeaderStart = createHeaderSlot(headerSlotStartRegister$)
export const HeaderEnd = createHeaderSlot(headerSlotEndRegister$)
export const HeaderEdge = createHeaderSlot(headerSlotEdgeRegister$)
export const HeaderOverlay = createHeaderSlot(headerSlotOverlayRegister$)
