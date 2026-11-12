import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, Column, ColumnHeader } from '../../..'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const rowSelector = '[data-testid=virtuoso-table-row]'

const rows = Array.from({ length: 5 }, (_, index) => ({ name: `Row ${index}` }))

function nextFrame() {
  const { promise, resolve } = Promise.withResolvers<void>()
  requestAnimationFrame(() => resolve())
  return promise
}

async function renderInFrame() {
  const screen = await render(
    <div data-testid="frame">
      <VirtuosoDataTable style={{ height: 240, width: 400 }} source={rows}>
        <Column field="name">
          <ColumnHeader>{() => <span>Name</span>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
  await expect.poll(() => screen.container.querySelectorAll(rowSelector).length).toBe(rows.length)
  const frame = screen.container.querySelector('[data-testid=frame]') as HTMLElement
  return { screen, frame }
}

describe('a table under a hidden ancestor', () => {
  test('renders its rows again after the ancestor is hidden for a few frames', async () => {
    // A resize observer callback that throws reaches the page as an error event, not as a test
    // failure. The browser also reports an undelivered resize notification this way, which is harmless.
    const errors: string[] = []
    const recordError = (event: ErrorEvent) => {
      if (!event.message.includes('ResizeObserver loop')) {
        errors.push(event.message)
      }
    }
    window.addEventListener('error', recordError)
    try {
      const { screen, frame } = await renderInFrame()

      frame.style.display = 'none'
      await nextFrame()
      await nextFrame()
      frame.style.display = ''

      await expect.poll(() => screen.container.querySelectorAll(rowSelector).length).toBe(rows.length)
      expect(errors).toEqual([])
    } finally {
      window.removeEventListener('error', recordError)
    }
  })

  test('renders its rows where elements report no client rects but real sizes, as in jsdom', async () => {
    // jsdom has no layout, so it returns no client rects for any element, while tests feed the
    // resize observer real sizes.
    const getClientRects = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([] as unknown as DOMRectList)
    try {
      const screen = await render(
        <VirtuosoDataTable style={{ height: 240, width: 400 }} source={rows}>
          <Column field="name">
            <ColumnHeader>{() => <span>Name</span>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
        </VirtuosoDataTable>
      )

      await expect.poll(() => screen.container.querySelectorAll(rowSelector).length).toBe(rows.length)
    } finally {
      getClientRects.mockRestore()
    }
  })
})
