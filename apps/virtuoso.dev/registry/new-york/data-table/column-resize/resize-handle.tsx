'use client'

import { usePublisher } from '@virtuoso.dev/data-table'
import { resizeColumn$ } from '@virtuoso.dev/data-table/column-resize'

import type { HeaderSlotCustomComponent } from '@virtuoso.dev/data-table'

const MIN_WIDTH = 50

export const ResizeHandle: HeaderSlotCustomComponent = ({ columnKey, headerRef }) => {
  const resizeColumn = usePublisher(resizeColumn$)

  return (
    <div
      data-table-element-role="resize-handle"
      className="flex w-3 cursor-col-resize touch-none items-stretch justify-end"
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
      <div className="h-full w-px bg-border" />
    </div>
  )
}
