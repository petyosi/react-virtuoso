import { useState } from 'react'

import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150
const SCROLL_TOP = 500

const ITEMS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const rowSelector = '[data-testid=virtuoso-table-row]'
const scrollParentSelector = '[data-testid=custom-scroll-parent]'

async function waitForRows(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelectorAll(rowSelector).length).toBeGreaterThan(5)
}

async function waitForScrollableParent(scrollParent: HTMLElement) {
  await expect.poll(() => scrollParent.scrollHeight).toBeGreaterThan(CONTAINER_HEIGHT * 2)
}

function visibleRowsIn(scrollParent: HTMLElement, screen: Awaited<ReturnType<typeof render>>) {
  const parentRect = scrollParent.getBoundingClientRect()
  return [...screen.container.querySelectorAll(rowSelector)].filter((row) => {
    const rowRect = row.getBoundingClientRect()
    return rowRect.bottom > parentRect.top && rowRect.top < parentRect.bottom
  })
}

describe('customScrollParent render window', () => {
  test('renders a full visible row block after a jump scroll', async () => {
    function TestComponent() {
      const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null)

      return (
        <div
          data-testid="custom-scroll-parent"
          ref={setScrollParent}
          style={{
            height: CONTAINER_HEIGHT,
            overflow: 'auto',
            width: CONTAINER_WIDTH,
          }}
        >
          <div style={{ height: HEADER_HEIGHT }}>Workspace toolbar</div>
          <VirtuosoDataTable customScrollParent={scrollParent} source={ITEMS} style={{ width: CONTAINER_WIDTH }}>
            <Column field="name">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
            </Column>
          </VirtuosoDataTable>
        </div>
      )
    }

    const screen = await render(<TestComponent />)
    const scrollParent = screen.container.querySelector(scrollParentSelector) as HTMLElement

    await waitForRows(screen)
    await waitForScrollableParent(scrollParent)

    scrollParent.scrollTop = SCROLL_TOP

    await expect.poll(() => visibleRowsIn(scrollParent, screen).length).toBeGreaterThan(5)
  })
})
