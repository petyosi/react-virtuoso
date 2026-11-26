import { Engine } from '@virtuoso.dev/reactive-engine-core'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { Mutation } from './Mutation'

import type { MutationConcurrency, MutationOptions, MutationResult } from './types'

// Model-based test: fast-check generates sequences of mutate$, reset$, dropWaiting$, and request settlements, runs
// them against Mutation and a reference model, and shrinks any failure to a minimal sequence. On failure, the error
// includes the seed and path to replay it: `fc.assert(..., { seed, path })`.
//
// The invariants behind the design:
// - every mutate$ input ends with exactly one outcome on settled$, whatever reset$ does;
// - data$ shows only calls made since the last reset$;
// - pendingCount$ counts running and waiting calls;
// - a call that started is never aborted, and the callbacks run once per success or error.

interface Params {
  ids: string[]
  key: string
}

interface Call extends Params {
  epoch: number
}

interface Config {
  concurrency: MutationConcurrency
  merge: boolean
}

interface Deferred {
  reject: (error: unknown) => void
  resolve: (value: string) => void
}

const nameOf = (params: Params) => params.ids.join('+')

const describeResult = (result: MutationResult<string, Params>) =>
  result.type === 'idle' ? 'idle' : `${result.type}:${nameOf(result.params)}`

/** Reference model of Mutation's observable behavior. */
class Model {
  readonly config: Config
  display = 'idle'
  drops: string[] = []
  epoch = 0
  nextId = 0
  /** Success and error outcomes, in order. */
  outcomes: string[] = []
  pushed: string[] = []
  running: Call[] = []
  private readonly queues = new Map<string, Call[]>()

  constructor(config: Config) {
    this.config = config
  }

  get count() {
    let waiting = 0
    for (const queue of this.queues.values()) {
      waiting += queue.length
    }
    return this.running.length + waiting
  }

  /** Returns true if the call started right away. */
  mutate(params: Params): boolean {
    const { concurrency, merge } = this.config
    const call: Call = { ...params, epoch: this.epoch }
    this.pushed.push(...params.ids)
    const busy = concurrency !== 'parallel' && this.running.some((run) => run.key === call.key)
    if (!busy) {
      this.start(call)
      return true
    }
    const queue = this.queueFor(call.key)
    const waiting = queue[0]
    if (concurrency === 'coalesce' && waiting !== undefined) {
      if (merge) {
        // A merged call belongs to the epoch of its newest params.
        queue[0] = { epoch: call.epoch, ids: [...waiting.ids, ...call.ids], key: call.key }
      } else {
        this.drops.push(nameOf(waiting))
        queue[0] = call
      }
    } else {
      queue.push(call)
    }
    return false
  }

  settle(call: Call, ok: boolean) {
    this.running.splice(this.running.indexOf(call), 1)
    const outcome = `${ok ? 'success' : 'error'}:${nameOf(call)}`
    this.outcomes.push(outcome)
    if (call.epoch === this.epoch) {
      this.display = outcome
    }
    const next = this.queueFor(call.key).shift()
    if (next !== undefined) {
      this.start(next)
    }
  }

  reset() {
    this.epoch += 1
    this.display = 'idle'
  }

  dropWaiting() {
    for (const queue of this.queues.values()) {
      this.drops.push(...queue.splice(0).map(nameOf))
    }
  }

  private queueFor(key: string) {
    let queue = this.queues.get(key)
    if (queue === undefined) {
      queue = []
      this.queues.set(key, queue)
    }
    return queue
  }

  private start(call: Call) {
    this.running.push(call)
    if (call.epoch === this.epoch) {
      this.display = `pending:${nameOf(call)}`
    }
  }
}

/** The system under test: a Mutation in a real engine, with Promises the commands settle. */
interface Real {
  callbacks: string[]
  engine: Engine
  mutation: ReturnType<typeof Mutation<Params, string>>
  requests: Map<string, Deferred>
  settled: string[]
  signals: AbortSignal[]
  /** When set, the next data$ subscriber call with a pending result throws. */
  throwOnPending: boolean
}

function createReal(config: Config): Real {
  const callbacks: string[] = []
  const requests = new Map<string, Deferred>()
  const signals: AbortSignal[] = []
  const base = {
    mutationFn: (params: Params, signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => {
        requests.set(nameOf(params), { reject, resolve })
        signals.push(signal)
      }),
    onError: (_error: unknown, params: Params) => {
      callbacks.push(`error:${nameOf(params)}`)
    },
    onSuccess: (_data: string, params: Params) => {
      callbacks.push(`success:${nameOf(params)}`)
    },
  }
  const key = (params: Params) => params.key
  const merge = (waiting: Params, next: Params): Params => ({ ids: [...waiting.ids, ...next.ids], key: next.key })
  let options: MutationOptions<Params, string> = base
  if (config.concurrency === 'serial') {
    options = { ...base, concurrency: 'serial', key }
  } else if (config.concurrency === 'coalesce') {
    options = config.merge ? { ...base, concurrency: 'coalesce', key, merge } : { ...base, concurrency: 'coalesce', key }
  }

  const real: Real = {
    callbacks,
    engine: new Engine(),
    mutation: Mutation(options),
    requests,
    settled: [],
    signals,
    throwOnPending: false,
  }
  real.engine.sub(real.mutation.data$, (result) => {
    if (result.type === 'pending' && real.throwOnPending) {
      real.throwOnPending = false
      throw new Error('data$ subscriber failed')
    }
  })
  real.engine.sub(real.mutation.settled$, (outcome) => {
    real.settled.push(`${outcome.type}:${nameOf(outcome.params)}`)
  })
  return real
}

