import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConcurrentMutation } from './ConcurrentMutation'
import { Query } from './Query'
import { controlledFn, deferred, flushPromises, neverSettle } from './test/helpers'

import type { KeyedConcurrentMutation } from './ConcurrentMutation'
import type { Deferred } from './test/helpers'
import type { ConcurrentMutationConcurrency, ConcurrentMutationSettled, ConcurrentMutationState, QueryResult } from './types'
import type { MockInstance } from 'vitest'

interface Edit {
  id: number
  value: string
}

const edit = (id: number, value: string): Edit => ({ id, value })

let error: MockInstance<typeof console.error>

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function keyed(concurrency: ConcurrentMutationConcurrency, merge?: (waiting: Edit, next: Edit) => Edit) {
  const { calls, fn } = controlledFn<Edit, string>()
  const onSuccess = vi.fn()
  const onError = vi.fn()
  const base = { key: (params: Edit) => params.id, mutationFn: fn, onError, onSuccess }
  const mutation =
    concurrency === 'coalesce'
      ? ConcurrentMutation<Edit, string, number>({ ...base, concurrency, ...(merge ? { merge } : {}) })
      : ConcurrentMutation<Edit, string, number>({ ...base, concurrency })
  const engine = new Engine()
  const settled: ConcurrentMutationSettled<string, Edit, number>[] = []
  engine.sub(mutation.settled$, (outcome) => settled.push(outcome))
  const entry = (id: number) => engine.getValue(mutation.status$).get(id)
  return { calls, engine, entry, mutation, onError, onSuccess, settled }
}

