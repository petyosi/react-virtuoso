'use client'

import { usePublisher } from '@virtuoso.dev/data-table'
import { beginColumnDrag$, endColumnDrag$ } from '@virtuoso.dev/data-table/column-reorder'

import type { HeaderSlotCustomComponent } from '@virtuoso.dev/data-table'

export const ReorderGrip: HeaderSlotCustomComponent = ({ columnKey, columnState, headerRef }) => {
  const beginColumnDrag = usePublisher(beginColumnDrag$)
  const endColumnDrag = usePublisher(endColumnDrag$)

  return (
    <span
      draggable
      onDragStart={(event) => {
        beginColumnDrag({ sourceKeys: [columnKey], sourceSticky: columnState.sticky })
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', columnKey)
        const header = headerRef.current
        if (!header) {
          return
        }

        const rect = header.getBoundingClientRect()
        event.dataTransfer.setDragImage(header, event.clientX - rect.left, event.clientY - rect.top)
      }}
      onDragEnd={() => {
        endColumnDrag()
      }}
      className="mr-2 cursor-grab text-sm opacity-50 select-none"
    >
      ⠿
    </span>
  )
}
