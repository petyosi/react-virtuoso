import { Engine } from '@virtuoso.dev/reactive-engine-core'
import * as fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConcurrentMutation } from './ConcurrentMutation'
import { flushPromises } from './test/helpers'

import type { KeyedConcurrentMutation } from './ConcurrentMutation'
import type { Deferred } from './test/helpers'
import type { ConcurrentMutationConcurrency, ConcurrentMutationSettled, ConcurrentMutationState } from './types'
import type * as Utils from './utils'

// Model-based test (CMUT-6): fast-check generates sequences of mutate$, resolve, reject, dismiss, drop-waiting (keyed
// and for all keys), reactions that publish from a settled$ subscriber, and subscribers that throw. Each sequence runs
// against ConcurrentMutation and a reference model, for each policy; after every command the emission log (state,
// settled$, callbacks) must match, in order. Commands that touch every record compare that command's emissions as a
// multiset, because records are visited in an internal order.

const caught = vi.hoisted(() => [] as unknown[])

vi.mock('./utils', async (importOriginal) => {
  const { wrapExecuteWithRetry } = await import('./test/captureSettlements')
  return wrapExecuteWithRetry(await importOriginal<typeof Utils>(), caught)
})

type RecordKey = 'a' | 'b'
type Reaction = 'dropThenMutate' | 'none' | 'retry'
interface Params {
  key: RecordKey
  name: string
}
interface Config {
  concurrency: ConcurrentMutationConcurrency
  merge: boolean
}
interface ModelRecord {
  failures: string[]
  lastSuccess: null | string
  running: Params[]
  startPending: boolean
  waiting: Params[]
}

const outcomeNames = (name: string) => name.split('+')

/** The name of an input published by a reaction. '+' marks merged names, so it is replaced. */
const reactionName = (params: Params, suffix: string) => `${params.name.replaceAll('+', '_')}${suffix}`

/** Reference model of ConcurrentMutation's observable behavior. */
class Model {
  readonly config: Config
  inputs: string[] = []
  log: string[] = []
  nextId = 0
  outcomes: string[] = []
  readonly records = new Map<RecordKey, ModelRecord>()

  constructor(config: Config) {
    this.config = config
  }

  get running(): Params[] {
    return [...this.records.values()].flatMap((record) => record.running)
  }

  dismiss(key: RecordKey) {
    const record = this.records.get(key)
    if (record === undefined || (record.failures.length === 0 && record.lastSuccess === null)) {
      return
    }
    record.failures = []
    record.lastSuccess = null
    this.logState()
  }

  dropWaiting(key: RecordKey) {
    this.dropWaitingIn([key])
  }

  /** Drops waiting calls of the given records: one state emission, then one outcome per dropped call. */
  dropWaitingIn(keys: RecordKey[]) {
    const dropped: Params[] = []
    for (const key of keys) {
      const record = this.records.get(key)
      if (record !== undefined && record.waiting.length > 0) {
        dropped.push(...record.waiting)
        record.waiting = []
      }
    }
    if (dropped.length === 0) {
      return
    }
    this.logState()
    for (const params of dropped) {
      this.outcomes.push(...outcomeNames(params.name))
      this.log.push(`settled:dropped:${params.name}`)
    }
  }

  /** Clears failures and lastSuccess of the given records in one state emission. */
  dismissIn(keys: RecordKey[]) {
    let changed = false
    for (const key of keys) {
      const record = this.records.get(key)
      if (record !== undefined && (record.failures.length > 0 || record.lastSuccess !== null)) {
        record.failures = []
        record.lastSuccess = null
        changed = true
      }
    }
    if (changed) {
      this.logState()
    }
  }

