import { act, fireEvent, render, screen } from '@testing-library/react'
import { it, expect, vi } from 'vitest'

import { VirtuosoGrid } from '../src/VirtuosoGrid'

// DOM lifecycle coverage only; real observer timing is covered in grid-resize.test.ts.
it.each([false, true, 'before observer', 'unmount sibling'] as const)(
  'preserves cells during resize (window event: %s)',
  (windowResize) => {
    let width = 1400
    const observers = new Map<ResizeObserverCallback, Set<Element>>()
    const frames: FrameRequestCallback[] = []
    const originalObserver = global.ResizeObserver
    global.ResizeObserver = class {
      targets = new Set<Element>()
      constructor(callback: ResizeObserverCallback) {
        observers.set(callback, this.targets)
      }
      observe(target: Element) {
        this.targets.add(target)
      }
      unobserve(target: Element) {
        this.targets.delete(target)
      }
      disconnect() {
        this.targets.clear()
      }
    }
    const rectangle = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const columns = Math.floor((width + 15) / 275)
      const itemWidth = (width - (columns - 1) * 15) / columns
      const item = this.dataset.index !== undefined
      return {
        x: 0,
        y: -4000,
        top: -4000,
        left: 0,
        right: item ? itemWidth : width,
        bottom: 900,
        width: item ? itemWidth : width,
        height: item ? itemWidth + 40 : 900,
        toJSON: () => ({}),
      }
    })
    const getStyle = window.getComputedStyle
    const styles = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => {
      const style = getStyle(element)
      if (element instanceof HTMLElement && element.dataset.testid === 'virtuoso-item-list') {
        style.columnGap = '15px'
        style.rowGap = '45px'
      }
      return style
    })
    const offsetParent = vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body)
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const originalY = window.scrollY
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 4000,
    })
    const flushFrames = () => {
      let limit = 100
      while (frames.length && limit-- > 0) {
        const callbacks = frames.splice(0)
        // Browsers run a microtask checkpoint between animation-frame callbacks.
        // Separate act calls expose intermediate React commits, as the browser does.
        callbacks.forEach((callback) => act(() => callback(performance.now())))
      }
      expect(limit).toBeGreaterThan(0)
    }
    const resize = () => {
      act(() => {
        Array.from(observers).forEach(([callback, targets]) => {
          if (targets.size > 0) {
            callback(
              Array.from(targets, (target) => ({ target }) as ResizeObserverEntry),
              {} as ResizeObserver
            )
          }
        })
      })
      flushFrames()
    }
    const content = (index: number) => <input aria-label={`Cell ${index}`} />
    let unmount: (() => void) | undefined
    try {
      const grid = (
        <VirtuosoGrid
          key="main"
          totalCount={1000}
          initialItemCount={24}
          useWindowScroll
          overscan={1600}
          itemContent={content}
          computeItemKey={String}
        />
      )
      const result = render(
        <>
          {grid}
          {windowResize === 'unmount sibling' && <VirtuosoGrid key="sibling" data-grid="sibling" totalCount={1000} useWindowScroll />}
        </>
      )
      unmount = result.unmount
      resize()
      fireEvent.scroll(document, { bubbles: true })
      flushFrames()
      resize()
      if (windowResize === 'unmount sibling') {
        const sibling = document.querySelector('[data-grid=sibling]')!
        const entry = Array.from(observers).find(([, targets]) => Array.from(targets).some((target) => sibling.contains(target)))!
        const target = Array.from(entry[1])[0]!
        rectangle.mockClear()
        act(() => entry[0]([{ target } as ResizeObserverEntry], {} as ResizeObserver))
        flushFrames()
        expect(rectangle.mock.contexts.length).toBeGreaterThan(0)
        expect(rectangle.mock.contexts.every((element) => element instanceof Node && sibling.contains(element))).toBe(true)
        result.rerender(grid)
        rectangle.mockClear()
        fireEvent.resize(window)
        flushFrames()
        expect(rectangle.mock.contexts.length).toBeGreaterThan(0)
        expect(rectangle.mock.contexts.every((element) => element instanceof Node && !sibling.contains(element))).toBe(true)
      }
      width = 1396
      resize()
      // This cell stays in the five-column range, but mixed old/new sizes
      // briefly report four columns and remove it.
      const label = 'Cell 90'
      const input = screen.getByRole('textbox', {
        name: label,
      }) as HTMLInputElement
      input.value = 'unsaved draft'
      for (const nextWidth of [1392, 1388, 1400]) {
        width = nextWidth
        if (windowResize !== false) {
          fireEvent.resize(window)
        }
        if (windowResize === 'before observer') {
          flushFrames()
        }
        resize()
        expect(screen.getByRole('textbox', { name: label })).toBe(input)
        expect(input.value).toBe('unsaved draft')
      }
    } finally {
      unmount?.()
      flushFrames()
      global.ResizeObserver = originalObserver
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: originalY,
      })
      styles.mockRestore()
      rectangle.mockRestore()
      offsetParent.mockRestore()
      raf.mockRestore()
      scrollTo.mockRestore()
    }
  }
)
