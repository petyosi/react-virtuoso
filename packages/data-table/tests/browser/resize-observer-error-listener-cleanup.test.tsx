import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { VirtuosoDataTable } from '../../src'
import { CellDefinition as Cell } from '../../src/columns/Cell'
import { Column } from '../../src/columns/Column'

function SimpleTable() {
  return (
    <VirtuosoDataTable style={{ height: 200 }} data={{ data: [{ id: 1 }, { id: 2 }, { id: 3 }], groups: [] }}>
      <Column field="id">
        <Cell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

test('silenceResizeObserverError cleanup uses matching capture flag', async () => {
  const addSpy = vi.spyOn(window, 'addEventListener')
  const removeSpy = vi.spyOn(window, 'removeEventListener')

  const screen = await render(<SimpleTable />)

  const addCalls = addSpy.mock.calls.filter(([type]) => type === 'error')
  expect(addCalls.length).toBeGreaterThan(0)

  const addOptions = addCalls.at(-1)![2]
  const addCapture = typeof addOptions === 'object' ? Boolean(addOptions.capture) : Boolean(addOptions)

  await screen.unmount()

  const removeCalls = removeSpy.mock.calls.filter(([type]) => type === 'error')
  expect(removeCalls.length).toBeGreaterThan(0)

  const removeOptions = removeCalls.at(-1)![2]
  const removeCapture = typeof removeOptions === 'object' ? Boolean(removeOptions.capture) : Boolean(removeOptions)

  expect(removeCapture).toBe(addCapture)

  addSpy.mockRestore()
  removeSpy.mockRestore()
})
