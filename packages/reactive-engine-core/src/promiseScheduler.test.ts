import { describe, expect, it, vi } from 'vitest'

import { Engine } from './Engine'
import { createPromiseScheduler } from './promiseScheduler'

import type { PromiseWorkPolicy, SwitchMapPromiseResult } from './promiseScheduler'

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

type SchedulerEvent =
  | { input: string; pendingCount: number; type: 'drop' }
  | { input: string; pendingCount: number; type: 'ignore' }
  | { input: string; pendingCount: number; type: 'start' }
  | { pendingCount: number; result: SwitchMapPromiseResult<string, string>; type: 'settle' }
  | { pendingCount: number; type: 'queue' }

interface SetupOptions {
  key?: (input: string) => unknown
  merge?: (waiting: string, next: string) => string
  onEvent?: (event: SchedulerEvent) => void
}

function setup(policy: PromiseWorkPolicy, options: SetupOptions = {}) {
  const engine = new Engine()
  const started: { input: string; request: Deferred<string>; signal: AbortSignal }[] = []
  const log: SchedulerEvent[] = []
  const record = (event: SchedulerEvent) => {
    log.push(event)
    options.onEvent?.(event)
  }
  const scheduler = createPromiseScheduler<string, string>(
    engine,
    policy,
    (input, signal) => {
      const request = deferred<string>()
      started.push({ input, request, signal })
      return request.promise
    },
    { ...(options.key ? { key: options.key } : {}), ...(options.merge ? { merge: options.merge } : {}) },
    {
      onDrop: (input, pendingCount) => {
        record({ input, pendingCount, type: 'drop' })
      },
      onIgnore: (input, pendingCount) => {
        record({ input, pendingCount, type: 'ignore' })
      },
      onQueue: (pendingCount) => {
        record({ pendingCount, type: 'queue' })
      },
      onSettle: (result, pendingCount) => {
        record({ pendingCount, result, type: 'settle' })
      },
      onStart: (input, pendingCount) => {
        record({ input, pendingCount, type: 'start' })
      },
    }
  )
  return { engine, log, scheduler, started }
}

describe('createPromiseScheduler', () => {
  it('reports start, queue, drop, and settle under coalesce', async () => {
    const { log, scheduler, started } = setup('coalesce')

    scheduler.push('A')
    scheduler.push('B')
    scheduler.push('C')
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
  })

  it('reports a merge as a queue event, not a drop', () => {
    const { log, scheduler } = setup('coalesce', { merge: (waiting, next) => waiting + next })

    scheduler.push('A')
    scheduler.push('B')
    scheduler.push('C')

    expect(log.map((event) => event.type)).toEqual(['start', 'queue', 'queue'])
  })

  it('counts every waiting input under serial, and keeps the count when switch supersedes', () => {
    const serial = setup('serial')
    serial.scheduler.push('A')
    serial.scheduler.push('B')
    serial.scheduler.push('C')
    expect(serial.log.map((event) => event.pendingCount)).toEqual([1, 2, 3])

    const switching = setup('switch')
    switching.scheduler.push('A')
    switching.scheduler.push('B')
    expect(switching.log.map((event) => [event.type, event.pendingCount])).toEqual([
      ['start', 1],
      ['start', 1],
    ])
    expect(switching.started[0]?.signal.aborted).toBe(true)
  })

  it('drops waiting work without touching running work', async () => {
    const { log, scheduler, started } = setup('serial')

    scheduler.push('A')
    scheduler.push('B')
    scheduler.push('C')
    scheduler.dropWaiting()
    expect(started[0]?.signal.aborted).toBe(false)
    started[0]?.request.resolve('a')
    await flushPromise()

    expect(started.map((s) => s.input)).toEqual(['A'])
    expect(log.filter((event) => event.type === 'drop').map((event) => event.type === 'drop' && event.input)).toEqual(['B', 'C'])
    scheduler.push('D')
    expect(started.map((s) => s.input)).toEqual(['A', 'D'])
  })

  it('runs parallel work concurrently and settles in completion order', async () => {
    const { log, scheduler, started } = setup('parallel')

    scheduler.push('A')
    scheduler.push('B')
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

  it('still runs the work, and frees the key, when a start handler throws', async () => {
    for (const policy of ['serial', 'coalesce', 'switch', 'parallel', 'exhaust'] as const) {
      let throwOnce = true
      const { log, scheduler, started } = setup(policy, {
        onEvent: (event) => {
          if (event.type === 'start' && throwOnce) {
            throwOnce = false
            throw new Error('start handler failed')
          }
        },
      })

      expect(() => {
        scheduler.push('A')
      }, policy).toThrow('start handler failed')
      expect(
        started.map((s) => s.input),
        policy
      ).toEqual(['A'])

      started[0]?.request.resolve('a')
      // oxlint-disable-next-line no-await-in-loop
      await flushPromise()
      scheduler.push('B')
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

  it('keeps draining the queue when a start handler throws during a settle', async () => {
    const requests = { A: deferred<string>(), B: deferred<string>(), C: deferred<string>() }
    const started: string[] = []
    const handlerError = new Error('start handler failed')
    const scheduler = createPromiseScheduler<'A' | 'B' | 'C', string>(
      new Engine(),
      'serial',
      (input) => {
        started.push(input)
        return requests[input].promise
      },
      {},
      {
        onSettle: () => undefined,
        onStart: (input) => {
          if (input === 'B') {
            throw handlerError
          }
        },
      }
    )
    const thenSpy = vi.spyOn(requests.A.promise, 'then')

    scheduler.push('A')
    scheduler.push('B')
    scheduler.push('C')
    // B starts while A settles, so its handler error surfaces from A's settlement.
    const settlement = thenSpy.mock.results[0]?.value as Promise<unknown> | undefined
    thenSpy.mockRestore()
    const surfacedError = expect(settlement).rejects.toBe(handlerError)
    requests.A.resolve('a')
    await surfacedError
    expect(started).toEqual(['A', 'B'])

    requests.B.resolve('b')
    await flushPromise()
    expect(started).toEqual(['A', 'B', 'C'])
  })

  it('ignores inputs for a busy key under exhaust, per key, and frees the key inside the settle handler', async () => {
    const reentered: string[] = []
    const schedulerRef: { current?: { push: (input: string) => void } } = {}
    const { log, scheduler, started } = setup('exhaust', {
      key: (input) => input[0],
      onEvent: (event) => {
        if (event.type === 'settle' && event.result.input === 'a1') {
          reentered.push('a3')
          schedulerRef.current?.push('a3')
        }
      },
    })
    schedulerRef.current = scheduler

    scheduler.push('a1')
    scheduler.push('a2')
    scheduler.push('b1')
    expect(started.map((s) => s.input)).toEqual(['a1', 'b1'])
    expect(log.filter((event) => event.type === 'ignore')).toEqual([{ input: 'a2', pendingCount: 1, type: 'ignore' }])

    started[0]?.request.reject(new Error('a1 failed'))
    await flushPromise()

    // The settle handler published a3 for the same key, and it started at once.
    expect(reentered).toEqual(['a3'])
    expect(started.map((s) => s.input)).toEqual(['a1', 'b1', 'a3'])
  })
})
