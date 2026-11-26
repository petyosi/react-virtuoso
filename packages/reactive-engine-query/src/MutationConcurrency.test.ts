import { Cell, ComputedCell, e, Engine } from '@virtuoso.dev/reactive-engine-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Mutation } from './Mutation'
import { executeWithRetry } from './utils'

import type { MutationOptions, MutationResult, MutationSettled } from './types'

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

type SetupOptions =
  MutationOptions<Params, string> extends infer TOptions ? (TOptions extends unknown ? Omit<TOptions, 'mutationFn'> : never) : never

function setup(options: SetupOptions = {}) {
  const calls: { params: Params; request: Deferred<string>; signal: AbortSignal }[] = []
  const mutation = Mutation<Params, string>({
    ...options,
    mutationFn: (params, signal) => {
      const request = deferred<string>()
      calls.push({ params, request, signal })
      return request.promise
    },
  } as MutationOptions<Params, string>)
  const engine = new Engine()
  const results: MutationResult<string, Params>[] = []
  const settled: MutationSettled<string, Params>[] = []
  const counts: number[] = []
  engine.sub(mutation.data$, (result) => results.push(result))
  engine.sub(mutation.settled$, (outcome) => settled.push(outcome))
  engine.sub(mutation.pendingCount$, (count) => counts.push(count))
  return { calls, counts, engine, mutation, results, settled }
}

const p = (id: string, patch: Record<string, number> = {}): Params => ({ id, patch })

const describeResult = (r: MutationResult<string, Params>) => (r.type === 'idle' ? ['idle'] : [r.type, r.params])
const describeOutcome = (o: MutationSettled<string, Params>) => [o.type, o.params]