  mutate(params: Params) {
    this.inputs.push(params.name)
    const record = this.recordFor(params.key)
    const occupied = record.running.length > 0 || record.waiting.length > 0 || record.startPending
    const { concurrency, merge } = this.config
    if (concurrency === 'parallel' || !occupied) {
      record.running.push(params)
      this.logState()
      return
    }
    if (concurrency === 'serial' || record.waiting.length === 0) {
      record.waiting.push(params)
      this.logState()
      return
    }
    const [waiting] = record.waiting as [Params]
    if (merge) {
      record.waiting = [{ key: params.key, name: `${waiting.name}+${params.name}` }]
      this.logState()
      return
    }
    record.waiting = [params]
    this.logState()
    this.outcomes.push(...outcomeNames(waiting.name))
    this.log.push(`settled:dropped:${waiting.name}`)
  }

  settle(params: Params, ok: boolean, reaction: Reaction) {
    const record = this.recordFor(params.key)
    record.running = record.running.filter((running) => running !== params)
    if (ok) {
      record.lastSuccess = params.name
    } else {
      record.failures.push(params.name)
    }
    this.logState()
    this.outcomes.push(...outcomeNames(params.name))
    this.log.push(`settled:${ok ? 'success' : 'error'}:${params.name}`, `callback:${ok ? 'onSuccess' : 'onError'}:${params.name}`)
    // The start-next item is queued when the settle item finishes, after the commands its subscribers published.
    const startNext = this.config.concurrency !== 'parallel' && record.waiting.length > 0 && !record.startPending
    if (startNext) {
      record.startPending = true
    }
    if (reaction === 'retry') {
      this.mutate({ key: params.key, name: reactionName(params, 'r') })
    } else if (reaction === 'dropThenMutate') {
      this.dropWaiting(params.key)
      this.mutate({ key: params.key, name: reactionName(params, 'd') })
    }
    if (startNext) {
      record.startPending = false
      const next = record.waiting.shift()
      if (next !== undefined) {
        record.running.push(next)
        this.logState()
      }
    }
  }

  snapshot() {
    return [...this.records]
      .filter(([, record]) => !isEmpty(record))
      .map(([key, record]) => describeRecord(key, record.running, record.waiting, record.failures, record.lastSuccess))
      .toSorted()
      .join(',')
  }

  private logState() {
    this.log.push(`state:${this.snapshot()}`)
  }

  private recordFor(key: RecordKey) {
    let record = this.records.get(key)
    if (record === undefined) {
      record = { failures: [], lastSuccess: null, running: [], startPending: false, waiting: [] }
      this.records.set(key, record)
    }
    return record
  }
}

const isEmpty = (record: ModelRecord) =>
  record.running.length === 0 && record.waiting.length === 0 && record.failures.length === 0 && record.lastSuccess === null

const describeRecord = (key: string, running: Params[], waiting: Params[], failures: string[], lastSuccess: null | string) =>
  `${key}=r[${running.map((p) => p.name).join(' ')}]w[${waiting.map((p) => p.name).join(' ')}]f[${failures.join(' ')}]s[${lastSuccess ?? ''}]`

interface Real {
  engine: Engine
  identityViolations: string[]
  log: string[]
  mutation: KeyedConcurrentMutation<Params, string, RecordKey>
  reactions: Map<string, Reaction>
  requests: Map<string, Deferred<string>>
  signals: AbortSignal[]
  throwOnSettled: boolean
  throwOnState: boolean
}

