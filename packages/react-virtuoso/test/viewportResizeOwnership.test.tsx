import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import useWindowViewportRectRef from '../src/hooks/useWindowViewportRect'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// The list sits 100px from the top. Measured against parent a it is 80px down, against b 50px.
const OFFSET_IN_A = 80

function setup() {
  const observers: { callback: ResizeObserverCallback; observe: ReturnType<typeof vi.fn> }[] = []
  const frames = new Map<number, FrameRequestCallback>()
  let frameId = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, observe: this.observe })
      }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
  )
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      frames.set(++frameId, callback)
      return frameId
    })
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  const a = document.createElement('div')
  const b = document.createElement('div')
  const list = document.createElement('div')
  Object.defineProperty(list, 'offsetParent', { configurable: true, value: document.body })
  list.getBoundingClientRect = () => ({ top: 100, height: 1000, width: 200 }) as DOMRect
  a.getBoundingClientRect = () => ({ top: 20, height: 500 }) as DOMRect
  b.getBoundingClientRect = () => ({ top: 50, height: 300 }) as DOMRect
  const callback = vi.fn()
  const hook = renderHook(({ parent }: { parent: HTMLElement | undefined }) => useWindowViewportRectRef(callback, parent, false), {
    initialProps: { parent: a as HTMLElement | undefined },
  })
  act(() => hook.result.current(list))
  const observing = (element: HTMLElement) =>
    observers.find((observer) => observer.observe.mock.calls.some(([target]) => target === element))!
  const parentObserver = observing(a)
  const listObserver = observing(list)
  const notifyParent = () => act(() => parentObserver.callback([], {} as ResizeObserver))
  const notifyList = () => act(() => listObserver.callback([{ target: list } as unknown as ResizeObserverEntry], {} as ResizeObserver))
  const flush = () =>
    act(() => {
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((frame) => frame(16))
    })
  // React detaches the old callback ref and attaches the new one when the ref function changes, and detaches it on unmount.
  const switchTo = (parent: HTMLElement | undefined) => {
    const previousRef = hook.result.current
    hook.rerender({ parent })
    act(() => {
      previousRef(null)
      hook.result.current(list)
    })
  }
  const unmount = () => {
    act(() => hook.result.current(null))
    hook.unmount()
    Object.defineProperty(list, 'offsetParent', { value: null })
  }
  return { b, callback, flush, notifyList, notifyParent, switchTo, unmount }
}

const reportedOffsets = (callback: ReturnType<typeof vi.fn>) =>
  callback.mock.calls.map(([info]) => (info as { offsetTop: number }).offsetTop)

describe('viewport measurements queued before a scroll parent change', () => {
  it.each(['parent', 'list'] as const)('do not report the old parent when queued by the %s observer', (source) => {
    const hook = setup()
    if (source === 'parent') {
      hook.notifyParent()
    } else {
      hook.notifyList()
    }
    hook.switchTo(hook.b)
    hook.callback.mockClear()
    hook.flush()
    expect(reportedOffsets(hook.callback)).not.toContain(OFFSET_IN_A)
  })

  it('do not report the old parent when its observer delivers late', () => {
    const hook = setup()
    hook.switchTo(hook.b)
    hook.notifyParent()
    hook.callback.mockClear()
    hook.flush()
    expect(reportedOffsets(hook.callback)).not.toContain(OFFSET_IN_A)
  })

  it('do not report the old parent after switching to window scrolling', () => {
    const hook = setup()
    hook.notifyParent()
    hook.notifyList()
    hook.switchTo(undefined)
    hook.callback.mockClear()
    hook.flush()
    expect(reportedOffsets(hook.callback)).not.toContain(OFFSET_IN_A)
  })

  it('report nothing after unmount', () => {
    const hook = setup()
    hook.notifyParent()
    hook.notifyList()
    hook.unmount()
    hook.callback.mockClear()
    hook.flush()
    expect(hook.callback).not.toHaveBeenCalled()
  })

  it('report the current parent on the scheduled frame', () => {
    const hook = setup()
    hook.notifyParent()
    expect(hook.callback).not.toHaveBeenCalled()
    hook.flush()
    expect(hook.callback).toHaveBeenCalledWith({
      listHeight: 1000,
      offsetTop: OFFSET_IN_A,
      visibleHeight: 420,
      visibleWidth: 200,
      zoomRatio: 1,
    })
  })
})
