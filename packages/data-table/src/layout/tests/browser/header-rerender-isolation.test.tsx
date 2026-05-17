import React from 'react'

import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 500
const COLUMN_WIDTH = 100
const COLUMN_COUNT = 8
const ITEM_COUNT = 200

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => {
  const row: Record<string, string> = {}
  for (let j = 0; j < COLUMN_COUNT; j++) {
    row[`col${j}`] = `R${i}C${j}`
  }
  return row
})

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'
const rowSelector = '[data-testid=virtuoso-table-row]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('header re-render isolation', () => {
  test('vertical scroll does not re-render column headers', async () => {
    const headerRenderCount = { current: 0 }

    function TrackingHeader({ label }: { label: string }) {
      const renderCountRef = React.useRef(0)
      renderCountRef.current++

      React.useEffect(() => {
        headerRenderCount.current++
      })

      return <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>{label}</div>
    }

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} source={ITEMS}>
        {Array.from({ length: COLUMN_COUNT }, (_, i) => (
          <Column key={`col${i}`} field={`col${i}`}>
            <ColumnHeader>{() => <TrackingHeader label={`Header ${i}`} />}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    await expect.poll(() => headerRenderCount.current).toBeGreaterThan(0)
    const initialHeaderRenders = headerRenderCount.current

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const firstRowBefore = screen.container.querySelector(rowSelector) as HTMLElement
    const firstIndexBefore = firstRowBefore.dataset.index

    scroller.scrollTop = 500

    await expect
      .poll(() => {
        const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
        return firstRow?.dataset.index
      })
      .not.toBe(firstIndexBefore)

    expect(headerRenderCount.current).toBe(initialHeaderRenders)
  })

  test('vertical scroll does not re-render sticky column headers', async () => {
    const headerRenderCount = { current: 0 }

    function TrackingHeader({ label }: { label: string }) {
      React.useEffect(() => {
        headerRenderCount.current++
      })

      return <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>{label}</div>
    }

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} source={ITEMS}>
        <Column field="col0" sticky="left">
          <ColumnHeader>{() => <TrackingHeader label="Sticky Left" />}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        {Array.from({ length: COLUMN_COUNT - 2 }, (_, i) => (
          <Column key={`col${i + 1}`} field={`col${i + 1}`}>
            <ColumnHeader>{() => <TrackingHeader label={`Header ${i + 1}`} />}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
        <Column field={`col${COLUMN_COUNT - 1}`} sticky="right">
          <ColumnHeader>{() => <TrackingHeader label="Sticky Right" />}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    await expect.poll(() => headerRenderCount.current).toBeGreaterThan(0)
    const initialHeaderRenders = headerRenderCount.current

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const firstRowBefore = screen.container.querySelector(rowSelector) as HTMLElement
    const firstIndexBefore = firstRowBefore.dataset.index

    scroller.scrollTop = 500

    await expect
      .poll(() => {
        const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
        return firstRow?.dataset.index
      })
      .not.toBe(firstIndexBefore)

    expect(headerRenderCount.current).toBe(initialHeaderRenders)
  })
})