function createReal(config: Config): Real {
  const requests = new Map<string, Deferred<string>>()
  const signals: AbortSignal[] = []
  const log: string[] = []
  const base = {
    key: (params: Params) => params.key,
    mutationFn: (params: Params, signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => {
        requests.set(params.name, { promise: Promise.resolve(''), reject, resolve })
        signals.push(signal)
      }),
    onError: (_error: unknown, params: Params) => {
      log.push(`callback:onError:${params.name}`)
    },
    onSuccess: (_data: string, params: Params) => {
      log.push(`callback:onSuccess:${params.name}`)
    },
  }
  const mergeParams = (waiting: Params, next: Params): Params => ({ key: next.key, name: `${waiting.name}+${next.name}` })
  const mutation =
    config.concurrency === 'coalesce'
      ? ConcurrentMutation<Params, string, RecordKey>({ ...base, concurrency: 'coalesce', ...(config.merge ? { merge: mergeParams } : {}) })
      : ConcurrentMutation<Params, string, RecordKey>({ ...base, concurrency: config.concurrency })
  const engine = new Engine()
  const real: Real = {
    engine,
    identityViolations: [],
    log,
    mutation,
    reactions: new Map(),
    requests,
    signals,
    throwOnSettled: false,
    throwOnState: false,
  }

  let previous: ReadonlyMap<RecordKey, ConcurrentMutationState<Params, string, RecordKey>> = new Map()
  engine.sub(mutation.status$, (status) => {
    for (const [key, state] of status) {
      const before = previous.get(key)
      if (before !== undefined && before !== state && JSON.stringify(before) === JSON.stringify(state)) {
        real.identityViolations.push(key)
      }
    }
    previous = status
    const described = [...status]
      .map(([key, state]) =>
        describeRecord(
          key,
          [...state.running],
          [...state.waiting],
          state.failures.map((failure) => failure.params.name),
          state.lastSuccess?.params.name ?? null
        )
      )
      .toSorted()
      .join(',')
    log.push(`state:${described}`)
  })
  engine.sub(mutation.settled$, (outcome: ConcurrentMutationSettled<string, Params, RecordKey>) => {
    log.push(`settled:${outcome.type}:${outcome.params.name}`)
  })
  engine.sub(mutation.settled$, (outcome: ConcurrentMutationSettled<string, Params, RecordKey>) => {
    const reaction = real.reactions.get(outcome.params.name)
    if (outcome.type === 'dropped' || reaction === undefined) {
      return
    }
    real.reactions.delete(outcome.params.name)
    if (reaction === 'retry') {
      engine.pub(mutation.mutate$, { key: outcome.params.key, name: reactionName(outcome.params, 'r') })
    } else if (reaction === 'dropThenMutate') {
      engine.pub(mutation.dropWaiting$, outcome.params.key)
      engine.pub(mutation.mutate$, { key: outcome.params.key, name: reactionName(outcome.params, 'd') })
    }
  })
  engine.sub(mutation.status$, () => {
    if (real.throwOnState) {
      real.throwOnState = false
      throw new Error('state subscriber failed')
    }
  })
  engine.sub(mutation.settled$, () => {
    if (real.throwOnSettled) {
      real.throwOnSettled = false
      throw new Error('settled subscriber failed')
    }
  })
  return real
}

function expectSameState(model: Model, real: Real, unordered = false) {
  if (unordered) {
    expect(real.log.toSorted()).toEqual(model.log.toSorted())
  } else {
    expect(real.log).toEqual(model.log)
  }
  expect(real.identityViolations).toEqual([])
  expect(real.signals.filter((signal) => signal.aborted)).toHaveLength(0)
}

type Command = fc.AsyncCommand<Model, Real>

function mutateCommand(key: RecordKey, throwOnState: boolean): Command {
  return {
    check: () => true,
    async run(model, real) {
      model.nextId += 1
      const params: Params = { key, name: `${key}${model.nextId}` }
      real.throwOnState = throwOnState
      let threw = false
      try {
        real.engine.pub(real.mutation.mutate$, params)
      } catch {
        threw = true
      }
      real.throwOnState = false
      model.mutate(params)
      // Every accepted input changes the state, so an armed state subscriber always throws to the publisher.
      expect(threw).toBe(throwOnState)
      await flushPromises()
      expectSameState(model, real)
    },
    toString: () => `mutate(${key}${throwOnState ? ', throwOnState' : ''})`,
  }
}

