'use client'

import { useCellValue, usePublisher } from '@virtuoso.dev/data-table'
import {
  beginColumnDrag$,
  columnDragState$,
  endColumnDrag$,
  reorderColumnGroup$,
  setColumnDropTarget$,
} from '@virtuoso.dev/data-table/column-reorder'

import { cn } from '@/lib/utils'

interface DraggableGroupHeaderProps {
  label: string
  columnKeys: string[]
  stickyGroup?: 'left' | 'right'
}

function DraggableGroupHeader({ label, columnKeys, stickyGroup }: DraggableGroupHeaderProps) {
  const dragState = useCellValue(columnDragState$)
  const beginColumnDrag = usePublisher(beginColumnDrag$)
  const endColumnDrag = usePublisher(endColumnDrag$)
  const setColumnDropTarget = usePublisher(setColumnDropTarget$)
  const reorderColumnGroup = usePublisher(reorderColumnGroup$)

  const isGroupDrag = (dragState.sourceKeys?.length ?? 0) > 1
  const isSelfDrag = isGroupDrag && dragState.sourceKeys?.[0] === columnKeys[0]
  const groupAnchorKey = dragState.dropTarget?.key
  const dropPosition =
    groupAnchorKey && (groupAnchorKey === columnKeys[0] || groupAnchorKey === columnKeys.at(-1)) ? dragState.dropTarget!.position : null

  return (
    <div
      className={cn(
        'relative flex items-center border-b border-border bg-muted px-2 py-1 text-xs font-semibold whitespace-nowrap',
        stickyGroup && 'bg-muted/80'
      )}
      onDragOver={(ev) => {
        if (!isGroupDrag) {
          return
        }
        if (isSelfDrag) {
          return
        }
        if (dragState.sourceSticky !== stickyGroup) {
          return
        }
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'move'
        const rect = ev.currentTarget.getBoundingClientRect()
        const position = ev.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
        const anchorKey = position === 'before' ? columnKeys[0]! : columnKeys.at(-1)!
        if (dragState.dropTarget?.key === anchorKey && dragState.dropTarget.position === position) {
          return
        }
        setColumnDropTarget({ key: anchorKey, position })
      }}
      onDragLeave={(ev) => {
        const next = ev.relatedTarget as Node | null
        if (next && ev.currentTarget.contains(next)) {
          return
        }
        setColumnDropTarget(null)
      }}
      onDrop={(ev) => {
        ev.preventDefault()
        if (!isGroupDrag || isSelfDrag || !dragState.sourceKeys) {
          setColumnDropTarget(null)
          return
        }
        const rect = ev.currentTarget.getBoundingClientRect()
        const position = ev.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
        const anchorKey = position === 'before' ? columnKeys[0]! : columnKeys.at(-1)!
        setColumnDropTarget(null)
        reorderColumnGroup({ sourceKeys: dragState.sourceKeys, targetKey: anchorKey, position })
        endColumnDrag()
      }}
    >
      {dropPosition === 'before' && (
        <div className="pointer-events-none absolute top-1/2 left-0 z-[1] h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-primary" />
      )}
      {dropPosition === 'after' && (
        <div className="pointer-events-none absolute top-1/2 right-0 z-[1] h-4 w-[2px] translate-x-1/2 -translate-y-1/2 bg-primary" />
      )}
      <span
        draggable
        onDragStart={(ev) => {
          beginColumnDrag({ sourceKeys: columnKeys, sourceSticky: stickyGroup })
          ev.dataTransfer.effectAllowed = 'move'
          ev.dataTransfer.setData('text/plain', 'group')
          const header = ev.currentTarget.parentElement!
          const rect = header.getBoundingClientRect()
          ev.dataTransfer.setDragImage(header, ev.clientX - rect.left, ev.clientY - rect.top)
        }}
        onDragEnd={() => {
          endColumnDrag()
        }}
        className="mr-2 cursor-grab text-sm opacity-50 select-none"
      >
        ⠿
      </span>
      {label}
    </div>
  )
}

export { DraggableGroupHeader }
export type { DraggableGroupHeaderProps }
