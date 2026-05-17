import { useState } from 'react'

import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

import type { ListScrollLocation } from '../../../interfaces'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const TABLE_HEIGHT = 1000
const COLUMN_WIDTH = 150
const SCROLL_TOP = 260
const TOOLBAR_HEIGHT = 40

const ITEMS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const scrollParentSelector = '[data-testid=custom-scroll-parent]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('customScrollParent offset', () => {
  test('normalizes scrollTop relative to the custom scroll parent instead of the page', async () => {
    const onScroll = vi.fn<(location: ListScrollLocation) => void>()

    function TestComponent() {
      const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null)

      return (
        <div style={{ paddingTop: 80 }}>
          <div
            data-testid="custom-scroll-parent"
            ref={setScrollParent}
            style={{
              height: CONTAINER_HEIGHT,
              overflow: 'auto',
              width: CONTAINER_WIDTH,
            }}
          >
            <div style={{ height: TOOLBAR_HEIGHT }}>Workspace toolbar</div>
            <VirtuosoDataTable
              customScrollParent={scrollParent}
              onScroll={onScroll}
              source={ITEMS}
              style={{ height: TABLE_HEIGHT, width: CONTAINER_WIDTH }}
            >
              <Column field="name">
                <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
                <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
              </Column>
            </VirtuosoDataTable>
          </div>
        </div>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    const scrollParent = screen.container.querySelector(scrollParentSelector) as HTMLElement
    scrollParent.scrollTop = SCROLL_TOP

    await expect.poll(() => onScroll.mock.calls.at(-1)?.[0].listOffset).toBe(-(SCROLL_TOP - TOOLBAR_HEIGHT))
  })
})
