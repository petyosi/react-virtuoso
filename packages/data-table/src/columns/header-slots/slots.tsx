import { useId, useLayoutEffect, useRef } from 'react'

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

function shallowEqual(left: Record<string, unknown>, right: Record<string, unknown>) {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.is(left[key], right[key]))
}

function useShallowStableObject(value: Record<string, unknown>) {
  const ref = useRef(value)

  if (!shallowEqual(ref.current, value)) {
    ref.current = value
  }

  return ref.current
}

function createHeaderSlot(register$: HeaderSlotRegister) {
  return function HeaderSlot(props: HeaderSlotProps) {
    const columnId = useColumnId()
    const slotId = useId()
    const register = usePublisher(register$)
    const renderer = 'component' in props ? props.component : props.children
    const type = 'component' in props ? 'component' : 'function'
    const { children: _children, component: _component, ...extraProps } = props
    const stableExtraProps = useShallowStableObject(extraProps)

    useLayoutEffect(() => {
      register({
        type: 'add',
        id: slotId,
        value: {
          columnId,
          type,
          renderer,
          ...(Object.keys(stableExtraProps).length > 0 ? { extraProps: stableExtraProps } : {}),
        },
      })
      return () => {
        register({ type: 'remove', id: slotId })
      }
    }, [columnId, register, renderer, slotId, stableExtraProps, type])

    return null
  }
}

export const HeaderStart = createHeaderSlot(headerSlotStartRegister$)
export const HeaderEnd = createHeaderSlot(headerSlotEndRegister$)
export const HeaderEdge = createHeaderSlot(headerSlotEdgeRegister$)
export const HeaderOverlay = createHeaderSlot(headerSlotOverlayRegister$)
