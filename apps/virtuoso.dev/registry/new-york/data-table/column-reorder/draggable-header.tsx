'use client'

import { useCellValue, usePublisher } from '@virtuoso.dev/data-table'
import {
  beginColumnDrag$,
  columnDragState$,
  endColumnDrag$,
  reorderColumnGroup$,
  reorderColumns$,
  setColumnDropTarget$,
} from '@virtuoso.dev/data-table/column-reorder'

import { cn } from '@/lib/utils'

import type { ColumnHeaderCustomComponent } from '@virtuoso.dev/data-table'

const DraggableHeader: ColumnHeaderCustomComponent = ({ columnKey, column, columnState }) => {
  const dragState = useCellValue(columnDragState$)
  const beginColumnDrag = usePublisher(beginColumnDrag$)
  const endColumnDrag = usePublisher(endColumnDrag$)
  const setColumnDropTarget = usePublisher(setColumnDropTarget$)
  const reorderColumns = usePublisher(reorderColumns$)
  const reorderColumnGroup = usePublisher(reorderColumnGroup$)

  const isSourceForThisColumn = dragState.sourceKeys?.includes(columnKey) ?? false
  const isGroupDrag = (dragState.sourceKeys?.length ?? 0) > 1
  const dropPosition = dragState.dropTarget?.key === columnKey ? dragState.dropTarget.position : null

  return (
    <div
      className={cn(
        'relative flex h-10 items-center px-3 text-sm font-medium text-foreground whitespace-nowrap',
        columnState.sticky && 'bg-background'
      )}
      onDragOver={(ev) => {
        if (!dragState.sourceKeys) {
          return
        }
        if (isSourceForThisColumn) {
          return
        }
        if (dragState.sourceSticky !== columnState.sticky) {
          return
        }
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'move'
        const rect = ev.currentTarget.getBoundingClientRect()
        const position = ev.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
        if (dragState.dropTarget?.key === columnKey && dragState.dropTarget.position === position) {
          return
        }
        setColumnDropTarget({ key: columnKey, position })
      }}
      onDragLeave={(ev) => {
        const next = ev.relatedTarget as Node | null
        if (next && ev.currentTarget.contains(next)) {
          return
        }
        if (dragState.dropTarget?.key === columnKey) {
          setColumnDropTarget(null)
        }
      }}
      onDrop={(ev) => {
        ev.preventDefault()
        if (!dragState.sourceKeys || isSourceForThisColumn) {
          setColumnDropTarget(null)
          return
        }
        const rect = ev.currentTarget.getBoundingClientRect()
        const position = ev.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
        if (isGroupDrag) {
          reorderColumnGroup({ sourceKeys: dragState.sourceKeys, targetKey: columnKey, position })
        } else {
          reorderColumns({ sourceKey: dragState.sourceKeys[0]!, targetKey: columnKey, position })
        }
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
          beginColumnDrag({ sourceKeys: [columnKey], sourceSticky: columnState.sticky })
          ev.dataTransfer.effectAllowed = 'move'
          ev.dataTransfer.setData('text/plain', columnKey)
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
      {column.field}
    </div>
  )
}

export { DraggableHeader }
