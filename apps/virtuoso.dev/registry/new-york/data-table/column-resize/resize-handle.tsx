'use client'

import { useState, type CSSProperties } from 'react'

import { usePublisher } from '@virtuoso.dev/data-table'
import { clearColumnWidthOverride$, resizeColumn$ } from '@virtuoso.dev/data-table/column-resize'

import type { HeaderSlotCustomComponent } from '@virtuoso.dev/data-table'

const MIN_WIDTH = 50
const HANDLE_HIT_AREA = 10
const HANDLE_STYLE: CSSProperties = {
  position: 'relative',
  display: 'flex',
  width: HANDLE_HIT_AREA,
  minWidth: HANDLE_HIT_AREA,
  alignSelf: 'stretch',
  justifyContent: 'center',
  cursor: 'col-resize',
  touchAction: 'none',
  userSelect: 'none',
  zIndex: 1,
}
const HANDLE_LINE_STYLE: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: '50%',
  borderRadius: 9999,
  transform: 'translateY(-50%)',
}

export const ResizeHandle: HeaderSlotCustomComponent = ({ columnKey, headerRef }) => {
  const resizeColumn = usePublisher(resizeColumn$)
  const clearColumnWidthOverride = usePublisher(clearColumnWidthOverride$)
  const [isResizing, setIsResizing] = useState(false)

  return (
    <div
      data-table-element-role="resize-handle"
      data-resizing={isResizing ? 'true' : undefined}
      className="group flex cursor-col-resize touch-none items-stretch"
      style={HANDLE_STYLE}
      onDoubleClick={(event) => {
        event.preventDefault()
        clearColumnWidthOverride({ key: columnKey })
      }}
      onPointerDown={(event) => {
        event.preventDefault()
        const handle = event.currentTarget
        const ownerDocument = handle.ownerDocument
        const startWidth = headerRef.current?.getBoundingClientRect().width
        if (startWidth === undefined) {
          return
        }

        const startX = event.clientX
        const pointerId = event.pointerId
        handle.setPointerCapture(pointerId)
        setIsResizing(true)

        const handlePointerMove = (moveEvent: PointerEvent) => {
          resizeColumn({
            key: columnKey,
            width: Math.max(MIN_WIDTH, startWidth + moveEvent.clientX - startX),
          })
        }

        const handlePointerEnd = () => {
          if (handle.hasPointerCapture(pointerId)) {
            handle.releasePointerCapture(pointerId)
          }
          setIsResizing(false)
          ownerDocument.removeEventListener('pointermove', handlePointerMove)
          ownerDocument.removeEventListener('pointerup', handlePointerEnd)
          ownerDocument.removeEventListener('pointercancel', handlePointerEnd)
        }

        ownerDocument.addEventListener('pointermove', handlePointerMove)
        ownerDocument.addEventListener('pointerup', handlePointerEnd, { once: true })
        ownerDocument.addEventListener('pointercancel', handlePointerEnd, { once: true })
      }}
    >
      <div
        data-resizing={isResizing ? 'true' : undefined}
        className="pointer-events-none absolute h-4 w-0.5 rounded-full bg-border opacity-80 transition-[height,width,background-color,opacity] duration-150 ease-out group-hover:h-5 group-hover:bg-foreground/30 group-hover:opacity-100 data-[resizing=true]:h-6 data-[resizing=true]:w-[3px] data-[resizing=true]:bg-primary data-[resizing=true]:opacity-100"
        style={HANDLE_LINE_STYLE}
      />
    </div>
  )
}
