/* oxlint-disable typescript-eslint/prefer-promise-reject-errors */
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

async function flushPromise() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('switchMapPromise operator', () => {
  it('emits a success result correlated with its input', async () => {
    const source$ = Stream<{ id: number }>(false)
    const work = deferred<string>()
    const input = { id: 1 }
    const result$ = e.pipe(
      source$,
      e.switchMapPromise(() => work.promise)
    )
    const history: SwitchMapPromiseResult<{ id: number }, string>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, input)
    work.resolve('done')
    await flushPromise()

    expect(history).toEqual([{ input, status: 'success', value: 'done' }])
    expect(history[0]?.input).toBe(input)
  })

  it('emits Error and non-Error rejections as correlated error results', async () => {
    const source$ = Stream<string>(false)
    const work = new Map<string, Deferred<number>>()
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((input) => {
        const request = deferred<number>()
        work.set(input, request)
        return request.promise
      })
    )
    const history: SwitchMapPromiseResult<string, number>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()
    const error = new Error('failed')

    engine.pub(source$, 'first')
    work.get('first')?.reject(error)
    await flushPromise()
    engine.pub(source$, 'second')
    work.get('second')?.reject('plain failure')
    await flushPromise()

    expect(history).toEqual([
      { error, input: 'first', status: 'error' },
      { error: 'plain failure', input: 'second', status: 'error' },
    ])
  })

  it('emits an abort-shaped rejection from the current live generation', async () => {
    const source$ = Stream<string>(false)
    const error = Object.assign(new Error('project aborted itself'), { name: 'AbortError' })
    const result$ = e.pipe(
      source$,
      e.switchMapPromise(() => Promise.reject(error))
    )
    const history: SwitchMapPromiseResult<string, never>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, 'current')
    await flushPromise()

    expect(history).toEqual([{ error, input: 'current', status: 'error' }])
  })

  it('converts a synchronous project throw to a synchronous error result', () => {
    const source$ = Stream<string>(false)
    const error = new Error('synchronous failure')
    const result$ = e.pipe(
      source$,
      e.switchMapPromise<string, never>(() => {
        throw error
      })
    )
    const history: SwitchMapPromiseResult<string, never>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, 'input')

    expect(history).toEqual([{ error, input: 'input', status: 'error' }])
  })

  it('aborts the previous signal before invoking the next project', () => {
    const source$ = Stream<number>(false)
    const signals: AbortSignal[] = []
    const priorSignalStates: boolean[] = []
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((_input, signal) => {
        priorSignalStates.push(signals.at(-1)?.aborted ?? false)
        signals.push(signal)
        return new Promise<number>(() => {})
      })
    )
    e.sub(result$, () => undefined)
    const engine = new Engine()

    engine.pub(source$, 1)
    engine.pub(source$, 2)

    expect(signals).toHaveLength(2)
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
    expect(priorSignalStates).toEqual([false, true])
  })

  it('suppresses a superseded resolution when work ignores abort', async () => {
    const source$ = Stream<string>(false)
    const work = new Map<string, Deferred<string>>()
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((input) => {
        const request = deferred<string>()
        work.set(input, request)
        return request.promise
      })
    )
    const history: SwitchMapPromiseResult<string, string>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, 'old')
    engine.pub(source$, 'new')
    work.get('old')?.resolve('stale')
    work.get('new')?.resolve('current')
    await flushPromise()

    expect(history).toEqual([{ input: 'new', status: 'success', value: 'current' }])
  })

  it('suppresses old work that settles after the current generation', async () => {
    const source$ = Stream<string>(false)
    const work = new Map<string, Deferred<string>>()
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((input) => {
        const request = deferred<string>()
        work.set(input, request)
        return request.promise
      })
    )
    const history: SwitchMapPromiseResult<string, string>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, 'old')
    engine.pub(source$, 'new')
    work.get('new')?.resolve('current')
    await flushPromise()
    work.get('old')?.reject(new Error('late stale error'))
    await flushPromise()

    expect(history).toEqual([{ input: 'new', status: 'success', value: 'current' }])
  })

  it('does not let abort-listener re-entry start an older generation', () => {
    const source$ = Stream<string>(false)
    const started: string[] = []
    const signals = new Map<string, AbortSignal>()
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((input, signal) => {
        started.push(input)
        signals.set(input, signal)
        if (input === 'first') {
          signal.addEventListener('abort', () => {
            engine.pub(source$, 'reentrant')
          })
        }
        return new Promise<string>(() => {})
      })
    )
    e.sub(result$, () => undefined)
    const engine = new Engine()

    engine.pub(source$, 'first')
    engine.pub(source$, 'outer-second')

    expect(started).toEqual(['first', 'reentrant'])
    expect(signals.get('first')?.aborted).toBe(true)
    expect(signals.get('reentrant')?.aborted).toBe(false)
  })

  it('suppresses an outer project that is superseded by synchronous project re-entry', async () => {
    const source$ = Stream<string>(false)
    const work = new Map<string, Deferred<string>>()
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((input) => {
        const request = deferred<string>()
        work.set(input, request)
        if (input === 'outer') {
          engine.pub(source$, 'inner')
        }
        return request.promise
      })
    )
    const history: SwitchMapPromiseResult<string, string>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, 'outer')
    work.get('outer')?.resolve('stale')
    work.get('inner')?.resolve('current')
    await flushPromise()

    expect(history).toEqual([{ input: 'inner', status: 'success', value: 'current' }])
  })

  it('emits repeated equal success values', async () => {
    const source$ = Stream<number>(false)
    const result$ = e.pipe(
      source$,
      e.switchMapPromise(() => Promise.resolve('same'))
    )
    const history: SwitchMapPromiseResult<number, string>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, 1)
    await flushPromise()
    engine.pub(source$, 2)
    await flushPromise()

    expect(history).toEqual([
      { input: 1, status: 'success', value: 'same' },
      { input: 2, status: 'success', value: 'same' },
    ])
  })

  it('does not convert a success subscriber error into an operator error result', async () => {
    const source$ = Stream<string>(false)
    const work = deferred<string>()
    const result$ = e.pipe(
      source$,
      e.switchMapPromise(() => work.promise)
    )
    const history: SwitchMapPromiseResult<string, string>[] = []
    const subscriberError = new Error('subscriber failed')
    e.sub(result$, (result) => history.push(result))
    e.sub(result$, (result) => {
      if (result.status === 'success') {
        throw subscriberError
      }
    })
    const engine = new Engine()
    const thenSpy = vi.spyOn(work.promise, 'then')

    engine.pub(source$, 'input')
    const settlement = thenSpy.mock.results[0]?.value as Promise<unknown> | undefined
    thenSpy.mockRestore()
    expect(settlement).toBeDefined()
    const surfacedError = expect(settlement).rejects.toBe(subscriberError)
    work.resolve('done')
    await surfacedError
    await flushPromise()

    expect(history).toEqual([{ input: 'input', status: 'success', value: 'done' }])
  })

  it('emits repeated identical rejection objects', async () => {
    const source$ = Stream<number>(false)
    const error = new Error('same')
    const result$ = e.pipe(
      source$,
      e.switchMapPromise(() => Promise.reject(error))
    )
    const history: SwitchMapPromiseResult<number, never>[] = []
    e.sub(result$, (result) => history.push(result))
    const engine = new Engine()

    engine.pub(source$, 1)
    await flushPromise()
    engine.pub(source$, 2)
    await flushPromise()

    expect(history).toEqual([
      { error, input: 1, status: 'error' },
      { error, input: 2, status: 'error' },
    ])
  })

  it('aborts and suppresses resolution after disposal', async () => {
    const source$ = Stream<string>(false)
    const work = deferred<string>()
    let signal: AbortSignal | undefined
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((_input, currentSignal) => {
        signal = currentSignal
        return work.promise
      })
    )
    const subscriber = vi.fn()
    e.sub(result$, subscriber)
    const engine = new Engine()
    engine.pub(source$, 'input')

    engine.dispose()
    work.resolve('late')
    await flushPromise()

    expect(signal?.aborted).toBe(true)
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('aborts and suppresses rejection after disposal', async () => {
    const source$ = Stream<string>(false)
    const work = deferred<string>()
    const result$ = e.pipe(
      source$,
      e.switchMapPromise(() => work.promise)
    )
    const subscriber = vi.fn()
    e.sub(result$, subscriber)
    const engine = new Engine()
    engine.pub(source$, 'input')

    engine.dispose()
    work.reject(new Error('late'))
    await flushPromise()

    expect(subscriber).not.toHaveBeenCalled()
  })

  it('does not start re-entrant work from a disposal abort listener', () => {
    const source$ = Stream<string>(false)
    const started: string[] = []
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((input, signal) => {
        started.push(input)
        signal.addEventListener('abort', () => {
          engine.pub(source$, 'reentrant')
        })
        return new Promise<string>(() => {})
      })
    )
    e.sub(result$, () => undefined)
    const engine = new Engine()
    engine.pub(source$, 'initial')

    engine.dispose()

    expect(started).toEqual(['initial'])
  })

  it('keeps work independent across engines', async () => {
    const source$ = Stream<string>(false)
    const work: Deferred<string>[] = []
    const signals: AbortSignal[] = []
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((_input, signal) => {
        const request = deferred<string>()
        work.push(request)
        signals.push(signal)
        return request.promise
      })
    )
    const firstHistory: SwitchMapPromiseResult<string, string>[] = []
    const secondHistory: SwitchMapPromiseResult<string, string>[] = []
    const first = new Engine()
    const second = new Engine()
    first.sub(result$, (result) => firstHistory.push(result))
    second.sub(result$, (result) => secondHistory.push(result))
    first.pub(source$, 'first')
    second.pub(source$, 'second')

    first.dispose()
    work[0]?.resolve('ignored')
    work[1]?.resolve('kept')
    await flushPromise()

    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
    expect(firstHistory).toEqual([])
    expect(secondHistory).toEqual([{ input: 'second', status: 'success', value: 'kept' }])
  })

  it('keeps current work active after an output subscription is removed', async () => {
    const source$ = Stream<string>(false)
    const work = deferred<string>()
    let signal: AbortSignal | undefined
    const result$ = e.pipe(
      source$,
      e.switchMapPromise((_input, currentSignal) => {
        signal = currentSignal
        return work.promise
      })
    )
    const engine = new Engine()
    const unsubscribe = engine.sub(result$, () => undefined)
    engine.pub(source$, 'input')

    unsubscribe()

    expect(signal?.aborted).toBe(false)
    work.resolve('unobserved')
    await flushPromise()
    expect(signal?.aborted).toBe(false)
  })
})
