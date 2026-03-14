import { useState } from 'react'

import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { GroupHeaderCell } from '../../GroupHeaderCell'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const GROUP_HEADER_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150

interface DataItem {
  id: number
  name: string
  category: string
}

interface GroupItem {
  groupName: string
}

const ITEM_COUNT = 100
const ITEMS: DataItem[] = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  category: ['A', 'B'][i % 2]!,
}))

function buildGroupedData(items: DataItem[]): { data: (DataItem | GroupItem)[]; groups: { index: number; level: number }[] } {
  const buckets = new Map<string, DataItem[]>()
  for (const item of items) {
    let bucket = buckets.get(item.category)
    if (!bucket) {
      bucket = []
      buckets.set(item.category, bucket)
    }
    bucket.push(item)
  }

  const data: (DataItem | GroupItem)[] = []
  const groups: { index: number; level: number }[] = []
  for (const [category, categoryItems] of buckets) {
    groups.push({ index: data.length, level: 0 })
    data.push({ groupName: category })
    data.push(...categoryItems)
  }
  return { data, groups }
}

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const tableBodySelector = '[data-testid=virtuoso-table-body]'
const rowSelector = '[data-testid=virtuoso-table-row]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('data change sizing', () => {
  test('table body height updates correctly when switching from flat to grouped data', async () => {
    const grouped = buildGroupedData(ITEMS)
    const GROUP_COUNT = 2

    function TestComponent() {
      const [tableData, setTableData] = useState<{ data: (DataItem | GroupItem)[]; groups: { index: number; level: number }[] }>({
        data: ITEMS,
        groups: [],
      })

      return (
        <>
          <button data-testid="group" onClick={() => setTableData(grouped)}>
            Group
          </button>
          <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
            <GroupHeaderCell>
              {({ row }) => <div style={{ height: GROUP_HEADER_HEIGHT }}>{(row.data as GroupItem).groupName}</div>}
            </GroupHeaderCell>
            <Column field="name">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
            </Column>
          </VirtuosoDataTable>
        </>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    const tableBody = () => screen.container.querySelector(tableBodySelector) as HTMLElement

    const expectedFlatHeight = ITEM_COUNT * ROW_HEIGHT
    expect(tableBody().style.height).toBe(`${expectedFlatHeight}px`)

    const button = screen.container.querySelector('[data-testid="group"]') as HTMLButtonElement
    button.click()

    const expectedGroupedHeight = ITEM_COUNT * ROW_HEIGHT + GROUP_COUNT * GROUP_HEADER_HEIGHT

    await expect
      .poll(() => {
        const rows = screen.container.querySelectorAll(rowSelector)
        return rows.length > 0 && Object.hasOwn((rows[0] as HTMLElement).dataset, 'groupRow')
      })
      .toBe(true)

    await expect.poll(() => tableBody().style.height).toBe(`${expectedGroupedHeight}px`)
  })

  test('all data rows have uniform size after switching to grouped data', async () => {
    const grouped = buildGroupedData(ITEMS)

    function TestComponent() {
      const [tableData, setTableData] = useState<{ data: (DataItem | GroupItem)[]; groups: { index: number; level: number }[] }>({
        data: ITEMS,
        groups: [],
      })

      return (
        <>
          <button data-testid="group" onClick={() => setTableData(grouped)}>
            Group
          </button>
          <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
            <GroupHeaderCell>
              {({ row }) => <div style={{ height: GROUP_HEADER_HEIGHT }}>{(row.data as GroupItem).groupName}</div>}
            </GroupHeaderCell>
            <Column field="name">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
            </Column>
          </VirtuosoDataTable>
        </>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    const button = screen.container.querySelector('[data-testid="group"]') as HTMLButtonElement
    button.click()

    await expect
      .poll(() => {
        const rows = screen.container.querySelectorAll(rowSelector)
        return rows.length > 0 && Object.hasOwn((rows[0] as HTMLElement).dataset, 'groupRow')
      })
      .toBe(true)

    const rows = screen.container.querySelectorAll(rowSelector)
    const dataRows = [...rows].filter((row) => !Object.hasOwn((row as HTMLElement).dataset, 'groupRow'))
    const sizes = dataRows.map((row) => parseFloat((row as HTMLElement).dataset.knownSize!))

    const firstSize = sizes[0]!
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBe(firstSize)
    }
  })

  test('row positions are contiguous after data change', async () => {
    const grouped = buildGroupedData(ITEMS)

    function TestComponent() {
      const [tableData, setTableData] = useState<{ data: (DataItem | GroupItem)[]; groups: { index: number; level: number }[] }>({
        data: ITEMS,
        groups: [],
      })

      return (
        <>
          <button data-testid="group" onClick={() => setTableData(grouped)}>
            Group
          </button>
          <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
            <GroupHeaderCell>
              {({ row }) => <div style={{ height: GROUP_HEADER_HEIGHT }}>{(row.data as GroupItem).groupName}</div>}
            </GroupHeaderCell>
            <Column field="name">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
            </Column>
          </VirtuosoDataTable>
        </>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    const button = screen.container.querySelector('[data-testid="group"]') as HTMLButtonElement
    button.click()

    await expect
      .poll(() => {
        const rows = screen.container.querySelectorAll(rowSelector)
        return rows.length > 0 && Object.hasOwn((rows[0] as HTMLElement).dataset, 'groupRow')
      })
      .toBe(true)

    const rows = screen.container.querySelectorAll(rowSelector)
    const positions = [...rows].map((row) => {
      const style = (row as HTMLElement).style
      return parseFloat(style.top)
    })

    for (let i = 1; i < positions.length; i++) {
      const prevRow = rows[i - 1] as HTMLElement
      const prevKnownSize = parseFloat(prevRow.dataset.knownSize!)
      const expectedTop = positions[i - 1]! + prevKnownSize
      expect(positions[i]).toBe(expectedTop)
    }
  })
})
