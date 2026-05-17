import { useState } from 'react'

import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { CellDefinition as Cell } from '../../src/columns/Cell'
import { Column } from '../../src/columns/Column'
import { LocalDataTable as VirtuosoDataTable } from '../../src/tests/LocalDataTable'

const DATA = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }))

function TestHarness() {
  const [parentA] = useState(() => {
    const el = document.createElement('div')
    Object.assign(el.style, { height: '300px', overflow: 'auto' })
    el.dataset.testid = 'parent-a'
    document.body.append(el)
    return el
  })

  const [parentB] = useState(() => {
    const el = document.createElement('div')
    Object.assign(el.style, { height: '300px', overflow: 'auto' })
    el.dataset.testid = 'parent-b'
    document.body.append(el)
    return el
  })

  const [activeParent, setActiveParent] = useState<'a' | 'b'>('a')

  return (
    <div>
      <button data-testid="switch" onClick={() => setActiveParent((p) => (p === 'a' ? 'b' : 'a'))}>
        Switch
      </button>
      <VirtuosoDataTable customScrollParent={activeParent === 'a' ? parentA : parentB} source={DATA}>
        <Column field="id">
          <Cell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field="name">
          <Cell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}

test('CustomScrollParentWrapper rebinds listeners when customScrollParent prop changes', async () => {
  const scrollListeners = new Map<HTMLElement, number>()

  // oxlint-disable-next-line unbound-method
  const origAdd = HTMLElement.prototype.addEventListener
  // oxlint-disable-next-line unbound-method
  const origRemove = HTMLElement.prototype.removeEventListener

  const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener').mockImplementation(function (
    this: HTMLElement,
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === 'scroll') {
      scrollListeners.set(this, (scrollListeners.get(this) ?? 0) + 1)
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
      const current = scrollListeners.get(this) ?? 0
      scrollListeners.set(this, Math.max(0, current - 1))
    }
    return origRemove.call(this, type, handler, options)
  })

  try {
    const screen = await render(<TestHarness />)

    const resolvedA = document.querySelector('[data-testid="parent-a"]') as HTMLElement
    const resolvedB = document.querySelector('[data-testid="parent-b"]') as HTMLElement
    expect(resolvedA).not.toBeNull()
    expect(resolvedB).not.toBeNull()

    const listenersOnABeforeSwitch = scrollListeners.get(resolvedA) ?? 0
    expect(listenersOnABeforeSwitch).toBeGreaterThan(0)

    await screen.getByTestId('switch').click()

    const listenersOnBAfterSwitch = scrollListeners.get(resolvedB) ?? 0
    expect(listenersOnBAfterSwitch).toBeGreaterThan(0)

    const listenersOnAAfterSwitch = scrollListeners.get(resolvedA) ?? 0
    expect(listenersOnAAfterSwitch).toBe(0)
  } finally {
    addSpy.mockRestore()
    removeSpy.mockRestore()
    document.querySelector('[data-testid="parent-a"]')?.remove()
    document.querySelector('[data-testid="parent-b"]')?.remove()
  }
})
