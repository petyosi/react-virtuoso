import { useMemo } from 'react'
import type { CSSProperties } from 'react'

import { EMPTY_COLUMN_STATE } from './column-state'
import { ColumnHeaderRenderer } from './ColumnHeader'

import type { ColumnInfo } from './Column'
import type { ColumnState } from './column-state'
import type { ColumnGroupInfo } from './ColumnGroup'
import type { ColumnGroupHeaderCustomComponent, ColumnGroupHeaderRenderFunction } from './ColumnGroupHeader'
import type { ColumnHeaderCustomComponent, ColumnHeaderRenderFunction } from './ColumnHeader'

export const HEADER_GROUP_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
}

export const HEADER_GROUP_CHILDREN_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
}

export interface GroupedHeaderNode {
  type: 'column'
  key: string
  column: ColumnInfo
}

export interface GroupedHeaderGroupNode {
  type: 'group'
  groupId: string
  group: ColumnGroupInfo
  children: (GroupedHeaderNode | GroupedHeaderGroupNode)[]
}

export type HeaderNode = GroupedHeaderNode | GroupedHeaderGroupNode

export function getEffectiveSticky(col: ColumnInfo, groups: Map<string, ColumnGroupInfo>): 'left' | 'right' | undefined {
  if (col.sticky) {
    return col.sticky
  }
  if (!col.groupId) {
    return undefined
  }

  let currentGroupId: string | undefined = col.groupId
  while (currentGroupId) {
    const group = groups.get(currentGroupId)
    if (group?.sticky) {
      return group.sticky
    }
    currentGroupId = group?.parentGroupId
  }
  return undefined
}

export function buildHeaderTree(
  columns: Map<string, ColumnInfo>,
  groups: Map<string, ColumnGroupInfo>,
  filterFn: (key: string, col: ColumnInfo) => boolean
): HeaderNode[] {
  const result: HeaderNode[] = []
  const groupNodeMap = new Map<string, GroupedHeaderGroupNode>()

  for (const [key, column] of columns) {
    if (!filterFn(key, column)) {
      continue
    }

    const node: GroupedHeaderNode = { type: 'column', key, column }

    if (column.groupId && groups.has(column.groupId)) {
      const groupChain: string[] = []
      let currentGroupId: string | undefined = column.groupId
      while (currentGroupId && groups.has(currentGroupId)) {
        groupChain.unshift(currentGroupId)
        currentGroupId = groups.get(currentGroupId)!.parentGroupId
      }

      for (let i = 0; i < groupChain.length; i++) {
        const gId = groupChain[i]!
        if (groupNodeMap.has(gId)) {
          continue
        }

        const group = groups.get(gId)!
        const groupNode: GroupedHeaderGroupNode = { type: 'group', groupId: gId, group, children: [] }
        groupNodeMap.set(gId, groupNode)

        if (i === 0) {
          result.push(groupNode)
        } else {
          groupNodeMap.get(groupChain[i - 1]!)!.children.push(groupNode)
        }
      }

      groupNodeMap.get(column.groupId)!.children.push(node)
    } else {
      result.push(node)
    }
  }

  return result
}

export function groupsWithDescendantColumns(columns: Map<string, ColumnInfo>, groups: Map<string, ColumnGroupInfo>) {
  const groupIds = new Set<string>()

  for (const [, column] of columns) {
    let currentGroupId = column.groupId
    const visited = new Set<string>()

    while (currentGroupId && !visited.has(currentGroupId)) {
      visited.add(currentGroupId)
      if (!groups.has(currentGroupId)) {
        break
      }

      groupIds.add(currentGroupId)
      currentGroupId = groups.get(currentGroupId)?.parentGroupId
    }
  }

  return groupIds
}

export function getDescendantColumnKeys(node: HeaderNode): string[] {
  if (node.type === 'column') {
    return [node.key]
  }
  return node.children.flatMap(getDescendantColumnKeys)
}

export interface GroupHeaderRendererProps {
  groupId: string
  group: ColumnGroupInfo
  columnKeys: string[]
  totalWidth: number
  renderer: ColumnGroupHeaderRenderFunction | ColumnGroupHeaderCustomComponent | undefined
  rendererType: 'function' | 'component' | undefined
}

export function GroupHeaderRenderer({ groupId, group, columnKeys, totalWidth, renderer, rendererType }: GroupHeaderRendererProps) {
  const content = useMemo(() => {
    if (!renderer) {
      return null
    }

    if (rendererType === 'component') {
      const Comp = renderer
      return <Comp groupId={groupId} group={group} columnKeys={columnKeys} totalWidth={totalWidth} />
    }

    return (renderer as ColumnGroupHeaderRenderFunction)({ groupId, group, columnKeys, totalWidth })
  }, [groupId, group, columnKeys, totalWidth, renderer, rendererType])

  if (!content) {
    return null
  }

  return (
    <div role="columnheader" aria-colspan={columnKeys.length} data-scope="colgroup">
      {content}
    </div>
  )
}

export interface HeaderNodeRendererProps {
  node: HeaderNode
  columns: Map<string, ColumnInfo>
  columnHeaders: Map<
    string,
    {
      type: 'function' | 'component'
      renderer: ColumnHeaderRenderFunction | ColumnHeaderCustomComponent
    }
  >
  columnGroupHeaders: Map<
    string,
    {
      type: 'function' | 'component'
      renderer: ColumnGroupHeaderRenderFunction | ColumnGroupHeaderCustomComponent
    }
  >
  columnsState: Map<string, ColumnState>
  columnWidths: Map<string, number>
  overlaidByScrollbar: boolean
}

export function HeaderNodeRenderer({
  node,
  columns,
  columnHeaders,
  columnGroupHeaders,
  columnsState,
  columnWidths,
  overlaidByScrollbar,
}: HeaderNodeRendererProps) {
  if (node.type === 'column') {
    const header = columnHeaders.get(node.key)
    return (
      <ColumnHeaderRenderer
        renderer={header?.renderer}
        rendererType={header?.type}
        columnKey={node.key}
        column={node.column}
        columnState={columnsState.get(node.key) ?? EMPTY_COLUMN_STATE}
        overlaidByScrollbar={overlaidByScrollbar}
      />
    )
  }

  const descendantKeys = getDescendantColumnKeys(node)
  const totalWidth = descendantKeys.reduce((sum, key) => sum + (columnWidths.get(key) ?? 0), 0)
  const groupHeader = columnGroupHeaders.get(node.groupId)

  return (
    <div style={HEADER_GROUP_STYLE} data-column-group={node.groupId}>
      <GroupHeaderRenderer
        groupId={node.groupId}
        group={node.group}
        columnKeys={descendantKeys}
        totalWidth={totalWidth}
        renderer={groupHeader?.renderer}
        rendererType={groupHeader?.type}
      />
      <div style={HEADER_GROUP_CHILDREN_STYLE}>
        {node.children.map((child, idx) => (
          <HeaderNodeRenderer
            key={child.type === 'column' ? child.key : child.groupId}
            node={child}
            columns={columns}
            columnHeaders={columnHeaders}
            columnGroupHeaders={columnGroupHeaders}
            columnsState={columnsState}
            columnWidths={columnWidths}
            overlaidByScrollbar={overlaidByScrollbar && idx === node.children.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
