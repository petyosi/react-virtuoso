import { describe, expect, it, vi } from 'vitest'

import { e, Engine, Stream } from '../index'

import type { SwitchMapPromiseResult } from '../index'

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

// Settles every pending Promise reaction, however many microtask hops the work chain has.
async function flushPromise() {
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

function setup<TInput>(options?: Parameters<typeof e.coalescePromise<TInput, string>>[1]) {
  const source$ = Stream<TInput>(false)
  const started: { input: TInput; request: Deferred<string>; signal: AbortSignal }[] = []
  let running = 0
  let maxRunning = 0
  const result$ = e.pipe(
    source$,
    e.coalescePromise((input: TInput, signal) => {
      const request = deferred<string>()
      started.push({ input, request, signal })
      running += 1
      maxRunning = Math.max(maxRunning, running)
      return request.promise.finally(() => {
        running -= 1
      })
    }, options)
  )
  const history: SwitchMapPromiseResult<TInput, string>[] = []
  e.sub(result$, (result) => history.push(result))
  const engine = new Engine()
  return { engine, history, maxRunning: () => maxRunning, source$, started }
}

describe('coalescePromise operator', () => {
  it('sends the first and newest input in order, one at a time (CX-1)', async () => {
    const { engine, history, maxRunning, source$, started } = setup<string>()

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    engine.pub(source$, 'C')

    expect(started.map((s) => s.input)).toEqual(['A'])
    started[0]?.request.resolve('a')
    await flushPromise()

    expect(started.map((s) => s.input)).toEqual(['A', 'C'])
    started[1]?.request.resolve('c')
    await flushPromise()

    expect(history).toEqual([
      { input: 'A', status: 'success', value: 'a' },
      { input: 'C', status: 'success', value: 'c' },
    ])
    expect(maxRunning()).toBe(1)
  })

  it('starts the waiting input after the running one fails (CX-2)', async () => {
    const { engine, history, source$, started } = setup<string>()
    const error = new Error('failed')

    engine.pub(source$, 'A')
    engine.pub(source$, 'C')
    started[0]?.request.reject(error)
    await flushPromise()
    started[1]?.request.resolve('c')
    await flushPromise()

    expect(history).toEqual([
      { error, input: 'A', status: 'error' },
      { input: 'C', status: 'success', value: 'c' },
    ])
  })

  it('starts the waiting input after a synchronous project throw', () => {
    const source$ = Stream<string>(false)
    const calls: string[] = []
    const result$ = e.pipe(
      source$,
      e.coalescePromise<string, never>((input) => {
        calls.push(input)
        throw new Error(input)
      })
    )
    const history: SwitchMapPromiseResult<string, never>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')

    expect(calls).toEqual(['A', 'B'])
    expect(history.map((r) => r.status)).toEqual(['error', 'error'])
  })

  it('starts immediately again once idle', async () => {
    const { engine, source$, started } = setup<string>()

    engine.pub(source$, 'A')
    started[0]?.request.resolve('a')
    await flushPromise()
    engine.pub(source$, 'B')

    expect(started.map((s) => s.input)).toEqual(['A', 'B'])
  })

  it('does not abort the running work when a newer input arrives', () => {
    const { engine, source$, started } = setup<string>()

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')

    expect(started[0]?.signal.aborted).toBe(false)
  })

  it('keeps an input published by a result subscriber behind the waiting input', async () => {
    const source$ = Stream<string>(false)
    const started: { input: string; request: Deferred<string> }[] = []
    const result$ = e.pipe(
      source$,
      e.coalescePromise((input: string) => {
        const request = deferred<string>()
        started.push({ input, request })
        return request.promise
      })
    )
    const engine = new Engine()
    engine.sub(result$, (result) => {
      if (result.input === 'A') {
        engine.pub(source$, 'D')
      }
    })

    engine.pub(source$, 'A')
    engine.pub(source$, 'C')
    started[0]?.request.resolve('a')
    await flushPromise()

    // D arrived while C was still waiting, so it replaced C before C could start.
    expect(started.map((s) => s.input)).toEqual(['A', 'D'])
  })

  it('isolates keys (CX-4)', async () => {
    const { engine, history, source$, started } = setup<{ id: string; v: number }>({ key: (input) => input.id })

    engine.pub(source$, { id: 'a', v: 1 })
    engine.pub(source$, { id: 'b', v: 1 })
    engine.pub(source$, { id: 'a', v: 2 })
    engine.pub(source$, { id: 'a', v: 3 })
    engine.pub(source$, { id: 'b', v: 2 })

    expect(started.map((s) => s.input)).toEqual([
      { id: 'a', v: 1 },
      { id: 'b', v: 1 },
    ])

    started[1]?.request.resolve('b1')
    await flushPromise()
    expect(started.map((s) => s.input)).toEqual([
      { id: 'a', v: 1 },
      { id: 'b', v: 1 },
      { id: 'b', v: 2 },
    ])

    started[0]?.request.resolve('a1')
    await flushPromise()
    expect(started[3]?.input).toEqual({ id: 'a', v: 3 })
    expect(started.every((s) => !s.signal.aborted)).toBe(true)
    expect(history.map((r) => r.input)).toEqual([
      { id: 'b', v: 1 },
      { id: 'a', v: 1 },
    ])
  })

  it('merges waiting partial updates (CX-12)', async () => {
    type Patch = { id: string } & Record<string, unknown>
    const merge = vi.fn((waiting: Patch, next: Patch) => ({ ...waiting, ...next }))
    const { engine, history, source$, started } = setup<Patch>({ key: (input) => input.id, merge })

    engine.pub(source$, { a: 1, id: 'x' })
    engine.pub(source$, { b: 2, id: 'x' })
    engine.pub(source$, { c: 3, id: 'x' })
    engine.pub(source$, { id: 'y', z: 1 })
    started[0]?.request.resolve('first')
    await flushPromise()
    started[2]?.request.resolve('second')
    await flushPromise()

    expect(started.map((s) => s.input)).toEqual([
      { a: 1, id: 'x' },
      { id: 'y', z: 1 },
      { b: 2, c: 3, id: 'x' },
    ])
    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge).toHaveBeenCalledWith({ b: 2, id: 'x' }, { c: 3, id: 'x' })
    expect(history.at(-1)).toEqual({ input: { b: 2, c: 3, id: 'x' }, status: 'success', value: 'second' })
  })

  it('aborts running work, drops waiting inputs, and emits nothing after disposal (CX-5)', async () => {
    const { engine, history, source$, started } = setup<{ id: string }>({ key: (input) => input.id })

    engine.pub(source$, { id: 'a' })
    engine.pub(source$, { id: 'b' })
    engine.pub(source$, { id: 'a' })

    engine.dispose()
    started[0]?.request.resolve('late')
    started[1]?.request.resolve('late')
    await flushPromise()

    expect(started).toHaveLength(2)
    expect(started.every((s) => s.signal.aborted)).toBe(true)
    expect(history).toEqual([])
  })

  it('keeps work independent across engines', () => {
    const source$ = Stream<string>(false)
    const started: { input: string; request: Deferred<string> }[] = []
    const result$ = e.pipe(
      source$,
      e.coalescePromise((input: string) => {
        const request = deferred<string>()
        started.push({ input, request })
        return request.promise
      })
    )
    const first = new Engine()
    const second = new Engine()
    first.sub(result$, () => undefined)
    second.sub(result$, () => undefined)

    first.pub(source$, 'first')
    second.pub(source$, 'second')

    expect(started.map((s) => s.input)).toEqual(['first', 'second'])
  })
})
