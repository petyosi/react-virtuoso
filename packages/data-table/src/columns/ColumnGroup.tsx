import { createContext, useContext, useId, useLayoutEffect } from 'react'

// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

export interface ColumnGroupInfo {
  id: string
  parentGroupId?: string
  depth: number
  sticky?: 'left' | 'right'
  childColumnIds: string[]
  childGroupIds: string[]
}

export const columnGroups$ = Cell<Map<string, ColumnGroupInfo>>(new Map())

type ColumnGroupRegisterPayload =
  | {
      id: string
      type: 'add'
      info: ColumnGroupInfo
    }
  | {
      id: string
      type: 'remove'
    }

const columnGroupRegister$ = Stream<ColumnGroupRegisterPayload>()

e.changeWith(columnGroups$, columnGroupRegister$, (groups, payload) => {
  if (payload.type === 'add') {
    return new Map([...groups, [payload.id, payload.info]])
  }
  return new Map([...groups].filter(([id]) => id !== payload.id))
})

export const ColumnGroupIdContext = createContext<string>('')
const ColumnGroupDepthContext = createContext<number>(0)

export function useColumnGroupId() {
  return useContext(ColumnGroupIdContext)
}

export namespace ColumnGroup {
  export interface Props {
    children?: React.ReactNode
    sticky?: 'left' | 'right'
  }
}

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
    register({ type: 'add', id: groupId, info })
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
