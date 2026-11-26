import { Cell, Engine } from '@virtuoso.dev/reactive-engine-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Mutation } from './Mutation'
import { executeWithRetry } from './utils'

import type { MutationResult } from './types'

interface Deferred<T> {
  promise: Promise<T>
  reject: (error: unknown) => void
  resolve: (value: T) => void
}

function deferred<T>(): Deferred<T> {
  let resolveDeferred!: (value: T) => void
  let rejectDeferred!: (error: unknown) => void
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve
    rejectDeferred = reject
  })
  return { promise, reject: rejectDeferred, resolve: resolveDeferred }
}

// Settles every pending Promise reaction, however many microtask hops the retry wrapper adds.
async function flushPromise() {
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

interface Params {
  id: string
  patch: Record<string, number>
}

function setup(options: Omit<Parameters<typeof Mutation<Params, string>>[0], 'mutationFn'> = {}) {
  const calls: { params: Params; request: Deferred<string>; signal: AbortSignal }[] = []
  const mutation = Mutation<Params, string>({
    ...options,
    mutationFn: (params, signal) => {
      const request = deferred<string>()
      calls.push({ params, request, signal })
      return request.promise
    },
  })
  const engine = new Engine()
  const results: MutationResult<string, Params>[] = []
  const counts: number[] = []
  engine.sub(mutation.data$, (result) => results.push(result))
  engine.sub(mutation.pendingCount$, (count) => counts.push(count))
  return { calls, counts, engine, mutation, results }
}

const p = (id: string, patch: Record<string, number> = {}): Params => ({ id, patch })

describe('Mutation concurrency', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('coalesces per record, passes a signal, and includes params in every result (CX-6)', async () => {
    const { calls, engine, mutation, results } = setup({ concurrency: 'coalesce', key: ({ id }) => id })

    engine.pub(mutation.mutate$, p('x', { v: 1 }))
    engine.pub(mutation.mutate$, p('x', { v: 2 }))
    engine.pub(mutation.mutate$, p('x', { v: 3 }))
    engine.pub(mutation.mutate$, p('y', { v: 1 }))

    expect(calls.map((c) => c.params)).toEqual([p('x', { v: 1 }), p('y', { v: 1 })])
    expect(calls.every((c) => c.signal instanceof AbortSignal)).toBe(true)

    calls[0]?.request.resolve('x1')
    await flushPromise()
    expect(calls[2]?.params).toEqual(p('x', { v: 3 }))

    calls[1]?.request.reject(new Error('y failed'))
    calls[2]?.request.resolve('x3')
    await flushPromise()

    expect(calls).toHaveLength(3)
    expect(results.map((r) => [r.type, r.type === 'idle' ? null : r.params])).toEqual([
      ['pending', p('x', { v: 1 })],
      ['pending', p('y', { v: 1 })],
      ['success', p('x', { v: 1 })],
      ['pending', p('x', { v: 3 })],
      ['error', p('y', { v: 1 })],
      ['success', p('x', { v: 3 })],
    ])
  })

  it('runs serial calls one at a time in order', async () => {
    const { calls, engine, mutation, results } = setup({ concurrency: 'serial' })

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))
    expect(calls).toHaveLength(1)
    calls[0]?.request.resolve('a')
    await flushPromise()
    calls[1]?.request.resolve('b')
    await flushPromise()

    expect(results.filter((r) => r.type === 'success').map((r) => r.data)).toEqual(['a', 'b'])
  })

  it('aborts a superseded call under switch and never reports it (CX-7)', async () => {
    const onSuccess = vi.fn()
    const { calls, engine, mutation, results } = setup({ concurrency: 'switch', onSuccess })

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))

    expect(calls[0]?.signal.aborted).toBe(true)
    calls[0]?.request.resolve('stale')
    calls[1]?.request.resolve('current')
    await flushPromise()

    expect(results.filter((r) => r.type === 'success').map((r) => r.data)).toEqual(['current'])
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('current', p('b'), engine)
  })

  it('stops retrying a call superseded during its retry delay (CX-7)', async () => {
    vi.useFakeTimers()
    const attempts: string[] = []
    const onError = vi.fn()
    const mutation = Mutation<Params, string>({
      concurrency: 'switch',
      mutationFn: (params) => {
        attempts.push(params.id)
        return params.id === 'a' ? Promise.reject(new Error('a failed')) : Promise.resolve('b')
      },
      onError,
      retry: 3,
      retryDelay: () => 1000,
    })
    const engine = new Engine()
    engine.sub(mutation.data$, () => undefined)

    engine.pub(mutation.mutate$, p('a'))
    await vi.advanceTimersByTimeAsync(0)
    expect(attempts).toEqual(['a'])

    engine.pub(mutation.mutate$, p('b'))
    await vi.advanceTimersByTimeAsync(5000)

    expect(attempts).toEqual(['a', 'b'])
    expect(onError).not.toHaveBeenCalled()
    expect(engine.getValue(mutation.data$)).toMatchObject({ data: 'b', type: 'success' })
  })

  it('reset aborts running calls, drops waiting ones, and stays idle (CX-8)', async () => {
    for (const concurrency of ['parallel', 'serial', 'coalesce', 'switch'] as const) {
      const onSuccess = vi.fn()
      const { calls, counts, engine, mutation } = setup({ concurrency, onSuccess })

      engine.pub(mutation.mutate$, p('a'))
      engine.pub(mutation.mutate$, p('b'))
      const startedBeforeReset = calls.length
      engine.pub(mutation.reset$)
      for (const call of calls) {
        call.request.resolve('late')
      }
      // oxlint-disable-next-line no-await-in-loop
      await flushPromise()

      expect(calls).toHaveLength(startedBeforeReset)
      expect(
        calls.every((c) => c.signal.aborted),
        concurrency
      ).toBe(true)
      expect(engine.getValue(mutation.data$).type, concurrency).toBe('idle')
      expect(engine.getValue(mutation.pendingCount$), concurrency).toBe(0)
      expect(counts.at(-1), concurrency).toBe(0)
      expect(onSuccess, concurrency).not.toHaveBeenCalled()
    }
  })

  it('lets callbacks publish back into the engine with matching params (CX-9)', async () => {
    const confirmed$ = Cell<Record<string, string>>({})
    const failed$ = Cell<string[]>([])
    const mutation = Mutation<Params, string>({
      concurrency: 'coalesce',
      key: ({ id }) => id,
      mutationFn: ({ id }) => (id === 'bad' ? Promise.reject(new Error('nope')) : Promise.resolve(`saved ${id}`)),
      onError: (_error, params, engine) => {
        engine.pub(failed$, [...engine.getValue(failed$), params.id])
      },
      onSuccess: (data, params, engine) => {
        engine.pub(confirmed$, { ...engine.getValue(confirmed$), [params.id]: data })
      },
    })
    const engine = new Engine()

    engine.pub(mutation.mutate$, p('x'))
    engine.pub(mutation.mutate$, p('bad'))
    await flushPromise()

    expect(engine.getValue(confirmed$)).toEqual({ x: 'saved x' })
    expect(engine.getValue(failed$)).toEqual(['bad'])
  })

  it('keeps the pending count accurate under overlap (CX-11)', async () => {
    const { calls, counts, engine, mutation } = setup()
    const countAtResult: [string, number][] = []
    engine.sub(mutation.data$, (result) => countAtResult.push([result.type, engine.getValue(mutation.pendingCount$)]))

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))
    calls[0]?.request.resolve('a')
    await flushPromise()

    // The first call succeeded while the second still runs.
    expect(engine.getValue(mutation.data$)).toMatchObject({ isPending: false, type: 'success' })
    expect(engine.getValue(mutation.pendingCount$)).toBe(1)

    calls[1]?.request.resolve('b')
    await flushPromise()

    expect(counts).toEqual([1, 2, 1, 0])
    expect(countAtResult).toEqual([
      ['pending', 1],
      ['pending', 2],
      ['success', 1],
      ['success', 0],
    ])
  })

  it('does not count a call that coalesces into a waiting one (CX-11)', async () => {
    const { calls, counts, engine, mutation } = setup({ concurrency: 'coalesce' })

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))
    engine.pub(mutation.mutate$, p('c'))
    calls[0]?.request.resolve('a')
    await flushPromise()
    calls[1]?.request.resolve('c')
    await flushPromise()

    expect(counts).toEqual([1, 2, 1, 0])
  })

  it('counts every waiting call under serial and switch supersession (CX-11)', () => {
    const serial = setup({ concurrency: 'serial' })
    serial.engine.pub(serial.mutation.mutate$, p('a'))
    serial.engine.pub(serial.mutation.mutate$, p('b'))
    serial.engine.pub(serial.mutation.mutate$, p('c'))
    expect(serial.counts).toEqual([1, 2, 3])

    const switching = setup({ concurrency: 'switch' })
    switching.engine.pub(switching.mutation.mutate$, p('a'))
    switching.engine.pub(switching.mutation.mutate$, p('b'))
    expect(switching.counts).toEqual([1])
  })

  it('merges waiting partial patches under coalesce (CX-12)', async () => {
    const { calls, engine, mutation, results } = setup({
      concurrency: 'coalesce',
      key: ({ id }) => id,
      merge: (waiting, next) => ({ id: next.id, patch: { ...waiting.patch, ...next.patch } }),
    })

    engine.pub(mutation.mutate$, p('x', { a: 1 }))
    engine.pub(mutation.mutate$, p('x', { b: 2 }))
    engine.pub(mutation.mutate$, p('x', { c: 3 }))
    calls[0]?.request.resolve('first')
    await flushPromise()
    calls[1]?.request.resolve('second')
    await flushPromise()

    expect(calls.map((c) => c.params)).toEqual([p('x', { a: 1 }), p('x', { b: 2, c: 3 })])
    expect(results.at(-1)).toMatchObject({ params: p('x', { b: 2, c: 3 }), type: 'success' })
  })

  it('keeps parallel as the default, with results in completion order', async () => {
    const { calls, engine, mutation, results } = setup()

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))
    expect(calls).toHaveLength(2)
    calls[1]?.request.resolve('b')
    await flushPromise()
    calls[0]?.request.resolve('a')
    await flushPromise()

    expect(results.filter((r) => r.type === 'success').map((r) => (r.type === 'success' ? r.params.id : null))).toEqual(['b', 'a'])
  })

  it('aborts running calls when the engine is disposed', () => {
    const { calls, engine, mutation } = setup({ concurrency: 'serial' })

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))
    engine.dispose()

    expect(calls).toHaveLength(1)
    expect(calls[0]?.signal.aborted).toBe(true)
  })
})

describe('executeWithRetry', () => {
  it('rejects with an abort error and stops retrying once the signal aborts', async () => {
    const controller = new AbortController()
    let attempts = 0
    const run = executeWithRetry(
      () => {
        attempts += 1
        controller.abort()
        return Promise.reject(new Error('failed'))
      },
      { retry: 3, retryDelay: () => 0, signal: controller.signal }
    )

    await expect(run).rejects.toThrow('Aborted')
    expect(attempts).toBe(1)
  })
})
