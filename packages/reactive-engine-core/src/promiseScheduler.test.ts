import { afterEach, describe, expect, it, vi } from 'vitest'

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

interface SetupOptions {
  key?: (input: string) => unknown
  merge?: (waiting: string, next: string) => string
  onSettle?: (result: SwitchMapPromiseResult<string, string>) => void
}

function setup(policy: PromiseWorkPolicy, options: SetupOptions = {}) {
  const engine = new Engine()
  const started: { input: string; request: Deferred<string>; signal: AbortSignal }[] = []
  const settled: string[] = []
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
      onSettle: (result) => {
        settled.push(`${result.status}:${result.input}`)
        options.onSettle?.(result)
      },
    }
  )
  return { engine, scheduler, settled, started }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createPromiseScheduler', () => {
  it('coalesce keeps only the newest waiting input', async () => {
    const { scheduler, settled, started } = setup('coalesce')

    scheduler.push('A')
    scheduler.push('B')
    scheduler.push('C')
    started[0]?.request.resolve('a')
    await flushPromise()
    started[1]?.request.resolve('c')
    await flushPromise()

    // C replaced the waiting B, which never started.
    expect(started.map((s) => s.input)).toEqual(['A', 'C'])
    expect(settled).toEqual(['success:A', 'success:C'])
  })

  it('coalesce with merge combines waiting inputs into one call', async () => {
    const { scheduler, started } = setup('coalesce', { merge: (waiting, next) => waiting + next })

    scheduler.push('A')
    scheduler.push('B')
    scheduler.push('C')
    started[0]?.request.resolve('a')
    await flushPromise()

    expect(started.map((s) => s.input)).toEqual(['A', 'BC'])
  })

  it('serial runs every input in order, and switch aborts the running work', async () => {
    const serial = setup('serial')
    serial.scheduler.push('A')
    serial.scheduler.push('B')
    serial.scheduler.push('C')
    serial.started[0]?.request.resolve('a')
    await flushPromise()
    serial.started[1]?.request.resolve('b')
    await flushPromise()
    expect(serial.started.map((s) => s.input)).toEqual(['A', 'B', 'C'])

    const switching = setup('switch')
    switching.scheduler.push('A')
    switching.scheduler.push('B')
    expect(switching.started.map((s) => s.input)).toEqual(['A', 'B'])
    expect(switching.started[0]?.signal.aborted).toBe(true)
  })

  it('keeps draining the queue when a result subscriber throws, and surfaces its error', async () => {
    const subscriberError = new Error('result subscriber failed')
    const requests = { A: deferred<string>(), B: deferred<string>() }
    const started: string[] = []
    const scheduler = createPromiseScheduler<'A' | 'B', string>(
      new Engine(),
      'serial',
      (input) => {
        started.push(input)
        return requests[input].promise
      },
      {},
      {
        onSettle: (result) => {
          if (result.input === 'A') {
            throw subscriberError
          }
        },
      }
    )
    const thenSpy = vi.spyOn(requests.A.promise, 'then')
    scheduler.push('A')
    scheduler.push('B')
    const settlement = thenSpy.mock.results[0]?.value as Promise<unknown>
    thenSpy.mockRestore()

    const surfaced = expect(settlement).rejects.toBe(subscriberError)
    requests.A.resolve('a')
    await surfaced

    expect(started).toEqual(['A', 'B'])
  })

  it('rethrows the first of two subscriber errors in one settle and logs the second', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const engine = new Engine()
    const first = new Error('first')
    const second = new Error('second')
    const request = deferred<string>()
    const started: string[] = []
    const scheduler = createPromiseScheduler<string, string>(
      engine,
      'serial',
      (input) => {
        started.push(input)
        if (input === 'B') {
          // B fails synchronously while A's result is still being delivered, so its error result is delivered in the
          // same settle.
          throw new Error('B failed')
        }
        return request.promise
      },
      {},
      {
        onSettle: (result) => {
          throw result.input === 'A' ? first : second
        },
      }
    )
    const thenSpy = vi.spyOn(request.promise, 'then')
    scheduler.push('A')
    scheduler.push('B')
    const settlement = thenSpy.mock.results[0]?.value as Promise<unknown>
    thenSpy.mockRestore()

    const surfaced = expect(settlement).rejects.toBe(first)
    request.resolve('a')
    await surfaced

    expect(started).toEqual(['A', 'B'])
    expect(error).toHaveBeenCalledWith(expect.stringContaining('an additional error'), second)
  })

  it('rethrows the first error when a synchronously failing start and the drain after it both throw', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const thrown: unknown[] = []
    const engine = new Engine()
    const started: string[] = []
    const schedulerRef: { current?: { push: (input: string) => void } } = {}
    const scheduler = createPromiseScheduler<string, string>(
      engine,
      'serial',
      (input) => {
        started.push(input)
        throw new Error(`${input} failed`)
      },
      {},
      {
        onSettle: (result) => {
          if (result.input === 'A') {
            // Queued behind A, so it starts in the drain that follows A's synchronous failure.
            schedulerRef.current?.push('B')
          }
          throw new Error(`subscriber of ${result.input}`)
        },
      }
    )
    schedulerRef.current = scheduler

    try {
      scheduler.push('A')
    } catch (caught) {
      thrown.push(caught)
    }

    expect(started).toEqual(['A', 'B'])
    expect(thrown).toEqual([new Error('subscriber of A')])
    expect(error).toHaveBeenCalledWith(expect.stringContaining('an additional error'), new Error('subscriber of B'))
  })

  it('ignores inputs for a busy key under exhaust, per key, and frees the key inside the result subscriber', async () => {
    const schedulerRef: { current?: { push: (input: string) => void } } = {}
    const { scheduler, started } = setup('exhaust', {
      key: (input) => input[0],
      onSettle: (result) => {
        if (result.input === 'a1') {
          schedulerRef.current?.push('a3')
        }
      },
    })
    schedulerRef.current = scheduler

    scheduler.push('a1')
    scheduler.push('a2')
    scheduler.push('b1')
    expect(started.map((s) => s.input)).toEqual(['a1', 'b1'])

    started[0]?.request.reject(new Error('a1 failed'))
    await flushPromise()

    // The result subscriber published a3 for the same key, and it started at once.
    expect(started.map((s) => s.input)).toEqual(['a1', 'b1', 'a3'])
  })
})
