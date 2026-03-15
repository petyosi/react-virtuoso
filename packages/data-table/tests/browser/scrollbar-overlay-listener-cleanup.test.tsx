import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { VirtuosoDataTable } from '../../src'
import { CellDefinition as Cell } from '../../src/columns/Cell'
import { Column } from '../../src/columns/Column'

function SimpleTable() {
  return (
    <VirtuosoDataTable
      style={{ height: 200, width: 300 }}
      data={{
        data: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        groups: [],
      }}
    >
      <Column field="id">
        <Cell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</Cell>
      </Column>
      <Column field="name">
        <Cell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

test('ScrollbarOverlay does not leak scroll event listeners across mount/unmount cycles', async () => {
  let addCount = 0
  let removeCount = 0

  // oxlint-disable-next-line unbound-method
  const { addEventListener: origAdd, removeEventListener: origRemove } = HTMLElement.prototype

  const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener').mockImplementation(function (
    this: HTMLElement,
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === 'scroll') {
      addCount++
    }
    return origAdd.call(this, type, handler, options)
  })

  const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener').mockImplementation(function (
    this: HTMLElement,
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) {
    if (type === 'scroll') {
      removeCount++
    }
    return origRemove.call(this, type, handler, options)
  })

  // Run two mount/unmount cycles and measure the net listener growth per cycle.
  // React's event delegation adds a small constant number of root-level scroll
  // listeners per render root that are cleaned up via DOM removal rather than
  // removeEventListener, so a per-cycle residual of ~1 is expected.
  // A leaking ScrollbarOverlay would add 3+ extra per cycle.
  const screen1 = await render(<SimpleTable />)
  await screen1.unmount()
  const netAfterFirstCycle = addCount - removeCount

  const screen2 = await render(<SimpleTable />)
  await screen2.unmount()
  const netAfterSecondCycle = addCount - removeCount

  const growthPerCycle = netAfterSecondCycle - netAfterFirstCycle
  expect(growthPerCycle).toBeLessThanOrEqual(1)

  addSpy.mockRestore()
  removeSpy.mockRestore()
})
