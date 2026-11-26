import { Cell, Engine } from '@virtuoso.dev/reactive-engine-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Mutation } from './Mutation'
import { controlledFn, deferred, flushPromises, neverSettle } from './test/helpers'

import type { KeyedMutation } from './Mutation'
import type { MutationSettled } from './types'
import type { MockInstance } from 'vitest'

interface Task {
  id: number
  title: string
}

const task = (id: number, title = `task ${id}`): Task => ({ id, title })

let warn: MockInstance<typeof console.warn>
let error: MockInstance<typeof console.error>

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

function keyed(options: { onIgnored?: (params: Task) => void } = {}) {
  const { calls, fn } = controlledFn<Task, string>()
  const onSuccess = vi.fn()
  const onError = vi.fn()
  const mutation = Mutation<Task, string, number>({
    mutationFn: fn,
    key: (params) => params.id,
    onError,
    onSuccess,
    ...(options.onIgnored ? { onIgnored: options.onIgnored } : {}),
  })
  const engine = new Engine()
  const settled: MutationSettled<string, Task, number>[] = []
  engine.sub(mutation.settled$, (outcome) => settled.push(outcome))
  return { calls, engine, mutation, onError, onSuccess, settled }
}

describe('Mutation', () => {
  describe('MUT-1: ignored calls and the warning', () => {
    it('ignores a call for a busy record, runs other records, and warns once per ignored call', async () => {
      const { calls, engine, mutation, onError, onSuccess, settled } = keyed()

      engine.pub(mutation.mutate$, task(1))
      engine.pub(mutation.mutate$, task(1, 'again'))
      engine.pub(mutation.mutate$, task(2))
      engine.pub(mutation.mutate$, task(1, 'third'))

      expect(calls.map((call) => call.params)).toEqual([task(1), task(2)])
      expect(settled).toEqual([
        { key: 1, params: task(1, 'again'), type: 'ignored' },
        { key: 1, params: task(1, 'third'), type: 'ignored' },
      ])
      expect([...engine.getValue(mutation.status$).keys()]).toEqual([1, 2])
      expect(warn).toHaveBeenCalledTimes(2)
      expect(String(warn.mock.calls[0]?.[0])).toContain('record 1')
      expect(String(warn.mock.calls[0]?.[0])).toContain('ConcurrentMutation')
      expect(String(warn.mock.calls[0]?.[0])).toContain('onIgnored')

      calls[0]?.request.resolve('done')
      await flushPromises()
      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onError).not.toHaveBeenCalled()
    })

    it('does not warn in production, and onIgnored replaces the warning', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const production = keyed()
      production.engine.pub(production.mutation.mutate$, task(1))
      production.engine.pub(production.mutation.mutate$, task(1))
      expect(warn).not.toHaveBeenCalled()
      vi.unstubAllEnvs()

      const onIgnored = vi.fn()
      const handled = keyed({ onIgnored })
      handled.engine.pub(handled.mutation.mutate$, task(1))
      handled.engine.pub(handled.mutation.mutate$, task(1, 'again'))
      expect(warn).not.toHaveBeenCalled()
      expect(onIgnored).toHaveBeenCalledWith(task(1, 'again'), handled.engine)
    })
  })

  describe('MUT-2: key: false is one record', () => {
    it('ignores a second call and moves data$ from pending to a settled result', async () => {
      const { calls, fn } = controlledFn<{ title: string }, Task>()
      const mutation = Mutation<{ title: string }, Task>({ key: false, mutationFn: fn, onIgnored: () => undefined })
      const engine = new Engine()

      engine.pub(mutation.mutate$, { title: 'a' })
      engine.pub(mutation.mutate$, { title: 'b' })
      expect(calls).toHaveLength(1)
      expect(engine.getValue(mutation.data$)).toEqual({
        data: null,
        error: null,
        isError: false,
        isPending: true,
        isSuccess: false,
        params: { title: 'a' },
        type: 'pending',
      })

      vi.useFakeTimers({ now: 1000, toFake: ['Date'] })
      calls[0]?.request.resolve(task(1, 'a'))
      await flushPromises()
      expect(engine.getValue(mutation.data$)).toEqual({
        data: task(1, 'a'),
        error: null,
        isError: false,
        isPending: false,
        isSuccess: true,
        params: { title: 'a' },
        settledAt: 1000,
        type: 'success',
      })
      expect('key' in engine.getValue(mutation.data$)).toBe(false)
    })
  })

  describe('MUT-3: results stay until replaced or dismissed; identity; no-ops', () => {
    it('dismisses exactly the requested results and keeps unchanged entries', async () => {
      const { calls, engine, mutation } = keyed()
      const emissions: ReadonlyMap<number, unknown>[] = []
      engine.sub(mutation.status$, (status) => emissions.push(status))

      engine.pub(mutation.mutate$, task(1))
      engine.pub(mutation.mutate$, task(2))
      engine.pub(mutation.mutate$, task(4))
      calls[0]?.request.reject(new Error('one failed'))
      calls[1]?.request.resolve('two')
      calls[2]?.request.resolve('four')
      await flushPromises()
      engine.pub(mutation.mutate$, task(3))

      const before = engine.getValue(mutation.status$)
      engine.pub(mutation.dismiss$, 2)
      const afterTwo = engine.getValue(mutation.status$)
      expect([...afterTwo.keys()]).toEqual([1, 4, 3])
      expect(afterTwo.get(1)).toBe(before.get(1))
      expect(afterTwo.get(3)).toBe(before.get(3))
      engine.pub(mutation.dismiss$, 1)
      expect([...engine.getValue(mutation.status$).keys()]).toEqual([4, 3])

      const count = emissions.length
      engine.pub(mutation.dismiss$, 3)
      engine.pub(mutation.dismiss$, 9)
      expect(emissions).toHaveLength(count)

      engine.pub(mutation.dismissAll$)
      expect([...engine.getValue(mutation.status$).keys()]).toEqual([3])
      expect(engine.getValue(mutation.status$).get(3)?.type).toBe('pending')
      engine.pub(mutation.dismissAll$)
      expect(emissions).toHaveLength(count + 1)

      engine.pub(mutation.mutate$, task(1))
      expect(engine.getValue(mutation.status$).get(1)?.type).toBe('pending')
    })
  })

  describe('MUT-4: dismiss never hides running work', () => {
    it('keeps a pending record through dismiss and dismissAll, and shows its result later', async () => {
      const { calls, engine, mutation, onSuccess, settled } = keyed()

      engine.pub(mutation.mutate$, task(1))
      engine.pub(mutation.dismiss$, 1)
      engine.pub(mutation.dismissAll$)
      expect(engine.getValue(mutation.status$).get(1)?.type).toBe('pending')

      calls[0]?.request.resolve('saved')
      await flushPromises()
      expect(engine.getValue(mutation.status$).get(1)).toMatchObject({ data: 'saved', type: 'success' })
      expect(settled).toHaveLength(1)
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('keeps an unkeyed pending call through dismiss', async () => {
      const { calls, fn } = controlledFn<number, number>()
      const mutation = Mutation<number, number>({ key: false, mutationFn: fn })
      const engine = new Engine()

      engine.pub(mutation.mutate$, 1)
      engine.pub(mutation.dismiss$)
      expect(engine.getValue(mutation.data$).type).toBe('pending')
      calls[0]?.request.resolve(2)
      await flushPromises()
      expect(engine.getValue(mutation.data$).type).toBe('success')
      engine.pub(mutation.dismiss$)
      expect(engine.getValue(mutation.data$).type).toBe('idle')
    })
  })

  describe('MUT-5: delivery order and visibility', () => {
    it('delivers state, then settled$, then the callback; pending comes before mutationFn', async () => {
      const order: string[] = []
      const request = deferred<string>()
      const status$Ref: { current?: KeyedMutation<Task, string, number> } = {}
      const engine = new Engine()
      const mutation = Mutation<Task, string, number>({
        key: (params) => params.id,
        mutationFn: () => {
          order.push(`mutationFn sees ${engine.getValue(status$Ref.current!.status$).get(1)?.type}`)
          return request.promise
        },
        onSuccess: () => order.push('onSuccess'),
      })
      status$Ref.current = mutation
      engine.sub(mutation.status$, (status) => order.push(`status ${status.get(1)?.type}`))
      engine.sub(mutation.settled$, (outcome) => {
        order.push(`settled ${outcome.type}, state reads ${engine.getValue(mutation.status$).get(1)?.type}`)
      })

      engine.pub(mutation.mutate$, task(1))
      request.resolve('ok')
      await flushPromises()

      expect(order).toEqual([
        'status pending',
        'mutationFn sees pending',
        'status success',
        'settled success, state reads success',
        'onSuccess',
      ])
    })

    it('shows pending right after publishing, except inside its own steps', async () => {
      const { calls, engine, mutation } = keyed()
      const trigger$ = Cell(0)
      const seen: (string | undefined)[] = []
      engine.sub(trigger$, () => {
        engine.pub(mutation.mutate$, task(5))
        seen.push(engine.getValue(mutation.status$).get(5)?.type)
      })
      engine.sub(mutation.settled$, (outcome) => {
        if (outcome.type === 'success' && outcome.key === 1) {
          engine.pub(mutation.mutate$, task(6))
          seen.push(engine.getValue(mutation.status$).get(6)?.type)
        }
      })

      engine.pub(mutation.mutate$, task(1))
      seen.push(engine.getValue(mutation.status$).get(1)?.type)
      engine.pub(trigger$, 1)
      calls[0]?.request.resolve('one')
      await flushPromises()

      expect(seen).toEqual(['pending', 'pending', undefined])
      expect(engine.getValue(mutation.status$).get(6)?.type).toBe('pending')
    })
  })

  describe('MUT-6: re-entrant commands', () => {
    it('accepts a retry from settled$, applies dismiss from a status$ subscriber, and runs nested mutations', async () => {
      const first = controlledFn<Task, string>()
      const second = controlledFn<number, number>()
      const other = Mutation<number, number>({ key: false, mutationFn: second.fn })
      const engine = new Engine()
      let retried = false
      const mutation = Mutation<Task, string, number>({
        key: (params) => params.id,
        mutationFn: first.fn,
        onSuccess: (_data, params, owner) => {
          if (params.id === 2) {
            owner.pub(other.mutate$, 42)
          }
        },
      })
      engine.sub(mutation.settled$, (outcome) => {
        if (outcome.type === 'error' && !retried) {
          retried = true
          engine.pub(mutation.mutate$, outcome.params)
        }
      })
      engine.sub(mutation.status$, (status) => {
        if (status.get(3)?.type === 'success') {
          engine.pub(mutation.dismiss$, 3)
        }
      })
      engine.sub(other.data$, (result) => {
        if (result.type === 'pending') {
          throw new Error('other subscriber failed')
        }
      })
      const seen: string[] = []
      engine.sub(mutation.status$, (status) => seen.push([...status.values()].map((result) => `${result.key}:${result.type}`).join(',')))

      engine.pub(mutation.mutate$, task(1))
      first.calls[0]?.request.reject(new Error('fail'))
      await flushPromises()
      // The retry was accepted, so a second call for record 1 started.
      expect(first.calls.map((call) => call.params.id)).toEqual([1, 1])

      engine.pub(mutation.mutate$, task(3))
      first.calls[2]?.request.resolve('three')
      await flushPromises()
      expect(engine.getValue(mutation.status$).has(3)).toBe(false)

      engine.pub(mutation.mutate$, task(2))
      first.calls[3]?.request.resolve('two')
      await flushPromises()
      // The nested mutation ran synchronously inside the callback; its subscriber error was logged as a callback error.
      expect(second.calls).toHaveLength(1)
      expect(error).toHaveBeenCalledWith('Mutation onSuccess callback error:', expect.any(Error))
      // Every subscriber saw the same sequence, ending without the dismissed record.
      expect(seen.at(-1)).toBe('1:pending,2:success')
    })
  })

  describe('MUT-7: callbacks write back to the graph', () => {
    it('passes data or error, params, and the owning engine', async () => {
      const confirmed$ = Cell<Record<number, string>>({})
      const failed$ = Cell<number[]>([])
      const engines: Engine[] = []
      const mutation = Mutation<Task, string, number>({
        key: (params) => params.id,
        mutationFn: ({ id }) => (id === 2 ? Promise.reject(new Error('nope')) : Promise.resolve(`saved ${id}`)),
        onError: (_error, params, engine) => {
          engines.push(engine)
          engine.pub(failed$, [...engine.getValue(failed$), params.id])
        },
        onSuccess: (data, params, engine) => {
          engines.push(engine)
          engine.pub(confirmed$, { ...engine.getValue(confirmed$), [params.id]: data })
        },
      })
      const engine = new Engine()

      engine.pub(mutation.mutate$, task(1))
      engine.pub(mutation.mutate$, task(2))
      await flushPromises()

      expect(engine.getValue(confirmed$)).toEqual({ 1: 'saved 1' })
      expect(engine.getValue(failed$)).toEqual([2])
      expect(engines).toEqual([engine, engine])
    })
  })

  describe('MUT-8: errors', () => {
    it('rethrows a state subscriber error from pub, after the protected effects', () => {
      const { calls, engine, mutation } = keyed()
      engine.sub(mutation.status$, (status) => {
        if (status.get(1)?.type === 'pending') {
          throw new Error('subscriber failed')
        }
      })

      expect(() => {
        engine.pub(mutation.mutate$, task(1))
      }).toThrow('subscriber failed')
      expect(engine.getValue(mutation.status$).get(1)?.type).toBe('pending')
      expect(calls).toHaveLength(1)
    })

    it('rethrows the first of two errors in one drain and logs the second', () => {
      const { engine, mutation } = keyed()
      engine.sub(mutation.status$, (status) => {
        if (status.get(1)?.type === 'pending' && !status.has(2)) {
          // Queued behind the current item, so it runs in the same drain.
          engine.pub(mutation.mutate$, task(2))
          throw new Error('first')
        }
        if (status.get(2)?.type === 'pending') {
          throw new Error('second')
        }
      })

      expect(() => {
        engine.pub(mutation.mutate$, task(1))
      }).toThrow('first')
      expect(engine.getValue(mutation.status$).get(2)?.type).toBe('pending')
      expect(error).toHaveBeenCalledWith(expect.stringContaining('an additional error'), expect.objectContaining({ message: 'second' }))
    })

    it('logs a throwing callback without rethrowing it', async () => {
      const mutation = Mutation<Task, string, number>({
        key: (params) => params.id,
        mutationFn: () => Promise.resolve('ok'),
        onSuccess: () => {
          throw new Error('callback failed')
        },
      })
      const engine = new Engine()
      engine.pub(mutation.mutate$, task(1))
      await flushPromises()
      expect(error).toHaveBeenCalledWith('Mutation onSuccess callback error:', expect.any(Error))
      engine.pub(mutation.mutate$, task(1))
      expect(engine.getValue(mutation.status$).get(1)?.type).toBe('pending')
    })

    it('rethrows a throwing or invalid key, with no outcome and no call', () => {
      for (const key of [
        () => Number.NaN,
        () => ({}) as unknown as number,
        () => {
          throw new Error('key failed')
        },
      ]) {
        const { fn, calls } = controlledFn<Task, string>()
        const onError = vi.fn()
        const mutation = Mutation<Task, string, number>({ key, mutationFn: fn, onError })
        const engine = new Engine()
        const settled = vi.fn()
        engine.sub(mutation.settled$, settled)

        expect(() => {
          engine.pub(mutation.mutate$, task(1))
        }).toThrow()
        expect(calls).toHaveLength(0)
        expect(settled).not.toHaveBeenCalled()
        expect(onError).not.toHaveBeenCalled()
      }
    })

    it('rethrows an invalid key published to dismiss$, without changing state', async () => {
      const { calls, engine, mutation } = keyed()
      engine.pub(mutation.mutate$, task(1))
      calls[0]?.request.resolve('ok')
      await flushPromises()
      const before = engine.getValue(mutation.status$)

      expect(() => {
        engine.pub(mutation.dismiss$, Number.POSITIVE_INFINITY)
      }).toThrow('finite number')
      expect(engine.getValue(mutation.status$)).toBe(before)
    })

    it('turns a synchronously throwing mutationFn into an asynchronous error outcome', async () => {
      const mutation = Mutation<Task, string, number>({
        key: (params) => params.id,
        mutationFn: () => {
          throw new Error('sync failure')
        },
      })
      const engine = new Engine()
      const settled: string[] = []
      engine.sub(mutation.settled$, (outcome) => settled.push(outcome.type))

      engine.pub(mutation.mutate$, task(1))
      expect(settled).toEqual([])
      await flushPromises()
      expect(settled).toEqual(['error'])
    })

    it('stops a synchronous feedback loop at the drain cap', () => {
      const mutation: KeyedMutation<Task, string, number> = Mutation<Task, string, number>({
        key: (params) => params.id,
        mutationFn: () => new Promise<string>(neverSettle),
        onIgnored: (params, engine) => {
          engine.pub(mutation.mutate$, params)
        },
      })
      const engine = new Engine()
      engine.pub(mutation.mutate$, task(1))

      expect(() => {
        engine.pub(mutation.mutate$, task(1))
      }).toThrow('more than 10000')
    })
  })

  describe('MUT-9: retries, repeats, disposal, engines', () => {
    it('ignores a call during a retry delay, and the retried call has one outcome', async () => {
      vi.useFakeTimers()
      let attempts = 0
      const mutation = Mutation<Task, string, number>({
        key: (params) => params.id,
        mutationFn: () => {
          attempts += 1
          return attempts === 1 ? Promise.reject(new Error('first attempt')) : Promise.resolve('second attempt')
        },
        onIgnored: () => undefined,
        retry: 2,
        retryDelay: () => 100,
      })
      const engine = new Engine()
      const settled: string[] = []
      engine.sub(mutation.settled$, (outcome) => settled.push(outcome.type))

      engine.pub(mutation.mutate$, task(1))
      await vi.advanceTimersByTimeAsync(10)
      engine.pub(mutation.mutate$, task(1))
      await vi.advanceTimersByTimeAsync(200)

      expect(attempts).toBe(2)
      expect(settled).toEqual(['ignored', 'success'])
    })

    it('makes a second call for repeated equal params once the first settled', async () => {
      const { calls, engine, mutation } = keyed()
      const same = task(1)
      engine.pub(mutation.mutate$, same)
      calls[0]?.request.resolve('ok')
      await flushPromises()
      engine.pub(mutation.mutate$, same)
      expect(calls).toHaveLength(2)
    })

    it('stops everything when a subscriber disposes the engine inside a step', async () => {
      const { calls, engine, mutation, onSuccess, settled } = keyed()
      engine.sub(mutation.status$, (status) => {
        if (status.get(1)?.type === 'success') {
          engine.dispose()
        }
      })
      engine.pub(mutation.mutate$, task(1))
      calls[0]?.request.resolve('ok')
      await flushPromises()

      expect(settled).toEqual([])
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('does not start a call when the engine is disposed during the pending step', () => {
      const { calls, engine, mutation } = keyed()
      engine.sub(mutation.status$, () => {
        engine.dispose()
      })
      engine.pub(mutation.mutate$, task(1))
      expect(calls).toHaveLength(0)
    })

    it('aborts running calls on disposal and keeps independent engines apart', async () => {
      const { calls, fn } = controlledFn<Task, string>()
      const mutation = Mutation<Task, string, number>({ key: (params) => params.id, mutationFn: fn, onIgnored: () => undefined })
      const one = new Engine()
      const two = new Engine()

      one.pub(mutation.mutate$, task(1))
      two.pub(mutation.mutate$, task(1))
      expect(calls).toHaveLength(2)

      one.dispose()
      expect(calls[0]?.signal.aborted).toBe(true)
      expect(calls[1]?.signal.aborted).toBe(false)
      calls[1]?.request.resolve('two')
      await flushPromises()
      expect(two.getValue(mutation.status$).get(1)?.type).toBe('success')
    })

    it('shares one queue with child engines when the parent owns the mutation', async () => {
      const { calls, fn } = controlledFn<Task, string>()
      const engines: Engine[] = []
      const mutation = Mutation<Task, string, number>({
        key: (params) => params.id,
        mutationFn: fn,
        onIgnored: () => undefined,
        onSuccess: (_data, _params, engine) => engines.push(engine),
      })
      const parent = new Engine()
      parent.register(mutation.mutate$)
      const childOne = new Engine({}, 'one', parent)
      const childTwo = new Engine({}, 'two', parent)

      childOne.pub(mutation.mutate$, task(1))
      childTwo.pub(mutation.mutate$, task(1))
      expect(calls).toHaveLength(1)

      childOne.dispose()
      expect(calls[0]?.signal.aborted).toBe(false)
      calls[0]?.request.resolve('ok')
      await flushPromises()
      expect(engines).toEqual([parent])
      expect(childTwo.getValue(mutation.status$).get(1)?.type).toBe('success')
      expect(warn).not.toHaveBeenCalled()
    })

    it('warns when a parent registers a mutation that a child engine touched first', () => {
      const mutation = Mutation<Task, string, number>({ key: (params) => params.id, mutationFn: () => Promise.resolve('ok') })
      const parent = new Engine()
      const child = new Engine({}, 'child', parent)

      child.getValue(mutation.status$)
      parent.getValue(mutation.status$)

      expect(warn).toHaveBeenCalledTimes(1)
      expect(String(warn.mock.calls[0]?.[0])).toContain('root.register(mutation.mutate$)')
    })
  })
})