function settleCommand(index: number, ok: boolean, reaction: Reaction, throwOnSettled: boolean): Command {
  return {
    check: (model) => model.running.length > 0,
    async run(model, real) {
      const params = model.running[index % model.running.length] as Params
      const request = real.requests.get(params.name)
      expect(request, `request for ${params.name}`).toBeDefined()
      if (reaction !== 'none') {
        real.reactions.set(params.name, reaction)
      }
      real.throwOnSettled = throwOnSettled
      const caughtBefore = caught.length
      if (ok) {
        request?.resolve(`saved ${params.name}`)
      } else {
        request?.reject(new Error(`failed ${params.name}`))
      }
      await flushPromises()
      real.throwOnSettled = false
      model.settle(params, ok, reaction)
      expect(caught.length - caughtBefore).toBe(throwOnSettled ? 1 : 0)
      expectSameState(model, real)
    },
    toString: () =>
      `${ok ? 'resolve' : 'reject'}(running[${index}]${reaction === 'none' ? '' : `, then ${reaction}`}${throwOnSettled ? ', throwOnSettled' : ''})`,
  }
}

function keyedCommand(kind: 'dismiss' | 'dropWaiting', key: RecordKey): Command {
  return {
    check: () => true,
    async run(model, real) {
      real.engine.pub(kind === 'dismiss' ? real.mutation.dismiss$ : real.mutation.dropWaiting$, key)
      if (kind === 'dismiss') {
        model.dismiss(key)
      } else {
        model.dropWaiting(key)
      }
      await flushPromises()
      expectSameState(model, real)
    },
    toString: () => `${kind}(${key})`,
  }
}

function allCommand(kind: 'dismissAll' | 'dropWaitingAll'): Command {
  return {
    check: () => true,
    async run(model, real) {
      const before = model.log.length
      real.engine.pub(kind === 'dismissAll' ? real.mutation.dismissAll$ : real.mutation.dropWaitingAll$)
      if (kind === 'dismissAll') {
        model.dismissIn(['a', 'b'])
      } else {
        model.dropWaitingIn(['a', 'b'])
      }
      await flushPromises()
      // One state emission, then one outcome per dropped call; the order across records is internal, so compare this
      // command's emissions as a multiset.
      expect(real.log.slice(before).toSorted()).toEqual(model.log.slice(before).toSorted())
      real.log.splice(before, real.log.length - before, ...model.log.slice(before))
      expectSameState(model, real)
    },
    toString: () => kind,
  }
}

const commands = fc.commands(
  [
    fc.tuple(fc.constantFrom<RecordKey>('a', 'b'), fc.integer({ max: 9, min: 0 })).map(([key, roll]) => mutateCommand(key, roll === 9)),
    fc
      .tuple(fc.nat(), fc.boolean(), fc.constantFrom<Reaction>('none', 'none', 'retry', 'dropThenMutate'), fc.integer({ max: 9, min: 0 }))
      .map(([index, ok, reaction, roll]) => settleCommand(index, ok, reaction, roll === 9)),
    fc
      .tuple(fc.constantFrom('dismiss' as const, 'dropWaiting' as const), fc.constantFrom<RecordKey>('a', 'b'))
      .map(([kind, key]) => keyedCommand(kind, key)),
    fc.constantFrom('dismissAll' as const, 'dropWaitingAll' as const).map((kind) => allCommand(kind)),
  ],
  { maxCommands: 40 }
)

const configs: Config[] = [
  { concurrency: 'parallel', merge: false },
  { concurrency: 'serial', merge: false },
  { concurrency: 'coalesce', merge: false },
  { concurrency: 'coalesce', merge: true },
]

beforeEach(() => {
  caught.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ConcurrentMutation model', () => {
  for (const config of configs) {
    it(`matches the reference model under ${config.concurrency}${config.merge ? ' with merge' : ''}`, async () => {
      await fc.assert(
        fc.asyncProperty(commands, async (cmds) => {
          caught.length = 0
          const model = new Model(config)
          const real = createReal(config)
          await fc.asyncModelRun(() => ({ model, real }), cmds)

          // Settle everything that is left; afterwards every input has exactly one outcome.
          while (model.running.length > 0) {
            // oxlint-disable-next-line no-await-in-loop
            await settleCommand(0, true, 'none', false).run(model, real)
          }
          expect(model.outcomes.toSorted()).toEqual(model.inputs.toSorted())
          real.engine.dispose()
        })
      )
    })
  }
})
