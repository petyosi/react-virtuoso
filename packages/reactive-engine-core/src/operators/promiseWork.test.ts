import { describe, expect, it, vi } from 'vitest'

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

function setup(policy: PromiseWorkPolicy, merge?: (waiting: string, next: string) => string) {
  const source$ = Stream<string>(false)
  const dropWaiting$ = Stream<void>(false)
  const started: { input: string; request: Deferred<string>; signal: AbortSignal }[] = []
  const events$ = e.pipe(
    source$,
    e.promiseWork<string, string>(
      (input, signal) => {
        const request = deferred<string>()
        started.push({ input, request, signal })
        return request.promise
      },
      merge === undefined ? { dropWaiting$, policy } : { dropWaiting$, merge, policy }
    )
  )
  const log: PromiseWorkEvent<string, string>[] = []
  const engine = new Engine()
  engine.sub(events$, (event) => log.push(event))
  const counts = () => log.map((event) => event.pendingCount)
  return { counts, dropWaiting$, engine, events$, log, source$, started }
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
      // C replaced the waiting B, which will never start. The count does not change.
      { input: 'B', pendingCount: 2, type: 'drop' },
      { pendingCount: 1, result: { input: 'A', status: 'success', value: 'a' }, type: 'settle' },
      { input: 'C', pendingCount: 1, type: 'start' },
      { pendingCount: 0, result: { input: 'C', status: 'success', value: 'c' }, type: 'settle' },
    ])
    expect(counts()).toEqual([1, 2, 2, 1, 1, 0])
  })

  it('reports a merge as a queue event, not a drop', () => {
    const { engine, log, source$ } = setup('coalesce', (waiting, next) => waiting + next)

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    engine.pub(source$, 'C')

    expect(log.map((event) => event.type)).toEqual(['start', 'queue', 'queue'])
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

  it('drops waiting work without touching running work', async () => {
    const { dropWaiting$, engine, log, source$, started } = setup('serial')

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    engine.pub(source$, 'C')
    engine.pub(dropWaiting$)
    expect(started[0]?.signal.aborted).toBe(false)

    started[0]?.request.resolve('a')
    await flushPromise()

    expect(started.map((s) => s.input)).toEqual(['A'])
    expect(log).toEqual([
      { input: 'A', pendingCount: 1, type: 'start' },
      { pendingCount: 2, type: 'queue' },
      { pendingCount: 3, type: 'queue' },
      { input: 'B', pendingCount: 1, type: 'drop' },
      { input: 'C', pendingCount: 1, type: 'drop' },
      { pendingCount: 0, result: { input: 'A', status: 'success', value: 'a' }, type: 'settle' },
    ])

    engine.pub(source$, 'D')
    expect(started.map((s) => s.input)).toEqual(['A', 'D'])
  })

  it('still runs the work, and frees the key, when a start subscriber throws', async () => {
    for (const policy of ['serial', 'coalesce', 'switch', 'parallel'] as const) {
      const { engine, events$, log, source$, started } = setup(policy)
      let throwOnce = true
      engine.sub(events$, (event) => {
        if (event.type === 'start' && throwOnce) {
          throwOnce = false
          throw new Error('subscriber failed')
        }
      })

      expect(() => {
        engine.pub(source$, 'A')
      }, policy).toThrow('subscriber failed')
      expect(
        started.map((s) => s.input),
        policy
      ).toEqual(['A'])

      started[0]?.request.resolve('a')
      // oxlint-disable-next-line no-await-in-loop
      await flushPromise()
      engine.pub(source$, 'B')
      started[1]?.request.resolve('b')
      // oxlint-disable-next-line no-await-in-loop
      await flushPromise()

      expect(
        started.map((s) => s.input),
        policy
      ).toEqual(['A', 'B'])
      expect(log.at(-1), policy).toEqual({ pendingCount: 0, result: { input: 'B', status: 'success', value: 'b' }, type: 'settle' })
    }
  })

  it('keeps draining the queue when a start subscriber throws', async () => {
    const source$ = Stream<'A' | 'B' | 'C'>(false)
    const requests = { A: deferred<string>(), B: deferred<string>(), C: deferred<string>() }
    const started: string[] = []
    const events$ = e.pipe(
      source$,
      e.promiseWork<'A' | 'B' | 'C', string>(
        (input) => {
          started.push(input)
          return requests[input].promise
        },
        { policy: 'serial' }
      )
    )
    const subscriberError = new Error('subscriber failed')
    const engine = new Engine()
    engine.sub(events$, (event) => {
      if (event.type === 'start' && event.input === 'B') {
        throw subscriberError
      }
    })
    const thenSpy = vi.spyOn(requests.A.promise, 'then')

    engine.pub(source$, 'A')
    engine.pub(source$, 'B')
    engine.pub(source$, 'C')
    // B starts while A settles, so its subscriber error surfaces from A's settlement.
    const settlement = thenSpy.mock.results[0]?.value as Promise<unknown> | undefined
    thenSpy.mockRestore()
    const surfacedError = expect(settlement).rejects.toBe(subscriberError)
    requests.A.resolve('a')
    await surfacedError
    expect(started).toEqual(['A', 'B'])

    requests.B.resolve('b')
    await flushPromise()
    expect(started).toEqual(['A', 'B', 'C'])
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
