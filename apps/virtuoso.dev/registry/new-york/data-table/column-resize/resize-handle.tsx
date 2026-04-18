'use client'

import type { CSSProperties } from 'react'

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
  transform: 'translateX(50%)',
  zIndex: 1,
}
const HANDLE_LINE_STYLE: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: 2,
  height: 16,
  borderRadius: 9999,
  transform: 'translate(-50%, -50%)',
}

export const ResizeHandle: HeaderSlotCustomComponent = ({ columnKey, headerRef }) => {
  const resizeColumn = usePublisher(resizeColumn$)
  const clearColumnWidthOverride = usePublisher(clearColumnWidthOverride$)

  return (
    <div
      data-table-element-role="resize-handle"
      className="flex cursor-col-resize touch-none items-stretch"
      style={HANDLE_STYLE}
      onDoubleClick={(event) => {
        event.preventDefault()
        clearColumnWidthOverride({ key: columnKey })
      }}
      onPointerDown={(event) => {
        event.preventDefault()
        const startWidth = headerRef.current?.getBoundingClientRect().width
        if (startWidth === undefined) {
          return
        }

        const startX = event.clientX

        const handlePointerMove = (moveEvent: PointerEvent) => {
          resizeColumn({
            key: columnKey,
            width: Math.max(MIN_WIDTH, startWidth + moveEvent.clientX - startX),
          })
        }

        const handlePointerUp = () => {
          document.removeEventListener('pointermove', handlePointerMove)
          document.removeEventListener('pointerup', handlePointerUp)
        }

        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp, { once: true })
      }}
    >
      <div className="bg-border" style={HANDLE_LINE_STYLE} />
    </div>
  )
}
