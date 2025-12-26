/// <reference types="@vitest/browser/matchers" />

import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { EngineProvider } from '../../EngineProvider'
import { LayoutSlot } from '../../router/LayoutSlot'
import { LayoutSlotFill } from '../../router/LayoutSlotFill'
import { LayoutSlotPortal } from '../../router/LayoutSlotPortal'

describe('LayoutSlots', () => {
  it('creates a slot portal', () => {
    const slot$ = LayoutSlotPortal()
    expect(slot$).toBeDefined()
    expect(typeof slot$).toBe('symbol')
  })

  it('renders default content when no fill is provided', async () => {
    const slot$ = LayoutSlotPortal()

    function TestComponent() {
      return (
        <EngineProvider>
          <LayoutSlot slotPortal={slot$}>
            <div>Default content</div>
          </LayoutSlot>
        </EngineProvider>
      )
    }

    const screen = await render(<TestComponent />)
    await expect.element(screen.getByText('Default content')).toBeInTheDocument()
  })

  it('renders null when no fill and no default content', async () => {
    const slot$ = LayoutSlotPortal()

    function TestComponent() {
      return (
        <EngineProvider>
          <div data-testid="container">
            <LayoutSlot slotPortal={slot$} />
          </div>
        </EngineProvider>
      )
    }

    const screen = await render(<TestComponent />)
    const container = screen.getByTestId('container')
    expect(container.element().textContent).toBe('')
  })

  it('renders fill content when provided', async () => {
    const slot$ = LayoutSlotPortal()

    function TestComponent() {
      return (
        <EngineProvider>
          <div data-testid="container">
            <LayoutSlot slotPortal={slot$}>
              <div data-testid="default">Default content</div>
            </LayoutSlot>
          </div>
          <LayoutSlotFill slotPortal={slot$}>
            <div data-testid="fill">Fill content</div>
          </LayoutSlotFill>
        </EngineProvider>
      )
    }

    const screen = await render(<TestComponent />)
    await expect.element(screen.getByTestId('fill')).toBeInTheDocument()
    // Default content should not be rendered
    const container = screen.getByTestId('container')
    expect(container.element().querySelector('[data-testid="default"]')).toBe(null)
  })

  it('clears slot content when fill unmounts', async () => {
    const slot$ = LayoutSlotPortal()

    function TestComponent({ showFill }: { showFill: boolean }) {
      return (
        <EngineProvider>
          <LayoutSlot slotPortal={slot$}>
            <div data-testid="default">Default content</div>
          </LayoutSlot>
          {showFill && (
            <LayoutSlotFill slotPortal={slot$}>
              <div data-testid="fill">Fill content</div>
            </LayoutSlotFill>
          )}
        </EngineProvider>
      )
    }

    const screen = await render(<TestComponent showFill={true} />)
    await expect.element(screen.getByTestId('fill')).toBeInTheDocument()

    // Unmount the fill
    await screen.rerender(<TestComponent showFill={false} />)
    await expect.element(screen.getByTestId('default')).toBeInTheDocument()
  })

  it('last fill wins when multiple fills target the same slot', async () => {
    const slot$ = LayoutSlotPortal()

    function TestComponent() {
      return (
        <EngineProvider>
          <LayoutSlot slotPortal={slot$}>
            <div data-testid="default">Default content</div>
          </LayoutSlot>
          <LayoutSlotFill slotPortal={slot$}>
            <div data-testid="first">First fill</div>
          </LayoutSlotFill>
          <LayoutSlotFill slotPortal={slot$}>
            <div data-testid="second">Second fill</div>
          </LayoutSlotFill>
        </EngineProvider>
      )
    }

    const screen = await render(<TestComponent />)
    await expect.element(screen.getByTestId('second')).toBeInTheDocument()
  })

  it('updates slot content when fill children change', async () => {
    const slot$ = LayoutSlotPortal()

    function TestComponent({ content }: { content: string }) {
      return (
        <EngineProvider>
          <LayoutSlot slotPortal={slot$}>
            <div>Default content</div>
          </LayoutSlot>
          <LayoutSlotFill slotPortal={slot$}>
            <div data-testid="content">{content}</div>
          </LayoutSlotFill>
        </EngineProvider>
      )
    }

    const screen = await render(<TestComponent content="Initial content" />)
    const contentEl = screen.getByTestId('content')
    expect(contentEl.element().textContent).toBe('Initial content')

    // Update the content
    await screen.rerender(<TestComponent content="Updated content" />)
    const updatedContentEl = screen.getByTestId('content')
    expect(updatedContentEl.element().textContent).toBe('Updated content')
  })

  it('works with multiple independent slots', async () => {
    const slot1$ = LayoutSlotPortal()
    const slot2$ = LayoutSlotPortal()

    function TestComponent() {
      return (
        <EngineProvider>
          <LayoutSlot slotPortal={slot1$}>
            <div data-testid="default1">Default 1</div>
          </LayoutSlot>
          <LayoutSlot slotPortal={slot2$}>
            <div data-testid="default2">Default 2</div>
          </LayoutSlot>
          <LayoutSlotFill slotPortal={slot1$}>
            <div data-testid="fill1">Fill 1</div>
          </LayoutSlotFill>
          <LayoutSlotFill slotPortal={slot2$}>
            <div data-testid="fill2">Fill 2</div>
          </LayoutSlotFill>
        </EngineProvider>
      )
    }

    const screen = await render(<TestComponent />)
    await expect.element(screen.getByTestId('fill1')).toBeInTheDocument()
    await expect.element(screen.getByTestId('fill2')).toBeInTheDocument()
  })

  it('LayoutSlotFill renders nothing to the DOM', async () => {
    const slot$ = LayoutSlotPortal()

    function TestComponent() {
      return (
        <EngineProvider>
          <div data-testid="parent">
            <LayoutSlotFill slotPortal={slot$}>
              <div>Fill content</div>
            </LayoutSlotFill>
            <span>Sibling</span>
          </div>
          <LayoutSlot slotPortal={slot$} />
        </EngineProvider>
      )
    }

    const screen = await render(<TestComponent />)
    const parent = screen.getByTestId('parent')

    // The parent should only have the sibling span, not the LayoutSlotFill
    expect(parent.element().children.length).toBe(1)
    expect(parent.element().children[0]?.tagName).toBe('SPAN')

    // But the slot should render the fill content
    await expect.element(screen.getByText('Fill content')).toBeInTheDocument()
  })
})
