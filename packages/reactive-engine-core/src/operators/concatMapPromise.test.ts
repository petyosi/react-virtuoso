import { describe, expect, it } from 'vitest'

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

function setup<TInput>(options?: Parameters<typeof e.concatMapPromise<TInput, string>>[1]) {
  const source$ = Stream<TInput>(false)
  const started: { input: TInput; request: Deferred<string>; signal: AbortSignal }[] = []
  const result$ = e.pipe(
    source$,
    e.concatMapPromise((input: TInput, signal) => {
      const request = deferred<string>()
      started.push({ input, request, signal })
      return request.promise
    }, options)
  )
  const history: SwitchMapPromiseResult<TInput, string>[] = []
  e.sub(result$, (result) => history.push(result))
  const engine = new Engine()
  return { engine, history, source$, started }
}

describe('concatMapPromise operator', () => {
  it('runs every input one at a time in arrival order (CX-3)', async () => {
    const { engine, history, source$, started } = setup<string>()

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    engine.pub(source$, 'C')
    expect(started.map((s) => s.input)).toEqual(['A'])

    started[0]?.request.resolve('a')
    await flushPromise()
    expect(started.map((s) => s.input)).toEqual(['A', 'B'])

    started[1]?.request.reject(new Error('b'))
    await flushPromise()
    expect(started.map((s) => s.input)).toEqual(['A', 'B', 'C'])

    started[2]?.request.resolve('c')
    await flushPromise()

    expect(history.map((r) => [r.input, r.status])).toEqual([
      ['A', 'success'],
      ['B', 'error'],
      ['C', 'success'],
    ])
    expect(started.every((s) => !s.signal.aborted)).toBe(true)
  })

  it('keeps arrival order even when queued work would resolve faster', async () => {
    const source$ = Stream<string>(false)
    const work = new Map<string, Deferred<string>>()
    const result$ = e.pipe(
      source$,
      e.concatMapPromise((input: string) => {
        const request = deferred<string>()
        work.set(input, request)
        return request.promise
      })
    )
    const history: string[] = []
    e.sub(result$, (result) => history.push(result.input))
    const engine = new Engine()

    engine.pub(source$, 'slow')
    engine.pub(source$, 'fast')
    work.get('slow')?.resolve('slow')
    await flushPromise()
    // 'fast' started only after 'slow' settled, so it cannot overtake it.
    work.get('fast')?.resolve('fast')
    await flushPromise()

    expect(history).toEqual(['slow', 'fast'])
  })

  it('keeps a separate queue per key (CX-4)', async () => {
    const { engine, history, source$, started } = setup<{ id: string; v: number }>({ key: (input) => input.id })

    engine.pub(source$, { id: 'a', v: 1 })
    engine.pub(source$, { id: 'a', v: 2 })
    engine.pub(source$, { id: 'b', v: 1 })
    expect(started.map((s) => s.input)).toEqual([
      { id: 'a', v: 1 },
      { id: 'b', v: 1 },
    ])

    started[1]?.request.resolve('b1')
    started[0]?.request.resolve('a1')
    await flushPromise()
    expect(started[2]?.input).toEqual({ id: 'a', v: 2 })
    expect(history.map((r) => r.input)).toEqual([
      { id: 'b', v: 1 },
      { id: 'a', v: 1 },
    ])
  })

  it('aborts running work and never starts queued work after disposal (CX-5)', async () => {
    const { engine, history, source$, started } = setup<{ id: string }>({ key: (input) => input.id })

    engine.pub(source$, { id: 'a' })
    engine.pub(source$, { id: 'a' })
    engine.pub(source$, { id: 'b' })

    engine.dispose()
    for (const s of started) {
      s.request.resolve('late')
    }
    await flushPromise()

    expect(started).toHaveLength(2)
    expect(started.every((s) => s.signal.aborted)).toBe(true)
    expect(history).toEqual([])
  })
  it('drains a long queue of synchronously failing work without overflowing the stack', async () => {
    const source$ = Stream<number>(false)
    const first = deferred<number>()
    const result$ = e.pipe(
      source$,
      e.concatMapPromise((input: number) => {
        if (input === 0) {
          return first.promise
        }
        throw new Error(`sync ${input}`)
      })
    )
    const inputs: number[] = []
    e.sub(result$, (result) => inputs.push(result.input))
    const engine = new Engine()
    const total = 5000

    for (let i = 0; i < total; i++) {
      engine.pub(source$, i)
    }
    first.resolve(0)
    await flushPromise()

    expect(inputs).toHaveLength(total)
    expect(inputs.every((input, index) => input === index)).toBe(true)
  })

  it('keeps draining when a result subscriber throws, then rethrows the first error', () => {
    const source$ = Stream<number>(false)
    const result$ = e.pipe(
      source$,
      e.concatMapPromise<number, never>((input) => {
        throw new Error(`sync ${input}`)
      })
    )
    const inputs: number[] = []
    const engine = new Engine()
    engine.sub(result$, (result) => {
      inputs.push(result.input)
      if (result.input === 0) {
        throw new Error('subscriber failed')
      }
    })

    expect(() => {
      engine.pub(source$, 0)
    }).toThrow('subscriber failed')
    engine.pub(source$, 1)

    expect(inputs).toEqual([0, 1])
  })
})
