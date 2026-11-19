import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import useWindowViewportRectRef from '../src/hooks/useWindowViewportRect'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function setup() {
  const observers: { callback: ResizeObserverCallback; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = []
  const frames = new Map<number, FrameRequestCallback>()
  let frameId = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, observe: this.observe, disconnect: this.disconnect })
      }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
  )
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    frames.set(++frameId, callback)
    return frameId
  })
  const cancelFrame = vi.fn()
  vi.stubGlobal('requestAnimationFrame', requestFrame)
  vi.stubGlobal('cancelAnimationFrame', cancelFrame)
  const a = document.createElement('div')
  const b = document.createElement('div')
  const list = document.createElement('div')
  Object.defineProperty(list, 'offsetParent', { value: document.body })
  list.getBoundingClientRect = () => ({ top: 100, height: 1000, width: 200 }) as DOMRect
  a.getBoundingClientRect = () => ({ top: 0, height: 500 }) as DOMRect
  b.getBoundingClientRect = () => ({ top: 50, height: 300 }) as DOMRect
  const callback = vi.fn()
  const hook = renderHook(({ parent }: { parent: HTMLElement | undefined }) => useWindowViewportRectRef(callback, parent, true), {
    initialProps: { parent: a as HTMLElement | undefined },
  })
  act(() => hook.result.current(list))
  const parentObserver = observers.find((observer) => observer.observe.mock.calls.some(([element]) => element === a))!
  const notify = () => act(() => parentObserver.callback([], {} as ResizeObserver))
  const flush = () =>
    act(() => {
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((frame) => frame(16))
    })
  return { ...hook, a, b, callback, cancelFrame, flush, frames, notify, parentObserver, requestFrame }
}

describe('viewport resize callback ownership', () => {
  it.each(['parent', 'window', 'unmount'])('does not report an old custom parent after switching to %s', (next) => {
    const hook = setup()
    hook.notify()
    hook.notify()
    const ids = [...hook.frames.keys()]
    if (next === 'unmount') {
      hook.unmount()
    } else {
      hook.rerender({ parent: next === 'parent' ? hook.b : undefined })
    }
    hook.callback.mockClear()
    hook.flush()
    expect(hook.callback).not.toHaveBeenCalled()
    expect(hook.parentObserver.disconnect).toHaveBeenCalledOnce()
    ids.forEach((id) => expect(hook.cancelFrame).toHaveBeenCalledWith(id))
  })

  it('reports current parent measurements on the scheduled frame', () => {
    const hook = setup()
    hook.notify()
    expect(hook.callback).not.toHaveBeenCalled()
    hook.flush()
    expect(hook.callback).toHaveBeenCalledWith({ listHeight: 1000, offsetTop: 100, visibleHeight: 400, visibleWidth: 200, zoomRatio: 1 })
    hook.unmount()
    expect(hook.cancelFrame).not.toHaveBeenCalled()
  })

  it('ignores a delivery from an observer whose parent has been detached', () => {
    const hook = setup()
    hook.rerender({ parent: hook.b })
    hook.requestFrame.mockClear()
    hook.notify()
    expect(hook.requestFrame).not.toHaveBeenCalled()
  })
})
