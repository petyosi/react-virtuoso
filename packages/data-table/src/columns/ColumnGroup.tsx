import { createContext, useContext, useId, useLayoutEffect } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { createRegistryCell } from './registry'

/**
 * Describes a registered column group.
 *
 * @group Components
 */
export interface ColumnGroupInfo {
  id: string
  parentGroupId?: string
  depth: number
  sticky?: 'left' | 'right'
  childColumnIds: string[]
  childGroupIds: string[]
}

const { cell$: columnGroups$, register$: columnGroupRegister$ } = createRegistryCell<ColumnGroupInfo>()
export { columnGroups$ }

export const ColumnGroupIdContext = createContext<string>('')
const ColumnGroupDepthContext = createContext<number>(0)

export function useColumnGroupId() {
  return useContext(ColumnGroupIdContext)
}

export namespace ColumnGroup {
  /**
   * The properties accepted by the `ColumnGroup` component.
   *
   * @group Components
   */
  export interface Props {
    children?: React.ReactNode
    sticky?: 'left' | 'right'
  }
}

/**
 * Groups related columns under a shared header.
 *
 * @group Components
 */
export function ColumnGroup({ children, sticky }: ColumnGroup.Props) {
  const groupId = useId()
  const parentGroupId = useContext(ColumnGroupIdContext) || undefined
  const parentDepth = useContext(ColumnGroupDepthContext)
  const depth = parentGroupId ? parentDepth + 1 : 0
  const register = usePublisher(columnGroupRegister$)

  const effectiveSticky = depth === 0 ? sticky : undefined

  useLayoutEffect(() => {
    const info: ColumnGroupInfo = {
      id: groupId,
      depth,
      childColumnIds: [],
      childGroupIds: [],
    }
    if (parentGroupId) {
      info.parentGroupId = parentGroupId
    }
    if (effectiveSticky) {
      info.sticky = effectiveSticky
    }
    register({ type: 'add', id: groupId, value: info })
    return () => {
      register({ type: 'remove', id: groupId })
    }
  }, [register, groupId, parentGroupId, depth, effectiveSticky])

  return (
    <ColumnGroupIdContext.Provider value={groupId}>
      <ColumnGroupDepthContext.Provider value={depth}>{children}</ColumnGroupDepthContext.Provider>
    </ColumnGroupIdContext.Provider>
  )
}
