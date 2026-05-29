import React, { useEffect, useState } from 'react'

import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

import type { RowComponentProps } from '../../../interfaces'

const HEADER_HEIGHT = 40
const INITIAL_ROW_HEIGHT = 1
const ROW_HEIGHT = 37
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150
const ITEM_COUNT = 160
const PRE_TABLE_HEIGHT = 560

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const rowSelector = '[data-testid=virtuoso-table-row]'
const scrollParentSelector = '[data-testid=custom-scroll-parent]'

const RowComponent = React.forwardRef<HTMLDivElement, RowComponentProps & { context?: unknown }>(function RowComponent(
  { context: _context, ...props },
  ref
) {
  return <div ref={ref} {...props} />
})

describe('customScrollParent offscreen initial height', () => {
  test('updates the scroll height when an offscreen probe row gains its final layout height before entering the viewport', async () => {
    function TestComponent() {
      const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null)
      const [rowHeight, setRowHeight] = useState(INITIAL_ROW_HEIGHT)

      useEffect(() => {
        const timeout = setTimeout(() => {
          setRowHeight(ROW_HEIGHT)
        }, 20)
        return () => {
          clearTimeout(timeout)
        }
      }, [])

      return (
        <div
          data-testid="custom-scroll-parent"
          data-row-height={rowHeight}
          ref={setScrollParent}
          style={{
            height: CONTAINER_HEIGHT,
            overflow: 'auto',
            width: CONTAINER_WIDTH,
          }}
        >
          <div style={{ height: PRE_TABLE_HEIGHT }}>Workspace toolbar</div>
          <VirtuosoDataTable
            components={{ Row: RowComponent }}
            customScrollParent={scrollParent}
            source={ITEMS}
            style={{ width: CONTAINER_WIDTH }}
          >
            <Column field="name">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: rowHeight }}>{String(cellValue)}</div>}</Cell>
            </Column>
          </VirtuosoDataTable>
        </div>
      )
    }

    const screen = await render(<TestComponent />)
    const scrollParent = screen.container.querySelector(scrollParentSelector) as HTMLElement

    await expect.poll(() => scrollParent.dataset.rowHeight).toBe(String(ROW_HEIGHT))
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve()
        })
      })
    })
    const offscreenScrollHeight = scrollParent.scrollHeight

    scrollParent.scrollTop = PRE_TABLE_HEIGHT
    scrollParent.dispatchEvent(new Event('scroll', { bubbles: true }))

    await expect.poll(() => screen.container.querySelectorAll(rowSelector).length).toBeGreaterThan(0)

    const visibleScrollHeight = scrollParent.scrollHeight
    expect(offscreenScrollHeight).toBeGreaterThanOrEqual(visibleScrollHeight - ROW_HEIGHT)
  })
})
