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

async function flushPromise() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('exhaustMapPromise', () => {
  for (const outcome of ['resolve', 'reject'] as const) {
    it(`ignores inputs for a busy key, runs other keys, and frees the key inside result subscribers (${outcome})`, async () => {
      const source$ = Stream<string>(false)
      const requests = new Map<string, Deferred<string>>()
      const result$ = e.pipe(
        source$,
        e.exhaustMapPromise(
          (input: string) => {
            const request = deferred<string>()
            requests.set(input, request)
            return request.promise
          },
          { key: (input) => input[0] }
        )
      )
      const engine = new Engine()
      const results: SwitchMapPromiseResult<string, string>[] = []
      engine.sub(result$, (result) => {
        results.push(result)
        if (result.input === 'A1') {
          engine.pub(source$, 'A4')
        }
      })

      engine.pub(source$, 'A1')
      engine.pub(source$, 'A2')
      engine.pub(source$, 'C1')
      expect([...requests.keys()]).toEqual(['A1', 'C1'])

      if (outcome === 'resolve') {
        requests.get('A1')?.resolve('a1')
      } else {
        requests.get('A1')?.reject(new Error('a1 failed'))
      }
      await flushPromise()

      // The result subscriber published A4 for A's key, and it started at once.
      expect([...requests.keys()]).toEqual(['A1', 'C1', 'A4'])
      requests.get('C1')?.resolve('c1')
      requests.get('A4')?.resolve('a4')
      await flushPromise()

      expect(results.map((result) => [result.input, result.status])).toEqual([
        ['A1', outcome === 'resolve' ? 'success' : 'error'],
        ['C1', 'success'],
        ['A4', 'success'],
      ])
    })
  }

  it('runs one input at a time without a key, and aborts running work on disposal', async () => {
    const source$ = Stream<number>(false)
    const signals: AbortSignal[] = []
    const result$ = e.pipe(
      source$,
      e.exhaustMapPromise(
        (_input: number, signal) =>
          new Promise<number>(() => {
            signals.push(signal)
          })
      )
    )
    const engine = new Engine()
    engine.sub(result$, () => undefined)

    engine.pub(source$, 1)
    engine.pub(source$, 2)
    expect(signals).toHaveLength(1)

    engine.dispose()
    expect(signals[0]?.aborted).toBe(true)
    await flushPromise()
  })
})
