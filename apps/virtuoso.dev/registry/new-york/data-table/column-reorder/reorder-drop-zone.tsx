'use client'

import { useEffect } from 'react'

import { useCellValue, usePublisher } from '@virtuoso.dev/data-table'
import {
  columnDragState$,
  endColumnDrag$,
  reorderColumnGroup$,
  reorderColumns$,
  setColumnDropTarget$,
} from '@virtuoso.dev/data-table/column-reorder'

import type { HeaderSlotCustomComponent } from '@virtuoso.dev/data-table'

export const ReorderDropZone: HeaderSlotCustomComponent = ({ columnKey, columnState, headerRef }) => {
  const dragState = useCellValue(columnDragState$)
  const endColumnDrag = usePublisher(endColumnDrag$)
  const setColumnDropTarget = usePublisher(setColumnDropTarget$)
  const reorderColumns = usePublisher(reorderColumns$)
  const reorderColumnGroup = usePublisher(reorderColumnGroup$)

  const isSourceForThisColumn = dragState.sourceKeys?.includes(columnKey) ?? false
  const isGroupDrag = (dragState.sourceKeys?.length ?? 0) > 1
  const dropPosition = dragState.dropTarget?.key === columnKey ? dragState.dropTarget.position : null

  useEffect(() => {
    const header = headerRef.current
    if (!header) {
      return
    }

    const handleDragOver = (event: DragEvent) => {
      if (!dragState.sourceKeys) {
        return
      }
      if (isSourceForThisColumn) {
        return
      }
      if (dragState.sourceSticky !== columnState.sticky) {
        return
      }

      event.preventDefault()
      event.dataTransfer!.dropEffect = 'move'
      const rect = header.getBoundingClientRect()
      const position = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
      if (dragState.dropTarget?.key === columnKey && dragState.dropTarget.position === position) {
        return
      }
      setColumnDropTarget({ key: columnKey, position })
    }

    const handleDragLeave = (event: DragEvent) => {
      const next = event.relatedTarget as Node | null
      if (next && header.contains(next)) {
        return
      }
      if (dragState.dropTarget?.key === columnKey) {
        setColumnDropTarget(null)
      }
    }

    const handleDrop = (event: DragEvent) => {
      event.preventDefault()
      if (!dragState.sourceKeys || isSourceForThisColumn) {
        setColumnDropTarget(null)
        return
      }

      const rect = header.getBoundingClientRect()
      const position = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
      setColumnDropTarget(null)
      if (isGroupDrag) {
        reorderColumnGroup({ sourceKeys: dragState.sourceKeys, targetKey: columnKey, position })
      } else {
        reorderColumns({ sourceKey: dragState.sourceKeys[0]!, targetKey: columnKey, position })
      }
      endColumnDrag()
    }

    header.addEventListener('dragover', handleDragOver)
    header.addEventListener('dragleave', handleDragLeave)
    header.addEventListener('drop', handleDrop)

    return () => {
      header.removeEventListener('dragover', handleDragOver)
      header.removeEventListener('dragleave', handleDragLeave)
      header.removeEventListener('drop', handleDrop)
    }
  }, [
    columnKey,
    columnState.sticky,
    dragState,
    endColumnDrag,
    headerRef,
    isGroupDrag,
    isSourceForThisColumn,
    reorderColumnGroup,
    reorderColumns,
    setColumnDropTarget,
  ])

  if (!dragState.sourceKeys || !dropPosition) {
    return null
  }

  return (
    <div
      className={
        dropPosition === 'before'
          ? 'pointer-events-none absolute top-1/2 left-0 z-[1] h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-primary'
          : 'pointer-events-none absolute top-1/2 right-0 z-[1] h-4 w-[2px] translate-x-1/2 -translate-y-1/2 bg-primary'
      }
    />
  )
}
