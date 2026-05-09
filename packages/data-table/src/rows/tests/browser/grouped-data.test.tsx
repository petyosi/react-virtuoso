import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { GroupHeaderCell } from '../../GroupHeaderCell'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150

interface DataItem {
  a?: string
  b?: string
  c?: string
  name: string
}

interface GroupItem {
  groupName: string
}

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const rowSelector = '[data-testid=virtuoso-table-row]'
const groupRowSelector = '[data-testid=virtuoso-table-row][data-group-row]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

function buildGroupedData(groupSizes: number[]) {
  const data: (DataItem | GroupItem)[] = []
  const groups: { index: number; level: number }[] = []

  for (const size of groupSizes) {
    const groupIndex = data.length
    data.push({ groupName: `Group ${groups.length + 1}` })
    groups.push({ index: groupIndex, level: 0 })
    for (let i = 0; i < size; i++) {
      data.push({ name: `Item ${data.length}` })
    }
  }

  return { data, groups }
}

describe('grouped data', () => {
  test('renders group header rows with data-group-row attribute', async () => {
    const tableData = buildGroupedData([3, 3])

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
        <GroupHeaderCell>
          {({ row }) => (
            <div style={{ height: ROW_HEIGHT }} data-testid="group-header">
              {(row.data as GroupItem).groupName}
            </div>
          )}
        </GroupHeaderCell>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupRows = screen.container.querySelectorAll(groupRowSelector)
    expect(groupRows.length).toBe(2)

    const groupHeaders = screen.container.querySelectorAll('[data-testid="group-header"]')
    expect(groupHeaders[0]?.textContent).toBe('Group 1')
    expect(groupHeaders[1]?.textContent).toBe('Group 2')
  })

  test('group header rows render full-width without column layout', async () => {
    const tableData = buildGroupedData([3])

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
        <GroupHeaderCell>
          {({ row }) => (
            <div style={{ height: ROW_HEIGHT }} data-testid="group-header">
              {(row.data as GroupItem).groupName}
            </div>
          )}
        </GroupHeaderCell>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupRow = screen.container.querySelector(groupRowSelector) as HTMLElement
    expect(groupRow).not.toBeNull()

    const scrollableArea = groupRow.querySelector('[data-scrollable="true"]')
    expect(scrollableArea).toBeNull()
  })

  test('group header row spans the full scrollable table width', async () => {
    const tableData = {
      data: [
        { groupName: 'Group 1' },
        { name: 'Item 1', a: 'A1', b: 'B1', c: 'C1' },
        { name: 'Item 2', a: 'A2', b: 'B2', c: 'C2' },
        { name: 'Item 3', a: 'A3', b: 'B3', c: 'C3' },
      ],
      groups: [{ index: 0, level: 0 }],
    }

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
        <GroupHeaderCell>
          {({ row }) => (
            <div style={{ height: ROW_HEIGHT }} data-testid="group-header">
              {(row.data as GroupItem).groupName}
            </div>
          )}
        </GroupHeaderCell>
        {['name', 'a', 'b', 'c'].map((field) => (
          <Column key={field} field={field}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>{field}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupRow = screen.container.querySelector(groupRowSelector) as HTMLElement
    expect(groupRow).not.toBeNull()
    await expect.poll(() => Math.round(groupRow.getBoundingClientRect().width)).toBe(COLUMN_WIDTH * 4)
  })

  test('measures padded group header row by rendered border-box height', async () => {
    const tableData = buildGroupedData([3])

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
        <style>{`.padded-group-row { padding-block: 8px; line-height: 20px; }`}</style>
        <GroupHeaderCell className="padded-group-row">{({ row }) => (row.data as GroupItem).groupName}</GroupHeaderCell>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupRow = screen.container.querySelector(groupRowSelector) as HTMLElement
    expect(groupRow).not.toBeNull()
    await expect.poll(() => Number(groupRow.dataset.knownSize)).toBeGreaterThan(0)

    expect(Number(groupRow.dataset.knownSize)).toBe(Math.round(groupRow.getBoundingClientRect().height))
  })

  test('regular data rows render with column layout', async () => {
    const tableData = buildGroupedData([3])

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
        <GroupHeaderCell>{({ row }) => <div style={{ height: ROW_HEIGHT }}>{(row.data as GroupItem).groupName}</div>}</GroupHeaderCell>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const allRows = screen.container.querySelectorAll(rowSelector)
    const dataRows = [...allRows].filter((row) => !('groupRow' in (row as HTMLElement).dataset))
    expect(dataRows.length).toBe(3)

    const firstDataRow = dataRows[0] as HTMLElement
    const scrollableArea = firstDataRow.querySelector('[data-scrollable="true"]')
    expect(scrollableArea).not.toBeNull()
  })

  test('group header receives level prop', async () => {
    const data: (DataItem | GroupItem)[] = [
      { groupName: 'Level 0 Group' },
      { groupName: 'Level 1 Group' },
      { name: 'Item 1' },
      { name: 'Item 2' },
    ]
    const groups = [
      { index: 0, level: 0 },
      { index: 1, level: 1 },
    ]

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={{ data, groups }}>
        <GroupHeaderCell>
          {({ row, level }) => (
            <div style={{ height: ROW_HEIGHT }} data-testid="group-header" data-level={level}>
              {(row.data as GroupItem).groupName}
            </div>
          )}
        </GroupHeaderCell>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupHeaders = screen.container.querySelectorAll('[data-testid="group-header"]')
    expect(groupHeaders.length).toBe(2)
    expect((groupHeaders[0] as HTMLElement).dataset.level).toBe('0')
    expect((groupHeaders[1] as HTMLElement).dataset.level).toBe('1')
  })

  test('flat data with no groups renders normally', async () => {
    const ITEM_COUNT = 5
    const items: DataItem[] = Array.from({ length: ITEM_COUNT }, (_, i) => ({ name: `User ${i + 1}` }))

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={{ data: items, groups: [] }}>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupRows = screen.container.querySelectorAll(groupRowSelector)
    expect(groupRows.length).toBe(0)

    const allRows = screen.container.querySelectorAll(rowSelector)
    expect(allRows.length).toBe(ITEM_COUNT)
  })

  test('GroupHeaderCell component prop pattern works', async () => {
    const tableData = buildGroupedData([2])

    function CustomGroupHeader({ row }: { row: { data: unknown }; level: number }) {
      return (
        <div style={{ height: ROW_HEIGHT }} data-testid="custom-group-header">
          Custom: {(row.data as GroupItem).groupName}
        </div>
      )
    }

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={tableData}>
        <GroupHeaderCell component={CustomGroupHeader} />
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupHeader = screen.container.querySelector('[data-testid="custom-group-header"]')
    expect(groupHeader).not.toBeNull()
    expect(groupHeader?.textContent).toBe('Custom: Group 1')
  })
})
