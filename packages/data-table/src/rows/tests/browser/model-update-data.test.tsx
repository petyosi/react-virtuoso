import { useMemo } from 'react'

import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { localModel } from '../../../model/local-model'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150

interface DataItem {
  id: number
  name: string
}

const ITEM_COUNT = 100
const VISIBLE_ROW_COUNT = Math.ceil((CONTAINER_HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)
// The anchor row (index 0) survives a size-tree reset either way, since row-state.ts re-seeds a
// probe commit at the anchor. The regression only shows up on the other visible rows, which get
// dropped from that commit and unmount.
const NON_ANCHOR_ROW_INDEX = Math.min(3, VISIBLE_ROW_COUNT - 1)

function buildItems(prefix: string): DataItem[] {
  return Array.from({ length: ITEM_COUNT }, (_, i) => ({ id: i, name: `${prefix}${i}` }))
}

const INITIAL_ITEMS = buildItems('initial-')
const UPDATED_ITEMS = buildItems('updated-')
const REPLACED_ITEMS = buildItems('replaced-')

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const tableBodySelector = '[data-testid=virtuoso-table-body]'
const rowSelector = '[data-testid=virtuoso-table-row]'
const cellTextSelector = '[data-testid=cell-text]'
const cellInputSelector = '[data-testid=cell-input]'
const nonAnchorRowSelector = `[data-testid=virtuoso-table-row][data-index="${NON_ANCHOR_ROW_INDEX}"]`

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

function TestComponent() {
  const model = useMemo(() => localModel<DataItem>({ data: INITIAL_ITEMS }), [])

  return (
    <>
      <button data-testid="update" onClick={() => model.updateData?.(UPDATED_ITEMS)}>
        Update
      </button>
      <button data-testid="replace" onClick={() => model.setData?.(REPLACED_ITEMS)}>
        Replace
      </button>
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>
            {({ cellValue }) => (
              <div style={{ height: ROW_HEIGHT }}>
                <span data-testid="cell-text">{String(cellValue ?? '')}</span>
                <input data-testid="cell-input" defaultValue="" />
              </div>
            )}
          </Cell>
        </Column>
      </VirtuosoDataTable>
    </>
  )
}

describe('model updateData vs setData', () => {
  test('updateData preserves DOM nodes and cell state on the anchor row', async () => {
    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    const capturedRow = screen.container.querySelector(rowSelector) as HTMLElement
    const capturedInput = capturedRow.querySelector(cellInputSelector) as HTMLInputElement
    const originalKnownSize = capturedRow.dataset.knownSize

    capturedInput.focus()
    capturedInput.value = 'typed-value'
    capturedInput.dispatchEvent(new Event('input', { bubbles: true }))
    const activeElementBeforeUpdate = document.activeElement

    expect(activeElementBeforeUpdate).toBe(capturedInput)

    const updateButton = screen.container.querySelector('[data-testid="update"]') as HTMLButtonElement
    updateButton.click()

    await expect.poll(() => capturedRow.querySelector(cellTextSelector)?.textContent).toBe(UPDATED_ITEMS[0]!.name)

    expect(screen.container.querySelector(rowSelector)).toBe(capturedRow)
    expect(capturedRow.querySelector(cellInputSelector)).toBe(capturedInput)
    expect(capturedInput.value).toBe('typed-value')
    expect(document.activeElement).toBe(capturedInput)
    expect(capturedRow.dataset.knownSize).toBe(originalKnownSize)
  })

  test('updateData preserves DOM nodes and cell state on a non-anchor row', async () => {
    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    expect(screen.container.querySelector(nonAnchorRowSelector)).not.toBeNull()

    const capturedRow = screen.container.querySelector(nonAnchorRowSelector) as HTMLElement
    const capturedInput = capturedRow.querySelector(cellInputSelector) as HTMLInputElement
    const originalKnownSize = capturedRow.dataset.knownSize

    capturedInput.focus()
    capturedInput.value = 'typed-value'
    capturedInput.dispatchEvent(new Event('input', { bubbles: true }))
    const activeElementBeforeUpdate = document.activeElement

    expect(activeElementBeforeUpdate).toBe(capturedInput)

    const updateButton = screen.container.querySelector('[data-testid="update"]') as HTMLButtonElement
    updateButton.click()

    await expect.poll(() => capturedRow.querySelector(cellTextSelector)?.textContent).toBe(UPDATED_ITEMS[NON_ANCHOR_ROW_INDEX]!.name)

    expect(capturedRow.isConnected).toBe(true)
    expect(screen.container.querySelector(nonAnchorRowSelector)).toBe(capturedRow)
    expect(capturedRow.querySelector(cellInputSelector)).toBe(capturedInput)
    expect(capturedInput.value).toBe('typed-value')
    expect(document.activeElement).toBe(capturedInput)
    expect(capturedRow.dataset.knownSize).toBe(originalKnownSize)
  })

  test('total body height never dips while updateData is applied', async () => {
    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    const tableBody = () => screen.container.querySelector(tableBodySelector) as HTMLElement
    const capturedRow = () => screen.container.querySelector(rowSelector) as HTMLElement
    const expectedHeight = `${ITEM_COUNT * ROW_HEIGHT}px`

    expect(tableBody().style.height).toBe(expectedHeight)

    const updateButton = screen.container.querySelector('[data-testid="update"]') as HTMLButtonElement
    updateButton.click()

    // Guards the lastSize fallback in computeTotalSize, not updateData specifically — a same-length
    // setData holds this height steady too, so this does not on its own distinguish the two paths.
    expect(tableBody().style.height).toBe(expectedHeight)

    await expect.poll(() => capturedRow().querySelector(cellTextSelector)?.textContent).toBe(UPDATED_ITEMS[0]!.name)

    expect(tableBody().style.height).toBe(expectedHeight)
  })

  test('setData still resets the known row-size tree and unmounts non-anchor rows', async () => {
    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    expect(screen.container.querySelector(nonAnchorRowSelector)).not.toBeNull()

    const anchorRow = screen.container.querySelector(rowSelector) as HTMLElement
    const originalAnchorKnownSize = anchorRow.dataset.knownSize
    expect(originalAnchorKnownSize).toBe(String(ROW_HEIGHT))

    const nonAnchorRow = screen.container.querySelector(nonAnchorRowSelector) as HTMLElement

    // The reset lands asynchronously (an unmeasured-probe commit followed by remeasurement), so a
    // synchronous read right after the click can miss it — observe every attribute change instead.
    const observedAnchorKnownSizes: (string | undefined)[] = []
    const anchorObserver = new MutationObserver(() => {
      observedAnchorKnownSizes.push(anchorRow.dataset.knownSize)
    })
    anchorObserver.observe(anchorRow, { attributes: true, attributeFilter: ['data-known-size'] })

    const replaceButton = screen.container.querySelector('[data-testid="replace"]') as HTMLButtonElement
    replaceButton.click()

    // The anchor row is re-seeded in place (same key), so it only ever gets a size-attribute
    // update. Every other visible row is absent from that seed commit and is unmounted outright.
    await expect.poll(() => nonAnchorRow.isConnected).toBe(false)
    anchorObserver.disconnect()

    expect(observedAnchorKnownSizes).toContain('0')

    await expect.poll(() => anchorRow.querySelector(cellTextSelector)?.textContent).toBe(REPLACED_ITEMS[0]!.name)
    await expect.poll(() => anchorRow.dataset.knownSize).toBe(String(ROW_HEIGHT))

    const remountedNonAnchorRow = screen.container.querySelector(nonAnchorRowSelector)
    expect(remountedNonAnchorRow).not.toBeNull()
    expect(remountedNonAnchorRow).not.toBe(nonAnchorRow)
    expect(remountedNonAnchorRow?.querySelector(cellTextSelector)?.textContent).toBe(REPLACED_ITEMS[NON_ANCHOR_ROW_INDEX]!.name)
  })
})
