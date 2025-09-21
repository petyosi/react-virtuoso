import { beforeEach, describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory, testErrors, waitForMicrotask } from '../../testUtils'

describe('handlePromise operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  // Basic functionality
  it('emits loading state immediately', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        (error) => `error: ${(error as Error).message}`
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    const promise = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('success')
      }, 10)
    })

    eng.pub(source, promise)
    await promise
    expect(history[0]).toBe('loading')
  })

  it('emits success value when promise resolves', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => `resolved: ${value}`,
        (error) => `error: ${(error as Error).message}`
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.resolve('test-value'))

    await waitForMicrotask()
    expect(history).toContain('resolved: test-value')
  })

  it('emits error value when promise rejects', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        (error) => `error: ${(error as Error).message}`
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.reject(testErrors.simple))

    await waitForMicrotask()
    expect(history).toContain('error: Test error')
  })

  it('handles non-promise values as immediate success', () => {
    const source = Stream<Promise<string> | string>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => `success: ${value}`,
        () => 'error'
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, 'immediate-value')
    expect(history).toEqual(['success: immediate-value'])
  })

  // Promise lifecycle
  it('handles promises that resolve immediately', async () => {
    const source = Stream<Promise<number>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        () => 'error'
      )
    )

    const { history, spy } = createSpyWithHistory<number | string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.resolve(42))

    expect(history[0]).toBe('loading')
    await waitForMicrotask()
    expect(history[1]).toBe(42)
  })

  it('handles promises that reject immediately', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        (error) => `rejected: ${(error as Error).message}`
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.reject(testErrors.withMessage))

    expect(history[0]).toBe('loading')
    await waitForMicrotask()
    expect(history[1]).toBe('rejected: Specific test message')
  })

  it.only('handles multiple promises in sequence', async () => {
    const source = Stream<Promise<number>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => -1,
        (value) => value,
        () => -2
      )
    )

    const { history, spy } = createSpyWithHistory<number>()
    e.sub(handled, spy)

    eng.pub(source, Promise.resolve(1))
    eng.pub(source, Promise.resolve(2))

    expect(history.slice(0, 2)).toEqual([-1]) // Single loading state

    await waitForMicrotask()
    expect(history.slice(1)).toEqual([1, 2]) // Two resolved values
  })

  // Edge cases
  it('handles null/undefined values', () => {
    const source = Stream<null | undefined>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => `value: ${value}`,
        () => 'error'
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, null)
    eng.pub(source, undefined)

    expect(history).toEqual(['value: null', 'value: undefined'])
  })

  it('handles promises that resolve to null/undefined', async () => {
    const source = Stream<Promise<null | undefined>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => `resolved: ${value}`,
        () => 'error'
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.resolve(null))
    eng.pub(source, Promise.resolve(undefined))

    expect(history.slice(0, 2)).toEqual(['loading', 'loading'])

    await waitForMicrotask()
    expect(history.slice(2)).toEqual(['resolved: null', 'resolved: undefined'])
  })

  it('handles promises that reject with non-Error objects', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        (error) => `error: ${JSON.stringify(error)}`
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.reject(testErrors.customError))

    await waitForMicrotask()
    expect(history[1]).toBe('error: {"code":"CUSTOM","message":"Custom error object"}')
  })

  it('handles promises that reject with null/undefined', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        (error) => `error: ${error as Error}`
      )
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    eng.pub(source, Promise.reject(null))
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    eng.pub(source, Promise.reject(undefined))

    await waitForMicrotask()
    expect(history.slice(2)).toEqual(['error: null', 'error: undefined'])
  })

  // Type safety
  it('maintains proper typing for all three callbacks', () => {
    const source = Stream<Promise<number>>()

    // This test is mainly for TypeScript - ensuring proper typing
    const handled = e.pipe(
      source,
      e.handlePromise<number, number, string, boolean>(
        () => 'loading',
        (value: number): number => value * 2,
        (): boolean => false
      )
    )

    const { spy } = createSpyWithHistory<boolean | number | string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.resolve(21))
    expect(spy).toHaveBeenCalledWith('loading', eng)
  })

  it('works with different return types for each callback', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => ({ status: 'loading' }),
        (value) => ({ data: value, status: 'success' }),
        (error) => ({ message: (error as Error).message, status: 'error' })
      )
    )

    const { history, spy } = createSpyWithHistory()
    e.sub(handled, spy)

    eng.pub(source, Promise.resolve('test'))

    expect(history[0]).toEqual({ status: 'loading' })
    await waitForMicrotask()
    expect(history[1]).toEqual({ data: 'test', status: 'success' })
  })

  // Error handling in callbacks
  it('handles errors thrown by onLoad callback', () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => {
          throw testErrors.simple
        },
        (value) => value,
        () => 'error'
      )
    )

    const { spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    expect(() => {
      eng.pub(source, Promise.resolve('test'))
    }).not.toThrow()
  })

  it('handles errors thrown by onSuccess callback', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        () => {
          throw testErrors.simple
        },
        () => 'error'
      )
    )

    const { spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.resolve('test'))
    await waitForMicrotask()

    // Should not crash the engine
    expect(spy).toHaveBeenCalled()
  })

  it('handles errors thrown by onError callback', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        () => {
          throw testErrors.simple
        }
      )
    )

    const { spy } = createSpyWithHistory<string>()
    e.sub(handled, spy)

    eng.pub(source, Promise.reject(new Error('original')))
    await waitForMicrotask()

    // Should not crash the engine
    expect(spy).toHaveBeenCalled()
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        () => 'error'
      )
    )

    const spy1 = createSpyWithHistory<string>()
    const spy2 = createSpyWithHistory<string>()

    e.sub(handled, spy1.spy)
    e.sub(handled, spy2.spy)

    eng.pub(source, Promise.resolve('test'))

    expect(spy1.history[0]).toBe('loading')
    expect(spy2.history[0]).toBe('loading')

    await waitForMicrotask()
    expect(spy1.history[1]).toBe('test')
    expect(spy2.history[1]).toBe('test')
  })

  it('handles subscription during promise execution', async () => {
    const source = Stream<Promise<string>>()
    const handled = e.pipe(
      source,
      e.handlePromise(
        () => 'loading',
        (value) => value,
        () => 'error'
      )
    )

    const spy1 = createSpyWithHistory<string>()
    e.sub(handled, spy1.spy)

    const promise = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('delayed')
      }, 5)
    })

    eng.pub(source, promise)
    expect(spy1.history[0]).toBe('loading')

    // Subscribe after promise starts but before resolution
    const spy2 = createSpyWithHistory<string>()
    e.sub(handled, spy2.spy)

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(spy1.history[1]).toBe('delayed')
    expect(spy2.callCount()).toBeGreaterThan(0) // Should receive subsequent emissions
  })
})