async function flushPromises() {
  for (let index = 0; index < 5; index++) {
    // oxlint-disable-next-line no-await-in-loop
    await Promise.resolve()
  }
}

function expectSameState(model: Model, real: Real) {
  const outcomes = real.settled.filter((entry) => !entry.startsWith('dropped:'))
  const drops = real.settled.filter((entry) => entry.startsWith('dropped:')).map((entry) => entry.slice('dropped:'.length))
  expect(outcomes).toEqual(model.outcomes)
  expect(drops.toSorted()).toEqual(model.drops.toSorted())
  expect(real.callbacks).toEqual(model.outcomes)
  expect(describeResult(real.engine.getValue(real.mutation.data$))).toBe(model.display)
  expect(real.engine.getValue(real.mutation.pendingCount$)).toBe(model.count)
  expect(real.signals.filter((signal) => signal.aborted)).toEqual([])
}

type Command = fc.AsyncCommand<Model, Real>

function mutateCommand(key: string, throwOnPending: boolean): Command {
  return {
    check: () => true,
    async run(model, real) {
      model.nextId += 1
      const params: Params = { ids: [`${key}${model.nextId}`], key }
      real.throwOnPending = throwOnPending
      let threw = false
      try {
        real.engine.pub(real.mutation.mutate$, params)
      } catch {
        threw = true
      }
      real.throwOnPending = false
      const started = model.mutate(params)
      // A new call is always in the current epoch, so if it started, data$ showed it as pending.
      expect(threw).toBe(throwOnPending && started)
      await flushPromises()
      expectSameState(model, real)
    },
    toString: () => `mutate(${key}${throwOnPending ? ', throwOnPending' : ''})`,
  }
}

function settleCommand(index: number, ok: boolean): Command {
  return {
    check: (model) => model.running.length > 0,
    async run(model, real) {
      const call = model.running[index % model.running.length] as Call
      const request = real.requests.get(nameOf(call))
      expect(request, `request for ${nameOf(call)}`).toBeDefined()
      if (ok) {
        request?.resolve(`saved ${nameOf(call)}`)
      } else {
        request?.reject(new Error(`failed ${nameOf(call)}`))
      }
      await flushPromises()
      model.settle(call, ok)
      expectSameState(model, real)
    },
    toString: () => `${ok ? 'resolve' : 'reject'}(running[${index}])`,
  }
}

const resetCommand: Command = {
  check: () => true,
  async run(model, real) {
    real.engine.pub(real.mutation.reset$)
    await flushPromises()
    model.reset()
    expectSameState(model, real)
  },
  toString: () => 'reset',
}

const dropWaitingCommand: Command = {
  check: () => true,
  async run(model, real) {
    real.engine.pub(real.mutation.dropWaiting$)
    await flushPromises()
    model.dropWaiting()
    expectSameState(model, real)
  },
  toString: () => 'dropWaiting',
}

const commands = fc.commands(
  [
    // Roughly one call in ten throws from a data$ subscriber. Shrinking moves the roll toward 0, so toward no throw.
    fc.tuple(fc.constantFrom('a', 'b'), fc.integer({ max: 9, min: 0 })).map(([key, roll]) => mutateCommand(key, roll === 9)),
    fc.tuple(fc.nat(), fc.boolean()).map(([index, ok]) => settleCommand(index, ok)),
    fc.constant(resetCommand),
    fc.constant(dropWaitingCommand),
  ],
  { maxCommands: 40 }
)

const configs: Config[] = [
  { concurrency: 'parallel', merge: false },
  { concurrency: 'serial', merge: false },
  { concurrency: 'coalesce', merge: false },
  { concurrency: 'coalesce', merge: true },
]

describe('Mutation model', () => {
  for (const config of configs) {
    it(`matches the reference model under ${config.concurrency}${config.merge ? ' with merge' : ''}`, async () => {
      await fc.assert(
        fc.asyncProperty(commands, async (cmds) => {
          const model = new Model(config)
          const real = createReal(config)
          await fc.asyncModelRun(() => ({ model, real }), cmds)

          // Settle everything that is left; then nothing is pending and every input ended exactly once.
          while (model.running.length > 0) {
            // oxlint-disable-next-line no-await-in-loop
            await settleCommand(0, true).run(model, real)
          }
          expect(real.engine.getValue(real.mutation.pendingCount$)).toBe(0)
          const ended = [...model.outcomes.map((entry) => entry.slice(entry.indexOf(':') + 1)), ...model.drops]
          expect(ended.flatMap((name) => name.split('+')).toSorted()).toEqual(model.pushed.toSorted())

          // No key is stuck: a new call per key starts right away and shows as pending.
          for (const key of ['a', 'b']) {
            // oxlint-disable-next-line no-await-in-loop
            await mutateCommand(key, false).run(model, real)
            expect(real.engine.getValue(real.mutation.data$).type).toBe('pending')
          }
          real.engine.dispose()
        })
      )
    })
  }
})