describe('ConcurrentMutation', () => {
  describe('CMUT-1: policies and outcomes', () => {
    it('parallel starts every call; outcomes arrive in completion order', async () => {
      const { calls, engine, mutation, settled } = keyed('parallel')

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      expect(calls).toHaveLength(2)
      calls[1]?.request.resolve('b')
      await flushPromises()
      calls[0]?.request.resolve('a')
      await flushPromises()

      expect(settled.map((outcome) => outcome.params.value)).toEqual(['b', 'a'])
    })

    it('serial runs one call per record in arrival order', async () => {
      const { calls, engine, mutation, settled } = keyed('serial')

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      engine.pub(mutation.mutate$, edit(2, 'x'))
      expect(calls.map((call) => call.params.value)).toEqual(['a', 'x'])
      calls[0]?.request.resolve('a')
      await flushPromises()
      expect(calls.map((call) => call.params.value)).toEqual(['a', 'x', 'b'])
      calls[2]?.request.resolve('b')
      calls[1]?.request.resolve('x')
      await flushPromises()

      expect(settled.map((outcome) => `${outcome.type}:${outcome.params.value}`)).toEqual(['success:a', 'success:b', 'success:x'])
    })

    it('coalesce keeps the newest waiting params and drops the replaced call without a callback', async () => {
      const { calls, engine, mutation, onError, onSuccess, settled } = keyed('coalesce')

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      engine.pub(mutation.mutate$, edit(1, 'c'))
      calls[0]?.request.resolve('a')
      await flushPromises()
      calls[1]?.request.resolve('c')
      await flushPromises()

      expect(calls.map((call) => call.params.value)).toEqual(['a', 'c'])
      expect(settled.map((outcome) => `${outcome.type}:${outcome.params.value}`)).toEqual(['dropped:b', 'success:a', 'success:c'])
      expect(onSuccess).toHaveBeenCalledTimes(2)
      expect(onError).not.toHaveBeenCalled()
    })

    it('coalesce with merge shares one outcome with the merged params', async () => {
      const { calls, engine, mutation, settled } = keyed('coalesce', (waiting, next) => edit(next.id, waiting.value + next.value))

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      engine.pub(mutation.mutate$, edit(1, 'c'))
      calls[0]?.request.resolve('a')
      await flushPromises()
      calls[1]?.request.resolve('bc')
      await flushPromises()

      expect(calls.map((call) => call.params.value)).toEqual(['a', 'bc'])
      expect(settled.map((outcome) => `${outcome.type}:${outcome.params.value}`)).toEqual(['success:a', 'success:bc'])
    })

    it('rethrows a throwing merge and leaves the waiting call unchanged', () => {
      const { engine, entry, mutation } = keyed('coalesce', (waiting, next) => {
        if (next.value === 'boom') {
          throw new Error('merge failed')
        }
        return edit(next.id, waiting.value + next.value)
      })

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      expect(() => {
        engine.pub(mutation.mutate$, edit(1, 'boom'))
      }).toThrow('merge failed')
      expect(entry(1)?.waiting).toEqual([edit(1, 'b')])
    })

    it('works with key: false as one record', async () => {
      const { calls, fn } = controlledFn<string, string>()
      const mutation = ConcurrentMutation<string, string>({ concurrency: 'serial', key: false, mutationFn: fn })
      const engine = new Engine()

      expect(engine.getValue(mutation.data$)).toEqual({ failures: [], isPending: false, lastSuccess: null, running: [], waiting: [] })
      engine.pub(mutation.mutate$, 'a')
      engine.pub(mutation.mutate$, 'b')
      expect(engine.getValue(mutation.data$)).toMatchObject({ isPending: true, running: ['a'], waiting: ['b'] })
      calls[0]?.request.resolve('A')
      await flushPromises()
      calls[1]?.request.resolve('B')
      await flushPromises()
      expect(engine.getValue(mutation.data$)).toMatchObject({ isPending: false, lastSuccess: { data: 'B', params: 'b' } })
      expect('key' in engine.getValue(mutation.data$)).toBe(false)
    })
  })

  describe('CMUT-2: failures are never cleared implicitly', () => {
    for (const concurrency of ['parallel', 'serial', 'coalesce'] as const) {
      it(`keeps failures after a later success (${concurrency})`, async () => {
        vi.useFakeTimers({ now: 5000, toFake: ['Date'] })
        const { calls, engine, entry, mutation } = keyed(concurrency)

        engine.pub(mutation.mutate$, edit(1, 'a'))
        calls[0]?.request.reject(new Error('a failed'))
        await flushPromises()
        engine.pub(mutation.mutate$, edit(1, 'b'))
        calls[1]?.request.resolve('b')
        await flushPromises()

        expect(entry(1)?.failures).toEqual([{ error: new Error('a failed'), params: edit(1, 'a'), settledAt: 5000 }])
        expect(entry(1)?.lastSuccess).toEqual({ data: 'b', params: edit(1, 'b'), settledAt: 5000 })

        engine.pub(mutation.mutate$, edit(1, 'c'))
        engine.pub(mutation.dismiss$, 1)
        expect(entry(1)).toMatchObject({ failures: [], lastSuccess: null, running: [edit(1, 'c')] })
      })
    }

    it('records the merged params of a failed merged call, and a failure does not change lastSuccess', async () => {
      const { calls, engine, entry, mutation } = keyed('coalesce', (waiting, next) => edit(next.id, waiting.value + next.value))

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      engine.pub(mutation.mutate$, edit(1, 'c'))
      calls[0]?.request.resolve('a')
      await flushPromises()
      calls[1]?.request.reject(new Error('bc failed'))
      await flushPromises()

      expect(entry(1)?.failures.map((failure) => failure.params)).toEqual([edit(1, 'bc')])
      expect(entry(1)?.lastSuccess?.params).toEqual(edit(1, 'a'))
    })
  })

  describe('CMUT-3: state shape, entry lifetime, identity', () => {
    it('lists running then waiting calls, keeps unchanged arrays and entries, and removes empty entries', async () => {
      const { calls, engine, entry, mutation } = keyed('serial')

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      engine.pub(mutation.mutate$, edit(2, 'x'))
      const one = entry(1)
      expect(one).toMatchObject({ isPending: true, key: 1, running: [edit(1, 'a')], waiting: [edit(1, 'b')] })

      engine.pub(mutation.mutate$, edit(2, 'y'))
      // Record 1 did not change, so its entry kept its identity.
      expect(entry(1)).toBe(one)
      const twoRunning = entry(2)?.running

      engine.pub(mutation.mutate$, edit(2, 'z'))
      // Only record 2's waiting list changed, so its running list kept its identity.
      expect(entry(2)?.running).toBe(twoRunning)

      for (const call of calls) {
        call.request.resolve('ok')
      }
      await flushPromises()
      for (const call of calls.slice(2)) {
        call.request.resolve('ok')
      }
      await flushPromises()
      for (const call of calls.slice(3)) {
        call.request.resolve('ok')
      }
      await flushPromises()
      expect(entry(1)?.isPending).toBe(false)
      engine.pub(mutation.dismissAll$)
      expect(engine.getValue(mutation.status$).size).toBe(0)
    })

    it('splits state per key under parallel and starts every call', () => {
      const { calls, engine, entry, mutation } = keyed('parallel')

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      engine.pub(mutation.mutate$, edit(2, 'x'))
      expect(calls).toHaveLength(3)
      expect(entry(1)?.running).toEqual([edit(1, 'a'), edit(1, 'b')])
      expect(entry(2)?.running).toEqual([edit(2, 'x')])
    })
  })

  describe('CMUT-4: waiting calls, dropping, and commands during a settle', () => {
    it('a new input published during a settle replaces the waiting call before it starts', async () => {
      const { calls, engine, mutation, settled } = keyed('coalesce')
      engine.sub(mutation.settled$, (outcome) => {
        if (outcome.type === 'success' && outcome.params.value === 'a') {
          engine.pub(mutation.mutate$, edit(1, 'c'))
        }
      })

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      calls[0]?.request.resolve('a')
      await flushPromises()

      expect(calls.map((call) => call.params.value)).toEqual(['a', 'c'])
      expect(settled.map((outcome) => `${outcome.type}:${outcome.params.value}`)).toEqual(['success:a', 'dropped:b'])
    })

    it('dropWaiting during a settle drops the waiting call; a new input then waits and starts through start-next', async () => {
      const { calls, engine, entry, mutation, settled } = keyed('coalesce')
      const states: string[] = []
      engine.sub(mutation.status$, (status) => {
        const one = status.get(1)
        states.push(
          one === undefined ? '-' : `r[${one.running.map((p) => p.value).join(',')}] w[${one.waiting.map((p) => p.value).join(',')}]`
        )
      })
      engine.sub(mutation.settled$, (outcome) => {
        if (outcome.type === 'success' && outcome.params.value === 'a') {
          engine.pub(mutation.dropWaiting$, 1)
          engine.pub(mutation.mutate$, edit(1, 'd'))
        }
      })

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      calls[0]?.request.resolve('a')
      await flushPromises()

      expect(settled.map((outcome) => `${outcome.type}:${outcome.params.value}`)).toEqual(['success:a', 'dropped:b'])
      expect(calls.map((call) => call.params.value)).toEqual(['a', 'd'])
      expect(states.slice(-4)).toEqual(['r[] w[b]', 'r[] w[]', 'r[] w[d]', 'r[d] w[]'])
      expect(entry(1)?.running).toEqual([edit(1, 'd')])
    })

    it('drops waiting calls per key and for all keys, leaves running calls alone, and treats empty drops as no-ops', async () => {
      vi.useFakeTimers()
      let attempts = 0
      const settled: ConcurrentMutationSettled<string, Edit, number>[] = []
      const requests: Deferred<string>[] = []
      const mutation = ConcurrentMutation<Edit, string, number>({
        concurrency: 'serial',
        key: (params) => params.id,
        mutationFn: (params) => {
          if (params.value === 'retrying') {
            attempts += 1
            return attempts === 1 ? Promise.reject(new Error('first attempt')) : Promise.resolve('retried')
          }
          const request = deferred<string>()
          requests.push(request)
          return request.promise
        },
        retry: 1,
        retryDelay: () => 100,
      })
      const engine = new Engine()
      engine.sub(mutation.settled$, (outcome) => settled.push(outcome))
      const emissions: unknown[] = []
      engine.sub(mutation.status$, (status) => emissions.push(status))

      engine.pub(mutation.mutate$, edit(1, 'retrying'))
      engine.pub(mutation.mutate$, edit(1, 'x-waiting'))
      engine.pub(mutation.mutate$, edit(2, 'y-running'))
      engine.pub(mutation.mutate$, edit(2, 'y-waiting'))
      await vi.advanceTimersByTimeAsync(10)

      engine.pub(mutation.dropWaiting$, 1)
      expect(settled.map((outcome) => `${outcome.type}:${outcome.params.value}`)).toEqual(['dropped:x-waiting'])
      engine.pub(mutation.dropWaitingAll$)
      expect(settled.map((outcome) => `${outcome.type}:${outcome.params.value}`)).toEqual(['dropped:x-waiting', 'dropped:y-waiting'])

      const count = emissions.length
      engine.pub(mutation.dropWaitingAll$)
      expect(emissions).toHaveLength(count)

      await vi.advanceTimersByTimeAsync(200)
      requests[0]?.resolve('y')
      await vi.advanceTimersByTimeAsync(0)
      expect(settled.map((outcome) => `${outcome.type}:${outcome.params.value}`)).toEqual([
        'dropped:x-waiting',
        'dropped:y-waiting',
        'success:retrying',
        'success:y-running',
      ])
    })
  })

  describe('CMUT-5: execution model', () => {
    it('during a retry delay, a second call queues (serial), replaces (coalesce), or starts (parallel)', async () => {
      vi.useFakeTimers()
      for (const concurrency of ['serial', 'coalesce', 'parallel'] as const) {
        const started: string[] = []
        const base = {
          key: (params: Edit) => params.id,
          mutationFn: (params: Edit) => {
            started.push(params.value)
            return started.length === 1 ? Promise.reject(new Error('first')) : Promise.resolve(params.value)
          },
          retry: 1,
          retryDelay: () => 100,
        }
        const mutation =
          concurrency === 'coalesce'
            ? ConcurrentMutation<Edit, string, number>({ ...base, concurrency })
            : ConcurrentMutation<Edit, string, number>({ ...base, concurrency })
        const engine = new Engine()

        engine.pub(mutation.mutate$, edit(1, 'a'))
        // oxlint-disable-next-line no-await-in-loop
        await vi.advanceTimersByTimeAsync(10)
        engine.pub(mutation.mutate$, edit(1, 'b'))
        engine.pub(mutation.mutate$, edit(1, 'c'))
        const startedDuringDelay = [...started]
        // oxlint-disable-next-line no-await-in-loop
        await vi.advanceTimersByTimeAsync(500)

        if (concurrency === 'parallel') {
          expect(startedDuringDelay, concurrency).toEqual(['a', 'b', 'c'])
        } else {
          expect(startedDuringDelay, concurrency).toEqual(['a'])
          expect(started, concurrency).toEqual(concurrency === 'serial' ? ['a', 'a', 'b', 'c'] : ['a', 'a', 'c'])
        }
      }
    })

    it('"retry once" from settled$ starts at once when nothing waits, and queues behind a waiting call', async () => {
      const { calls, engine, mutation } = keyed('serial')
      let retried = false
      engine.sub(mutation.settled$, (outcome) => {
        if (outcome.type === 'error' && !retried) {
          retried = true
          engine.pub(mutation.mutate$, outcome.params)
        }
      })

      engine.pub(mutation.mutate$, edit(1, 'a'))
      engine.pub(mutation.mutate$, edit(1, 'b'))
      calls[0]?.request.reject(new Error('a failed'))
      await flushPromises()
      // b was waiting, so the retry of a queued behind it.
      expect(calls.map((call) => call.params.value)).toEqual(['a', 'b'])
      calls[1]?.request.resolve('b')
      await flushPromises()
      expect(calls.map((call) => call.params.value)).toEqual(['a', 'b', 'a'])
    })

    it('delivers state, then settled$, then the callback, and logs throwing callbacks', async () => {
      const order: string[] = []
      const request = deferred<string>()
      const mutation = ConcurrentMutation<Edit, string, number>({
        concurrency: 'coalesce',
        key: (params) => params.id,
        mutationFn: () => request.promise,
        onSuccess: () => {
          order.push('onSuccess')
          throw new Error('callback failed')
        },
      })
      const engine = new Engine()
      engine.sub(mutation.status$, (status) => order.push(`state ${status.get(1)?.lastSuccess === null ? 'running' : 'settled'}`))
      engine.sub(mutation.settled$, () => order.push(`settled$, state reads ${engine.getValue(mutation.status$).get(1)?.isPending}`))

      engine.pub(mutation.mutate$, edit(1, 'a'))
      request.resolve('a')
      await flushPromises()

      expect(order).toEqual(['state running', 'state settled', 'settled$, state reads false', 'onSuccess'])
      expect(error).toHaveBeenCalledWith('ConcurrentMutation onSuccess callback error:', expect.any(Error))
    })

    it('aborts running calls on disposal, emits nothing after, and keeps engines independent', async () => {
      const { calls, fn } = controlledFn<Edit, string>()
      const mutation = ConcurrentMutation<Edit, string, number>({ concurrency: 'serial', key: (params) => params.id, mutationFn: fn })
      const one = new Engine()
      const two = new Engine()
      const settled = vi.fn()
      one.sub(mutation.settled$, settled)

      one.pub(mutation.mutate$, edit(1, 'a'))
      one.pub(mutation.mutate$, edit(1, 'b'))
      two.pub(mutation.mutate$, edit(1, 'c'))
      one.dispose()
      expect(calls[0]?.signal.aborted).toBe(true)
      calls[0]?.request.resolve('a')
      calls[1]?.request.resolve('c')
      await flushPromises()

      expect(settled).not.toHaveBeenCalled()
      expect(calls).toHaveLength(2)
      expect(two.getValue(mutation.status$).get(1)?.lastSuccess?.data).toBe('c')
    })

    it('stops a synchronous feedback loop at the drain cap', () => {
      const mutation: KeyedConcurrentMutation<Edit, string, number> = ConcurrentMutation<Edit, string, number>({
        concurrency: 'parallel',
        key: (params) => params.id,
        mutationFn: () => new Promise<string>(neverSettle),
      })
      const engine = new Engine()
      engine.sub(mutation.status$, () => {
        engine.pub(mutation.mutate$, edit(1, 'again'))
      })

      expect(() => {
        engine.pub(mutation.mutate$, edit(1, 'a'))
      }).toThrow('more than 10000')
    })
  })

  describe('CMUT-7: optimistic overlay (issue #1586)', () => {
    interface Todo {
      done: boolean
      id: number
    }

    // The overlay recipe from the docs, verbatim.
    function overlayDone(
      state: ConcurrentMutationState<Todo, Todo, number> | undefined,
      query: QueryResult<Todo[]>,
      id: number
    ): boolean | undefined {
      const newest = state?.waiting.at(-1) ?? state?.running.at(-1)
      if (newest !== undefined) {
        return newest.done
      }
      const last = state?.lastSuccess
      if (last !== undefined && last !== null && (query.dataUpdatedAt === null || last.settledAt >= query.dataUpdatedAt)) {
        return last.params.done
      }
      return query.data?.find((todo) => todo.id === id)?.done
    }

    function setup() {
      vi.useFakeTimers({ now: 1000, toFake: ['Date'] })
      const server: Todo[] = [{ done: false, id: 1 }]
      const fetches: Deferred<Todo[]>[] = []
      const saves: { params: Todo; request: Deferred<Todo> }[] = []
      const todosQuery = Query<null, Todo[]>({
        initialParams: null,
        queryFn: () => {
          const request = deferred<Todo[]>()
          fetches.push(request)
          return request.promise
        },
        retry: false,
      })
      const saveDone = ConcurrentMutation<Todo, Todo, number>({
        concurrency: 'coalesce',
        key: (todo) => todo.id,
        mutationFn: (todo) => {
          const request = deferred<Todo>()
          saves.push({ params: todo, request })
          return request.promise
        },
        onSuccess: (_todo, _params, engine) => {
          engine.pub(todosQuery.refetch$)
        },
      })
      const engine = new Engine()
      const shown: (boolean | undefined)[] = []
      const read = () => overlayDone(engine.getValue(saveDone.status$).get(1), engine.getValue(todosQuery.data$), 1)
      engine.sub(saveDone.status$, () => shown.push(read()))
      engine.sub(todosQuery.data$, () => shown.push(read()))
      const toggle = () => {
        engine.pub(saveDone.mutate$, { done: read() !== true, id: 1 })
      }
      const settleSave = async (index: number, ok = true) => {
        const save = saves[index]
        if (ok && save !== undefined) {
          server[0] = save.params
          save.request.resolve(save.params)
        } else {
          save?.request.reject(new Error('save failed'))
        }
        await flushPromises()
      }
      const landFetch = async (index: number) => {
        fetches[index]?.resolve(server.map((todo) => ({ ...todo })))
        await flushPromises()
      }
      return { engine, fetches, landFetch, read, saveDone, saves, server, settleSave, shown, todosQuery, toggle }
    }

    it('never flickers back, including the same-millisecond tie, and a double click sends off then on', async () => {
      const { landFetch, read, saves, server, settleSave, shown, toggle } = setup()
      await landFetch(0)
      expect(read()).toBe(false)

      toggle()
      expect(read()).toBe(true)
      shown.length = 0
      await settleSave(0)
      // Settled in the same millisecond as the initial load: lastSuccess still wins.
      expect(shown.every((value) => value === true)).toBe(true)
      vi.setSystemTime(1005)
      await landFetch(1)
      expect(shown.every((value) => value === true)).toBe(true)

      toggle()
      toggle()
      expect(saves.map((save) => save.params.done)).toEqual([true, false])
      expect(read()).toBe(true)
      await settleSave(1)
      expect(saves.map((save) => save.params.done)).toEqual([true, false, true])
      await settleSave(2)
      expect(server[0]?.done).toBe(true)
      expect(read()).toBe(true)
    })

    it('returns to the newest of lastSuccess and the query after a failed save, and keeps the failure', async () => {
      const { engine, landFetch, read, saveDone, settleSave, toggle } = setup()
      await landFetch(0)
      toggle()
      await settleSave(0)
      vi.setSystemTime(1010)
      await landFetch(1)

      toggle()
      expect(read()).toBe(false)
      await settleSave(1, false)
      expect(read()).toBe(true)
      expect(engine.getValue(saveDone.status$).get(1)?.failures).toHaveLength(1)
    })

    it('shows lastSuccess while the query has no data, and dismissing per the guidance does not change the overlay', async () => {
      const { engine, landFetch, read, saveDone, settleSave, toggle } = setup()
      toggle()
      await settleSave(0)
      expect(engine.getValue(saveDone.status$).get(1)?.lastSuccess).not.toBeNull()
      expect(read()).toBe(true)

      vi.setSystemTime(1020)
      await landFetch(0)
      await landFetch(1)
      // Failures surfaced (none) and the query is newer than lastSuccess: the guidance allows dismissing.
      engine.pub(saveDone.dismiss$, 1)
      expect(read()).toBe(true)
    })
  })
})
