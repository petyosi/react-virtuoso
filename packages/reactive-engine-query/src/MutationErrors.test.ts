import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConcurrentMutation } from './ConcurrentMutation'
import { Mutation } from './Mutation'
import { deferred, flushPromises, neverSettle } from './test/helpers'

import type * as Utils from './utils'

// Errors from a drain that a settling Promise started surface as unhandled rejections. This file captures each
// settlement Promise, so the test can assert the rejection instead of failing the run.
const settlements = vi.hoisted(() => [] as Promise<unknown>[])

vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof Utils>()
  return {
    ...actual,
    executeWithRetry: (...args: Parameters<typeof actual.executeWithRetry>) => {
      const promise = actual.executeWithRetry(...args)
      const originalThen = promise.then.bind(promise)
      // oxlint-disable-next-line unicorn/no-thenable -- wraps then to capture the settlement Promise the runtime creates
      promise.then = ((onFulfilled, onRejected) => {
        const settlement = originalThen(onFulfilled, onRejected)
        settlements.push(settlement)
        return settlement
      }) as typeof promise.then
      return promise
    },
  }
})

afterEach(() => {
  settlements.length = 0
  vi.restoreAllMocks()
})

describe('errors in a drain started by a settling Promise', () => {
  it('Mutation: a throwing settled$ subscriber becomes an unhandled rejection, and onSuccess still runs', async () => {
    const request = deferred<string>()
    const onSuccess = vi.fn()
    let calls = 0
    const mutation = Mutation<{ id: number }, string, number>({
      key: ({ id }) => id,
      // Later calls never settle, so the throwing subscriber does not fire again without a handler.
      mutationFn: () => {
        calls += 1
        return calls === 1 ? request.promise : new Promise<string>(neverSettle)
      },
      onSuccess,
    })
    const engine = new Engine()
    const subscriberError = new Error('settled subscriber failed')
    engine.sub(mutation.settled$, () => {
      throw subscriberError
    })

    engine.pub(mutation.mutate$, { id: 1 })
    expect(settlements).toHaveLength(1)
    const surfaced = expect(settlements[0]).rejects.toBe(subscriberError)
    request.resolve('ok')
    await surfaced
    await flushPromises()

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(engine.getValue(mutation.status$).get(1)?.type).toBe('success')
    // The record is free again.
    engine.pub(mutation.mutate$, { id: 1 })
    expect(engine.getValue(mutation.status$).get(1)?.type).toBe('pending')
  })

  it('ConcurrentMutation: a throwing settled$ subscriber becomes an unhandled rejection, and onSuccess still runs', async () => {
    const request = deferred<string>()
    const onSuccess = vi.fn()
    const mutation = ConcurrentMutation<{ id: number }, string, number>({
      concurrency: 'serial',
      key: ({ id }) => id,
      mutationFn: () => request.promise,
      onSuccess,
    })
    const engine = new Engine()
    const subscriberError = new Error('settled subscriber failed')
    engine.sub(mutation.settled$, () => {
      throw subscriberError
    })

    engine.pub(mutation.mutate$, { id: 1 })
    expect(settlements).toHaveLength(1)
    const surfaced = expect(settlements[0]).rejects.toBe(subscriberError)
    request.resolve('ok')
    await surfaced
    await flushPromises()

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(engine.getValue(mutation.status$).get(1)).toMatchObject({ isPending: false, lastSuccess: { data: 'ok' } })
  })

  it('ConcurrentMutation: a drain stopped at the cap still starts the waiting call', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const requests = [first, second]
    const started: string[] = []
    const mutation = ConcurrentMutation<{ id: number; value: string }, string, number>({
      concurrency: 'serial',
      key: ({ id }) => id,
      mutationFn: ({ value }) => {
        started.push(value)
        return (requests.shift() ?? deferred<string>()).promise
      },
    })
    const engine = new Engine()
    // A settled$ subscriber floods the queue with more no-op commands than one drain processes. The item that starts
    // the waiting call is queued behind them, so the cap discards it.
    engine.sub(mutation.settled$, (outcome) => {
      if (outcome.type === 'success' && outcome.params.value === 'a') {
        for (let index = 0; index <= 10_000; index += 1) {
          engine.pub(mutation.dropWaiting$, 2)
        }
      }
    })

    engine.pub(mutation.mutate$, { id: 1, value: 'a' })
    engine.pub(mutation.mutate$, { id: 1, value: 'b' })
    expect(engine.getValue(mutation.status$).get(1)?.waiting).toHaveLength(1)

    const surfaced = expect(settlements[0]).rejects.toThrow('more than 10000')
    first.resolve('a')
    await surfaced
    await flushPromises()

    // The discarded start is re-issued, so the record does not wait forever.
    expect(started).toEqual(['a', 'b'])
    expect(engine.getValue(mutation.status$).get(1)).toMatchObject({ running: [{ value: 'b' }], waiting: [] })
    second.resolve('b')
    await flushPromises()
    expect(engine.getValue(mutation.status$).get(1)).toMatchObject({ isPending: false, lastSuccess: { data: 'b' } })
  })
})