describe('Mutation concurrency', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('coalesces per record, passes a signal, and reports every call exactly once', async () => {
    const { calls, counts, engine, mutation, results, settled } = setup({ concurrency: 'coalesce', key: ({ id }) => id })

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
    // Waiting and replaced calls do not change what data$ shows.
    expect(results.map(describeResult)).toEqual([
      ['pending', p('x', { v: 1 })],
      ['pending', p('y', { v: 1 })],
      ['success', p('x', { v: 1 })],
      ['pending', p('x', { v: 3 })],
      ['error', p('y', { v: 1 })],
      ['success', p('x', { v: 3 })],
    ])
    // The replaced call is reported as dropped, so nothing is left waiting for an outcome.
    expect(settled.map(describeOutcome)).toEqual([
      ['dropped', p('x', { v: 2 })],
      ['success', p('x', { v: 1 })],
      ['error', p('y', { v: 1 })],
      ['success', p('x', { v: 3 })],
    ])
    expect(counts).toEqual([1, 2, 3, 2, 1, 0])
  })

  it('runs serial calls one at a time in order', async () => {
    const { calls, engine, mutation, settled } = setup({ concurrency: 'serial' })

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))
    expect(calls).toHaveLength(1)
    calls[0]?.request.resolve('a')
    await flushPromise()
    calls[1]?.request.resolve('b')
    await flushPromise()

    expect(settled.map((o) => (o.type === 'success' ? o.data : o.type))).toEqual(['a', 'b'])
  })

  it('never aborts a call that started, under any policy', async () => {
    for (const concurrency of ['parallel', 'serial', 'coalesce'] as const) {
      const { calls, engine, mutation } = setup({ concurrency })

      engine.pub(mutation.mutate$, p('a'))
      engine.pub(mutation.mutate$, p('b'))
      engine.pub(mutation.reset$)
      engine.pub(mutation.dropWaiting$)

      expect(
        calls.every((c) => !c.signal.aborted),
        concurrency
      ).toBe(true)
      for (const call of calls) {
        call.request.resolve('done')
      }
      // oxlint-disable-next-line no-await-in-loop
      await flushPromise()
    }
  })

  it('reset only clears the display; earlier calls keep running and report their outcome', async () => {
    for (const concurrency of ['parallel', 'serial', 'coalesce'] as const) {
      const onSuccess = vi.fn()
      const { calls, counts, engine, mutation, settled } = setup({ concurrency, onSuccess })

      engine.pub(mutation.mutate$, p('a'))
      engine.pub(mutation.mutate$, p('b'))
      engine.pub(mutation.reset$)
      expect(engine.getValue(mutation.data$).type, concurrency).toBe('idle')
      expect(engine.getValue(mutation.pendingCount$), concurrency).toBe(2)

      // Serial and coalesce start b only after a settles; it was made before the reset, so it stays hidden.
      calls[0]?.request.resolve('a')
      // oxlint-disable-next-line no-await-in-loop
      await flushPromise()
      calls[1]?.request.resolve('b')
      // oxlint-disable-next-line no-await-in-loop
      await flushPromise()

      expect(engine.getValue(mutation.data$).type, concurrency).toBe('idle')
      expect(settled.map(describeOutcome), concurrency).toEqual([
        ['success', p('a')],
        ['success', p('b')],
      ])
      expect(onSuccess, concurrency).toHaveBeenCalledTimes(2)
      expect(counts.at(-1), concurrency).toBe(0)
    }
  })

  it('shows calls made after a reset', async () => {
    const { calls, engine, mutation, results } = setup()

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.reset$)
    engine.pub(mutation.mutate$, p('b'))
    calls[0]?.request.resolve('a')
    await flushPromise()
    expect(engine.getValue(mutation.data$)).toMatchObject({ params: p('b'), type: 'pending' })

    calls[1]?.request.resolve('b')
    await flushPromise()

    expect(results.map(describeResult)).toEqual([['pending', p('a')], ['idle'], ['pending', p('b')], ['success', p('b')]])
  })

  it('does not re-emit data$ on reset when it is already idle', () => {
    const { engine, mutation, results } = setup()

    engine.pub(mutation.reset$)
    engine.pub(mutation.reset$)

    expect(results).toEqual([])
  })

  it('drops waiting calls, reports each one, and leaves running calls alone', async () => {
    const { calls, counts, engine, mutation, settled } = setup({ concurrency: 'serial', key: ({ id }) => id })

    engine.pub(mutation.mutate$, p('x', { v: 1 }))
    engine.pub(mutation.mutate$, p('x', { v: 2 }))
    engine.pub(mutation.mutate$, p('y', { v: 1 }))
    engine.pub(mutation.mutate$, p('y', { v: 2 }))
    engine.pub(mutation.dropWaiting$)

    expect(settled.map(describeOutcome)).toEqual([
      ['dropped', p('x', { v: 2 })],
      ['dropped', p('y', { v: 2 })],
    ])
    expect(engine.getValue(mutation.pendingCount$)).toBe(2)

    calls[0]?.request.resolve('x1')
    calls[1]?.request.resolve('y1')
    await flushPromise()

    expect(calls.map((c) => c.params)).toEqual([p('x', { v: 1 }), p('y', { v: 1 })])
    expect(settled.map((o) => o.type)).toEqual(['dropped', 'dropped', 'success', 'success'])
    expect(counts).toEqual([1, 2, 3, 4, 2, 1, 0])
  })

  it('reports the merged params of a dropped coalesced call', () => {
    const { engine, mutation, settled } = setup({
      concurrency: 'coalesce',
      merge: (waiting, next) => ({ id: next.id, patch: { ...waiting.patch, ...next.patch } }),
    })

    engine.pub(mutation.mutate$, p('x', { a: 1 }))
    engine.pub(mutation.mutate$, p('x', { b: 2 }))
    engine.pub(mutation.mutate$, p('x', { c: 3 }))
    engine.pub(mutation.dropWaiting$)

    expect(settled.map(describeOutcome)).toEqual([['dropped', p('x', { b: 2, c: 3 })]])
  })

  it('does not re-emit an earlier result when a call waits', async () => {
    const { calls, engine, mutation, results } = setup({ concurrency: 'serial', key: ({ id }) => id })

    engine.pub(mutation.mutate$, p('x'))
    engine.pub(mutation.mutate$, p('y'))
    calls[1]?.request.resolve('y')
    await flushPromise()
    const emitted = results.length

    // x is still running, so this call waits. data$ keeps showing y's success without emitting it again.
    engine.pub(mutation.mutate$, p('x', { v: 2 }))

    expect(results).toHaveLength(emitted)
    expect(engine.getValue(mutation.data$)).toMatchObject({ params: p('y'), type: 'success' })
    expect(engine.getValue(mutation.pendingCount$)).toBe(2)
  })

  it('keeps a key usable when a data$ subscriber throws on a pending result', async () => {
    const { calls, engine, mutation, settled } = setup({ concurrency: 'serial' })
    let throwOnce = true
    engine.sub(mutation.data$, (result) => {
      if (result.type === 'pending' && throwOnce) {
        throwOnce = false
        throw new Error('subscriber failed')
      }
    })

    expect(() => {
      engine.pub(mutation.mutate$, p('a'))
    }).toThrow('subscriber failed')
    expect(calls).toHaveLength(1)
    calls[0]?.request.resolve('a')
    await flushPromise()

    engine.pub(mutation.mutate$, p('b'))
    calls[1]?.request.resolve('b')
    await flushPromise()

    expect(settled.map(describeOutcome)).toEqual([
      ['success', p('a')],
      ['success', p('b')],
    ])
    expect(engine.getValue(mutation.pendingCount$)).toBe(0)
  })

  it('lets callbacks publish back into the engine with matching params', async () => {
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

  it('keeps an optimistic overlay in sync with the server across a reset', async () => {
    // The pattern from the docs: each edit has a revision, a call carries the revisions it covers, and every outcome
    // removes exactly those revisions.
    interface Edit {
      id: string
      rev: number
      value: string
    }
    interface Save {
      id: string
      revs: number[]
      value: string
    }
    const requests: Deferred<string>[] = []
    const confirmed$ = Cell<Record<string, string>>({ x: 'old' })
    const edits$ = Cell<Edit[]>([])
    const visible$ = ComputedCell([confirmed$, edits$], ([confirmed, edits]) => {
      const view = { ...confirmed }
      for (const edit of edits) {
        view[edit.id] = edit.value
      }
      return view
    })
    const save = Mutation<Save, string>({
      mutationFn: () => {
        const request = deferred<string>()
        requests.push(request)
        return request.promise
      },
      concurrency: 'coalesce',
      key: ({ id }) => id,
      merge: (waiting, next) => ({ id: next.id, revs: [...waiting.revs, ...next.revs], value: next.value }),
      onSuccess: (value, { id }, engine) => {
        engine.pub(confirmed$, { ...engine.getValue(confirmed$), [id]: value })
      },
    })
    e.changeWith(edits$, save.settled$, (edits, outcome) => edits.filter((edit) => !outcome.params.revs.includes(edit.rev)))
    const engine = new Engine()
    let rev = 0
    const edit = (value: string) => {
      rev += 1
      engine.pub(edits$, [...engine.getValue(edits$), { id: 'x', rev, value }])
      engine.pub(save.mutate$, { id: 'x', revs: [rev], value })
    }

    edit('new')
    expect(engine.getValue(visible$)).toEqual({ x: 'new' })

    // Dismissing the mutation state while the write is in flight must not lose the write.
    engine.pub(save.reset$)
    requests[0]?.resolve('new')
    await flushPromise()

    expect(engine.getValue(visible$)).toEqual({ x: 'new' })
    expect(engine.getValue(confirmed$)).toEqual({ x: 'new' })
    expect(engine.getValue(edits$)).toEqual([])
  })

  it('keeps the pending count accurate under overlap', async () => {
    const { calls, counts, engine, mutation } = setup()

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
  })

  it('acts on every repeated mutate, even with equal values', async () => {
    const { calls, engine, mutation } = setup()

    const same = p('same')
    engine.pub(mutation.mutate$, same)
    engine.pub(mutation.mutate$, same)

    expect(calls).toHaveLength(2)
    for (const call of calls) {
      call.request.resolve('done')
    }
    await flushPromise()
  })

  it('publishes a success before a callback that starts another mutation', async () => {
    const seen: string[] = []
    const mutation: ReturnType<typeof Mutation<string, string>> = Mutation<string, string>({
      mutationFn: (params) => (params === 'A' ? Promise.resolve('a') : new Promise<string>(() => {})),
      onSuccess: (_data, params, engine) => {
        if (params === 'A') {
          engine.pub(mutation.mutate$, 'B')
        }
      },
    })
    const engine = new Engine()
    engine.sub(mutation.data$, (result) => seen.push(result.type === 'idle' ? 'idle' : `${result.type}:${result.params}`))

    engine.pub(mutation.mutate$, 'A')
    await flushPromise()

    expect(seen).toEqual(['pending:A', 'success:A', 'pending:B'])
  })

  it('does not count a call that coalesces into a waiting one', async () => {
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

  it('counts every waiting call under serial', () => {
    const { counts, engine, mutation } = setup({ concurrency: 'serial' })

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))
    engine.pub(mutation.mutate$, p('c'))

    expect(counts).toEqual([1, 2, 3])
  })

  it('merges waiting partial patches under coalesce', async () => {
    const { calls, engine, mutation, settled } = setup({
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
    expect(engine.getValue(mutation.data$)).toMatchObject({ params: p('x', { b: 2, c: 3 }), type: 'success' })
    // Merged params share one outcome; nothing is dropped.
    expect(settled.map((o) => o.type)).toEqual(['success', 'success'])
  })

  it('keeps parallel as the default, with results in completion order', async () => {
    const { calls, engine, mutation, settled } = setup()

    engine.pub(mutation.mutate$, p('a'))
    engine.pub(mutation.mutate$, p('b'))
    expect(calls).toHaveLength(2)
    calls[1]?.request.resolve('b')
    await flushPromise()
    calls[0]?.request.resolve('a')
    await flushPromise()

    expect(settled.map((o) => o.params.id)).toEqual(['b', 'a'])
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

  it('stops a retry delay when the signal aborts', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    let attempts = 0
    const run = executeWithRetry(
      () => {
        attempts += 1
        return Promise.reject(new Error('failed'))
      },
      { retry: 3, retryDelay: () => 1000, signal: controller.signal }
    )
    const outcome = expect(run).rejects.toThrow('Aborted')
    await vi.advanceTimersByTimeAsync(0)
    controller.abort()
    await vi.advanceTimersByTimeAsync(5000)

    await outcome
    expect(attempts).toBe(1)
  })
})
