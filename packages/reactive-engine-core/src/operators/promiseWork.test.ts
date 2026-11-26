import { describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../index'

import type { PromiseWorkEvent, PromiseWorkPolicy } from '../index'

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

async function flushPromise() {
  await Promise.resolve()
  await Promise.resolve()
}

function setup(policy: PromiseWorkPolicy) {
  const source$ = Stream<string>(false)
  const cancel$ = Stream<void>(false)
  const started: { input: string; request: Deferred<string>; signal: AbortSignal }[] = []
  const events$ = e.pipe(
    source$,
    e.promiseWork<string, string>(
      (input, signal) => {
        const request = deferred<string>()
        started.push({ input, request, signal })
        return request.promise
      },
      { cancel$, policy }
    )
  )
  const log: PromiseWorkEvent<string, string>[] = []
  const engine = new Engine()
  engine.sub(events$, (event) => log.push(event))
  const counts = () => log.map((event) => event.pendingCount)
  return { cancel$, counts, engine, log, source$, started }
}

describe('promiseWork operator', () => {
  it('reports start, queue, and settle events, each with its pending count', async () => {
    const { counts, engine, log, source$, started } = setup('coalesce')

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    engine.pub(source$, 'C')
    started[0]?.request.resolve('a')
    await flushPromise()
    started[1]?.request.resolve('c')
    await flushPromise()

    expect(log).toEqual([
      { input: 'A', pendingCount: 1, type: 'start' },
      { pendingCount: 2, type: 'queue' },
      // C replaced the waiting B without changing the count.
      { pendingCount: 2, type: 'queue' },
      { pendingCount: 1, result: { input: 'A', status: 'success', value: 'a' }, type: 'settle' },
      { input: 'C', pendingCount: 1, type: 'start' },
      { pendingCount: 0, result: { input: 'C', status: 'success', value: 'c' }, type: 'settle' },
    ])
    expect(counts()).toEqual([1, 2, 2, 1, 1, 0])
  })

  it('counts every waiting input under the serial policy', () => {
    const { counts, engine, source$ } = setup('serial')

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    engine.pub(source$, 'C')

    expect(counts()).toEqual([1, 2, 3])
  })

  it('keeps the count unchanged when switch supersedes running work', () => {
    const { counts, engine, log, source$, started } = setup('switch')

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')

    expect(counts()).toEqual([1, 1])
    expect(started[0]?.signal.aborted).toBe(true)
    expect(log.map((event) => event.type)).toEqual(['start', 'start'])
  })

  it('cancels running and waiting work, then aborts it', async () => {
    const { cancel$, engine, log, source$, started } = setup('serial')

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    engine.pub(cancel$)
    started[0]?.request.resolve('late')
    await flushPromise()

    expect(started).toHaveLength(1)
    expect(started[0]?.signal.aborted).toBe(true)
    expect(log).toEqual([
      { input: 'A', pendingCount: 1, type: 'start' },
      { pendingCount: 2, type: 'queue' },
      { pendingCount: 0, type: 'cancel' },
    ])

    engine.pub(source$, 'C')
    expect(started.map((s) => s.input)).toEqual(['A', 'C'])
  })

  it('runs parallel work concurrently and settles in completion order', async () => {
    const { engine, log, source$, started } = setup('parallel')

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    started[1]?.request.resolve('b')
    await flushPromise()
    started[0]?.request.resolve('a')
    await flushPromise()

    expect(log.map((event) => [event.type, event.pendingCount])).toEqual([
      ['start', 1],
      ['start', 2],
      ['settle', 1],
      ['settle', 0],
    ])
  })
})
