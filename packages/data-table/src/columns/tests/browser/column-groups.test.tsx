import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, ColumnGroup, ColumnGroupHeader } from '../../..'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'
import { Column } from '../../Column'
import { ColumnHeader } from '../../ColumnHeader'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 600
const COLUMN_WIDTH = 100
const COLUMN_COUNT = 6
const ITEM_COUNT = 100

const MULTI_COLUMN_ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => {
  const row: Record<string, string> = {}
  for (let j = 0; j < COLUMN_COUNT; j++) {
    row[`col${j}`] = `R${i}C${j}`
  }
  return row
})

const rowSelector = '[data-testid=virtuoso-table-row]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const leftStickySelector = '[data-sticky="left"]'
const columnGroupSelector = '[data-column-group]'
const groupHeaderSelector = '[role="columnheader"][data-scope="colgroup"]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('column groups', () => {
  test('columns inside group have groupId set and render together', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} source={MULTI_COLUMN_ITEMS}>
        <Column field="col0">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 0</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>

        <ColumnGroup>
          <ColumnGroupHeader>{() => <div style={{ height: 20 }}>Personal Info</div>}</ColumnGroupHeader>
          <Column field="col1">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>First Name</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
          <Column field="col2">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Last Name</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </ColumnGroup>

        <Column field="col3">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 3</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupContainer = screen.container.querySelector(columnGroupSelector)
    expect(groupContainer).not.toBeNull()

    const groupHeader = screen.container.querySelector(groupHeaderSelector)
    expect(groupHeader).not.toBeNull()
    expect(groupHeader?.textContent).toBe('Personal Info')

    const groupHeaders = groupContainer?.querySelectorAll('[data-table-element-role="column-header"]')
    expect(groupHeaders?.length).toBe(2)
  })

  test('sticky group makes all child columns sticky', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} source={MULTI_COLUMN_ITEMS}>
        <ColumnGroup sticky="left">
          <ColumnGroupHeader>{() => <div style={{ height: 20 }}>Sticky Group</div>}</ColumnGroupHeader>
          <Column field="col0">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 0</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
          <Column field="col1">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 1</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </ColumnGroup>

        {Array.from({ length: COLUMN_COUNT - 2 }, (_, i) => (
          <Column key={`col${i + 2}`} field={`col${i + 2}`}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col {i + 2}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const leftStickyContainer = firstRow.querySelector(leftStickySelector) as HTMLElement
    expect(leftStickyContainer).not.toBeNull()

    const stickyCells = leftStickyContainer.querySelectorAll(':scope > div > div')
    expect(stickyCells.length).toBe(2)
    expect(stickyCells[0]?.textContent).toBe('R0C0')
    expect(stickyCells[1]?.textContent).toBe('R0C1')
  })

  test('nested groups render correctly with group header above children', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} source={MULTI_COLUMN_ITEMS}>
        <ColumnGroup>
          <ColumnGroupHeader>
            {() => (
              <div style={{ height: 20 }} data-testid="outer-group">
                Outer Group
              </div>
            )}
          </ColumnGroupHeader>
          <Column field="col0">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 0</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>

          <ColumnGroup>
            <ColumnGroupHeader>
              {() => (
                <div style={{ height: 20 }} data-testid="inner-group">
                  Inner Group
                </div>
              )}
            </ColumnGroupHeader>
            <Column field="col1">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 1</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
            </Column>
            <Column field="col2">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 2</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
            </Column>
          </ColumnGroup>
        </ColumnGroup>

        <Column field="col3">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 3</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const outerGroupHeader = screen.container.querySelector('[data-testid="outer-group"]')
    expect(outerGroupHeader).not.toBeNull()
    expect(outerGroupHeader?.textContent).toBe('Outer Group')

    const innerGroupHeader = screen.container.querySelector('[data-testid="inner-group"]')
    expect(innerGroupHeader).not.toBeNull()
    expect(innerGroupHeader?.textContent).toBe('Inner Group')

    const groupContainers = screen.container.querySelectorAll(columnGroupSelector)
    expect(groupContainers.length).toBe(2)
  })

  test('group header receives correct columnKeys and aria-colspan', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} source={MULTI_COLUMN_ITEMS}>
        <ColumnGroup>
          <ColumnGroupHeader>
            {({ columnKeys }) => (
              <div style={{ height: 20 }} data-testid="group-header" data-column-count={columnKeys.length}>
                Group
              </div>
            )}
          </ColumnGroupHeader>
          <Column field="col0">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 0</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
          <Column field="col1">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 1</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
          <Column field="col2">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 2</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </ColumnGroup>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const groupHeader = screen.container.querySelector('[data-testid="group-header"]') as HTMLElement
    expect(groupHeader).not.toBeNull()
    expect(groupHeader.dataset.columnCount).toBe('3')

    const ariaColspanElement = screen.container.querySelector('[aria-colspan="3"]')
    expect(ariaColspanElement).not.toBeNull()
  })

  test('sticky only works at depth 0', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} source={MULTI_COLUMN_ITEMS}>
        <ColumnGroup sticky="left">
          <ColumnGroupHeader>{() => <div style={{ height: 20 }}>Outer Sticky</div>}</ColumnGroupHeader>
          <Column field="col0">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 0</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>

          <ColumnGroup sticky="right">
            <ColumnGroupHeader>{() => <div style={{ height: 20 }}>Inner Group (sticky ignored)</div>}</ColumnGroupHeader>
            <Column field="col1">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 1</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
            </Column>
          </ColumnGroup>
        </ColumnGroup>

        {Array.from({ length: COLUMN_COUNT - 2 }, (_, i) => (
          <Column key={`col${i + 2}`} field={`col${i + 2}`}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col {i + 2}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const leftStickyContainer = firstRow.querySelector(leftStickySelector) as HTMLElement
    expect(leftStickyContainer).not.toBeNull()

    const stickyCells = leftStickyContainer.querySelectorAll(':scope > div > div')
    expect(stickyCells.length).toBe(2)
    expect(stickyCells[0]?.textContent).toBe('R0C0')
    expect(stickyCells[1]?.textContent).toBe('R0C1')
  })
})
