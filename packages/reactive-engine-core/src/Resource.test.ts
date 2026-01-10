import { describe, expect, it, vi } from 'vitest'

import { e, Engine, Resource, Stream, withResource } from './index'

describe('Resource', () => {
  it('creates a resource and returns its value', () => {
    const counter$ = Resource(() => ({ count: 0 }))
    const engine = new Engine()
    const instance = engine.getValue(counter$)
    expect(instance.count).toBe(0)
  })

  it('passes engine to factory function', () => {
    const factory = vi.fn((eng: Engine) => ({ engineId: eng.id }))
    const res$ = Resource(factory)
    const engine = new Engine({}, 'test-engine')
    engine.getValue(res$)
    expect(factory).toHaveBeenCalledWith(engine)
  })

  it('creates only one instance per engine', () => {
    const factory = vi.fn(() => ({ id: Math.random() }))
    const res$ = Resource(factory)
    const engine = new Engine()
    const first = engine.getValue(res$)
    const second = engine.getValue(res$)
    expect(first).toBe(second)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('calls dispose on engine disposal', () => {
    const dispose = vi.fn()
    const res$ = Resource(() => ({ dispose }))
    const engine = new Engine()
    engine.getValue(res$)
    engine.dispose()
    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('can be published to like a Cell', () => {
    const res$ = Resource(() => ({ count: 0 }))
    const engine = new Engine()
    const spy = vi.fn()

    engine.sub(res$, spy)
    engine.pub(res$, { count: 42 })

    expect(spy).toHaveBeenCalledWith({ count: 42 }, engine)
    expect(engine.getValue(res$)).toEqual({ count: 42 })
  })

  it('works with changeWith', () => {
    const res$ = Resource(() => 0)
    const increment$ = Stream<number>()

    e.changeWith(res$, increment$, (current, delta) => current + delta)

    const engine = new Engine()
    engine.pub(increment$, 5)
    expect(engine.getValue(res$)).toBe(5)

    engine.pub(increment$, 3)
    expect(engine.getValue(res$)).toBe(8)
  })

  it('withResource lets streams act on resources', () => {
    const cache$ = Resource<Map<string, number>>(() => new Map())
    const input$ = Stream<[string, number]>()

    withResource(input$, cache$, ([key, value], cache) => {
      cache.set(key, value)
    })

    const engine = new Engine()
    const cache = engine.getValue(cache$)

    engine.pub(input$, ['a', 1])
    expect(cache.get('a')).toBe(1)

    engine.pub(input$, ['b', 2])
    expect(cache.get('b')).toBe(2)
    expect(cache.size).toBe(2)
  })

  it('child engine accesses parent resource', () => {
    const res$ = Resource(() => ({ value: 42 }))
    const parent = new Engine()
    parent.getValue(res$)

    const child = new Engine({}, undefined, parent)
    const instance = child.getValue(res$)
    expect(instance.value).toBe(42)
  })

  it('child engine creates own resource if not in parent', () => {
    const factory = vi.fn(() => ({ id: Math.random() }))
    const res$ = Resource(factory)

    const parent = new Engine()
    const child = new Engine({}, undefined, parent)

    const childInstance = child.getValue(res$)
    expect(factory).toHaveBeenCalledTimes(1)

    const parentInstance = parent.getValue(res$)
    expect(factory).toHaveBeenCalledTimes(2)
    expect(childInstance).not.toBe(parentInstance)
  })

  it('propagates factory errors', () => {
    const res$ = Resource(() => {
      throw new Error('Factory failed')
    })
    const engine = new Engine()
    expect(() => engine.getValue(res$)).toThrow('Factory failed')
  })

  it('propagates dispose errors', () => {
    const res$ = Resource(() => ({
      dispose() {
        throw new Error('Dispose failed')
      },
    }))
    const engine = new Engine()
    engine.getValue(res$)
    expect(() => {
      engine.dispose()
    }).toThrow('Dispose failed')
  })

  it('handles resources without dispose method', () => {
    const res$ = Resource(() => ({ value: 'no dispose' }))
    const engine = new Engine()
    engine.getValue(res$)
    expect(() => {
      engine.dispose()
    }).not.toThrow()
  })

  it('calls Symbol.dispose on engine disposal', () => {
    const disposeFn = vi.fn()
    const res$ = Resource(() => ({
      [Symbol.dispose]: disposeFn,
    }))
    const engine = new Engine()
    engine.getValue(res$)
    engine.dispose()
    expect(disposeFn).toHaveBeenCalledTimes(1)
  })

  it('prefers Symbol.dispose over dispose method', () => {
    const symbolDispose = vi.fn()
    const methodDispose = vi.fn()
    const res$ = Resource(() => ({
      dispose: methodDispose,
      [Symbol.dispose]: symbolDispose,
    }))
    const engine = new Engine()
    engine.getValue(res$)
    engine.dispose()
    expect(symbolDispose).toHaveBeenCalledTimes(1)
    expect(methodDispose).not.toHaveBeenCalled()
  })
})
