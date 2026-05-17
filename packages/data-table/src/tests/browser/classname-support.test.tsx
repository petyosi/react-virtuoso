import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, Column, ColumnGroup, ColumnGroupHeader, ColumnHeader, GroupHeaderCell } from '../..'
import { LocalDataTable as VirtuosoDataTable } from '../LocalDataTable'

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const groupRowSelector = '[data-testid=virtuoso-table-row][data-group-row]'

const rows = [{ name: 'Desk', category: 'Office', price: 249, stock: 7 }]
const groupedRows = {
  data: [{ label: 'Office' }, ...rows],
  groups: [{ index: 0, level: 0 }],
}

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('className support', () => {
  test('applies className to cell wrappers and omits the class attribute when unset', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: 240, width: 400 }} source={rows}>
        <Column field="name">
          <ColumnHeader>{() => <span>Name</span>}</ColumnHeader>
          <Cell className="font-medium">{({ cellValue }) => <span data-testid="classed-cell">{String(cellValue)}</span>}</Cell>
        </Column>
        <Column field="stock">
          <ColumnHeader>{() => <span>Stock</span>}</ColumnHeader>
          <Cell>{({ cellValue }) => <span data-testid="plain-cell">{String(cellValue)}</span>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const classedCell = screen.container.querySelector('[data-testid="classed-cell"]') as HTMLElement
    expect(classedCell.parentElement?.classList.contains('font-medium')).toBe(true)

    const plainCell = screen.container.querySelector('[data-testid="plain-cell"]') as HTMLElement
    expect(plainCell.parentElement?.hasAttribute('class')).toBeFalsy()
  })

  test('applies className to column headers and omits the class attribute when unset', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: 240, width: 400 }} source={rows}>
        <Column field="name">
          <ColumnHeader className="justify-end">{() => <span data-testid="classed-header">Name</span>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="stock">
          <ColumnHeader>{() => <span data-testid="plain-header">Stock</span>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)
    await expect.poll(() => screen.container.querySelector('[data-testid="classed-header"]')).not.toBeNull()
    await expect.poll(() => screen.container.querySelector('[data-testid="plain-header"]')).not.toBeNull()

    const classedHeader = screen.container.querySelector('[data-testid="classed-header"]') as HTMLElement
    expect(classedHeader.parentElement?.classList.contains('justify-end')).toBe(true)

    const plainHeader = screen.container.querySelector('[data-testid="plain-header"]') as HTMLElement
    expect(plainHeader.parentElement?.hasAttribute('class')).toBeFalsy()
  })

  test('applies className to column group header wrappers', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: 240, width: 400 }} source={rows}>
        <ColumnGroup>
          <ColumnGroupHeader className="text-center">{() => <span data-testid="group-header-content">Inventory</span>}</ColumnGroupHeader>
          <Column field="name">
            <ColumnHeader>{() => <span>Name</span>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
        </ColumnGroup>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupHeaderContent = screen.container.querySelector('[data-testid="group-header-content"]') as HTMLElement
    expect(groupHeaderContent.parentElement?.classList.contains('text-center')).toBe(true)
  })

  test('applies className to group header rows', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: 240, width: 400 }} source={groupedRows}>
        <GroupHeaderCell className="bg-muted">
          {({ row }) => <span data-testid="group-row-content">{(row.data as { label: string }).label}</span>}
        </GroupHeaderCell>
        <Column field="name">
          <ColumnHeader>{() => <span>Name</span>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupRow = screen.container.querySelector(groupRowSelector) as HTMLElement
    expect(groupRow.classList.contains('bg-muted')).toBe(true)

    const groupRowContent = screen.container.querySelector('[data-testid="group-row-content"]') as HTMLElement
    expect(groupRowContent.parentElement).toBe(groupRow)
  })

  test('preserves layout when wrapper classes add padding', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: 240, width: 720 }} source={rows}>
        <Column field="name">
          <ColumnHeader className="flex h-10 items-center px-2 whitespace-nowrap">
            {() => <span data-testid="layout-header-name">Name</span>}
          </ColumnHeader>
          <Cell className="p-2 whitespace-nowrap">
            {({ cellValue }) => <span data-testid="layout-cell-name">{String(cellValue)}</span>}
          </Cell>
        </Column>
        <Column field="category">
          <ColumnHeader className="flex h-10 items-center px-2 whitespace-nowrap">
            {() => <span data-testid="layout-header-category">Category</span>}
          </ColumnHeader>
          <Cell className="p-2 whitespace-nowrap">{() => <span data-testid="layout-cell-category">Office</span>}</Cell>
        </Column>
        <Column field="price">
          <ColumnHeader className="flex h-10 items-center px-2 text-right whitespace-nowrap">
            {() => <span data-testid="layout-header-price">Price</span>}
          </ColumnHeader>
          <Cell className="p-2 text-right whitespace-nowrap">{() => <span data-testid="layout-cell-price">$699.00</span>}</Cell>
        </Column>
        <Column field="stock">
          <ColumnHeader className="flex h-10 items-center px-2 text-right whitespace-nowrap">
            {() => <span data-testid="layout-header-stock">Stock</span>}
          </ColumnHeader>
          <Cell className="p-2 text-right whitespace-nowrap">{() => <span data-testid="layout-cell-stock">14</span>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const headerIds = ['layout-header-name', 'layout-header-category', 'layout-header-price', 'layout-header-stock']
    const headers = headerIds.map((testId) => screen.container.querySelector(`[data-testid="${testId}"]`) as HTMLElement)
    const headerBoxes = headers.map((header) => header.parentElement?.getBoundingClientRect())

    expect(headerBoxes.every((box) => box !== undefined)).toBe(true)
    for (let i = 1; i < headerBoxes.length; i++) {
      expect(headerBoxes[i - 1]!.right).toBeLessThanOrEqual(headerBoxes[i]!.left + 1)
    }

    const cellIds = ['layout-cell-name', 'layout-cell-category', 'layout-cell-price', 'layout-cell-stock']
    const cells = cellIds.map((testId) => screen.container.querySelector(`[data-testid="${testId}"]`) as HTMLElement)
    const cellBoxes = cells.map((cell) => cell.parentElement?.getBoundingClientRect())

    expect(cellBoxes.every((box) => box !== undefined)).toBe(true)
    for (let i = 1; i < cellBoxes.length; i++) {
      expect(cellBoxes[i - 1]!.right).toBeLessThanOrEqual(cellBoxes[i]!.left + 1)
    }
  })
})
