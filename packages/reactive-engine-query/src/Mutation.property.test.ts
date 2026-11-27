import { Engine } from '@virtuoso.dev/reactive-engine-core'
import * as fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Mutation } from './Mutation'
import { flushPromises } from './test/helpers'

import type { KeyedMutation, UnkeyedMutation } from './Mutation'
import type { Deferred } from './test/helpers'
import type { MutationActiveResult, MutationResult, MutationSettled } from './types'
import type * as Utils from './utils'

// Model-based test (MUT-10): fast-check generates sequences of mutate$, resolve, reject, dismiss$, dismissAll$,
// reactions that publish from a settled$ subscriber, and subscribers that throw. Each sequence runs against Mutation
// and a reference model; after every command the full emission log (state, settled$, callbacks, in order) and the
// state must match. Failures shrink to a minimal sequence and report the seed and path to replay.

const caught = vi.hoisted(() => [] as unknown[])

vi.mock('./utils', async (importOriginal) => {
  const { wrapExecuteWithRetry } = await import('./test/captureSettlements')
  return wrapExecuteWithRetry(await importOriginal<typeof Utils>(), caught)
})

type RecordKey = 'a' | 'b' | 'single'
type Reaction = 'dismiss' | 'none' | 'retry'
interface Params {
  key: RecordKey
  name: string
}
interface Shown {
  name: string
  type: 'error' | 'pending' | 'success'
}

/** Reference model of Mutation's observable behavior. */
class Model {
  inputs = 0
  readonly keyed: boolean
  log: string[] = []
  nextId = 0
  outcomes = 0
  /** Keys with a running call, in start order, with the running params. */
  running: Params[] = []
  state = new Map<RecordKey, Shown>()

  constructor(keyed: boolean) {
    this.keyed = keyed
  }

  dismiss(key: RecordKey) {
    const shown = this.state.get(key)
    if (shown !== undefined && shown.type !== 'pending') {
      this.state.delete(key)
      this.logState()
    }
  }

  dismissAll() {
    let changed = false
    for (const [key, shown] of this.state) {
      if (shown.type !== 'pending') {
        this.state.delete(key)
        changed = true
      }
    }
    if (changed) {
      this.logState()
    }
  }

  /** Returns true if a state emission happened. */
  mutate(params: Params): boolean {
    this.inputs += 1
    if (this.running.some((running) => running.key === params.key)) {
      this.outcomes += 1
      this.log.push(`settled:ignored:${params.name}`, `callback:onIgnored:${params.name}`)
      return false
    }
    this.running.push(params)
    this.state.set(params.key, { name: params.name, type: 'pending' })
    this.logState()
    return true
  }

  settle(params: Params, ok: boolean, reaction: Reaction) {
    this.running = this.running.filter((running) => running !== params)
    const type = ok ? 'success' : 'error'
    this.state.set(params.key, { name: params.name, type })
    this.logState()
    this.outcomes += 1
    this.log.push(`settled:${type}:${params.name}`, `callback:${ok ? 'onSuccess' : 'onError'}:${params.name}`)
    if (reaction === 'retry') {
      this.mutate({ key: params.key, name: `${params.name}r` })
    } else if (reaction === 'dismiss') {
      this.dismiss(params.key)
    }
  }

  snapshot() {
    return describeState(this.keyed, this.state)
  }

  private logState() {
    this.log.push(`state:${this.snapshot()}`)
  }
}

function describeState(keyed: boolean, state: ReadonlyMap<RecordKey, Shown>) {
  if (!keyed) {
    const shown = state.get('single')
    return shown === undefined ? 'idle' : `${shown.type}:${shown.name}`
  }
  return [...state]
    .map(([key, shown]) => `${key}=${shown.type}:${shown.name}`)
    .toSorted()
    .join(',')
}

interface Real {
  engine: Engine
  identityViolations: string[]
  log: string[]
  mutation: KeyedMutation<Params, string, RecordKey> | UnkeyedMutation<Params, string>
  /** Reactions armed per params name, run by a settled$ subscriber. */
  reactions: Map<string, Reaction>
  requests: Map<string, Deferred<string>>
  signals: AbortSignal[]
  throwOnSettled: boolean
  throwOnState: boolean
}

function createReal(keyed: boolean): Real {
  const requests = new Map<string, Deferred<string>>()
  const signals: AbortSignal[] = []
  const log: string[] = []
  const callbacks = {
    mutationFn: (params: Params, signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => {
        requests.set(params.name, { promise: Promise.resolve(''), reject, resolve })
        signals.push(signal)
      }),
    onError: (_error: unknown, params: Params) => {
      log.push(`callback:onError:${params.name}`)
    },
    onIgnored: (params: Params) => {
      log.push(`callback:onIgnored:${params.name}`)
    },
    onSuccess: (_data: string, params: Params) => {
      log.push(`callback:onSuccess:${params.name}`)
    },
  }
  const mutation = keyed
    ? Mutation<Params, string, RecordKey>({ ...callbacks, key: (params) => params.key })
    : Mutation<Params, string>({ ...callbacks, key: false })
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

  // Recorders first, so throwing subscribers registered later cannot hide an emission from them.
  if ('status$' in mutation) {
    let previous: ReadonlyMap<RecordKey, MutationActiveResult<string, Params, RecordKey>> = new Map()
    engine.sub(mutation.status$, (status) => {
      for (const [key, result] of status) {
        const before = previous.get(key)
        if (before !== undefined && before !== result && before.type === result.type && before.params === result.params) {
          real.identityViolations.push(key)
        }
      }
      previous = status
      log.push(
        `state:${describeState(true, new Map([...status].map(([key, result]) => [key, { name: result.params.name, type: result.type }])))}`
      )
    })
  } else {
    engine.sub(mutation.data$, (result: MutationResult<string, Params>) => {
      const state = new Map<RecordKey, Shown>(result.type === 'idle' ? [] : [['single', { name: result.params.name, type: result.type }]])
      log.push(`state:${describeState(false, state)}`)
    })
  }
  engine.sub(mutation.settled$, (outcome: MutationSettled<string, Params>) => {
    log.push(`settled:${outcome.type}:${outcome.params.name}`)
  })
  engine.sub(mutation.settled$, (outcome: MutationSettled<string, Params>) => {
    const reaction = real.reactions.get(outcome.params.name)
    if (outcome.type === 'ignored' || reaction === undefined) {
      return
    }
    real.reactions.delete(outcome.params.name)
    if (reaction === 'retry') {
      engine.pub(mutation.mutate$, { key: outcome.params.key, name: `${outcome.params.name}r` })
    } else if (reaction === 'dismiss') {
      if ('status$' in mutation) {
        engine.pub(mutation.dismiss$, outcome.params.key)
      } else {
        engine.pub(mutation.dismiss$)
      }
    }
  })
  // Throwing subscribers last.
  const throwOnState = () => {
    if (real.throwOnState) {
      real.throwOnState = false
      throw new Error('state subscriber failed')
    }
  }
  if ('status$' in mutation) {
    engine.sub(mutation.status$, throwOnState)
  } else {
    engine.sub(mutation.data$, throwOnState)
  }
  engine.sub(mutation.settled$, () => {
    if (real.throwOnSettled) {
      real.throwOnSettled = false
      throw new Error('settled subscriber failed')
    }
  })
  return real
}

function expectSameState(model: Model, real: Real) {
  expect(real.log).toEqual(model.log)
  expect(real.identityViolations).toEqual([])
  expect(real.signals.filter((signal) => signal.aborted)).toHaveLength(0)
}

type Command = fc.AsyncCommand<Model, Real>

function mutateCommand(key: RecordKey, throwOnState: boolean): Command {
  return {
    check: () => true,
    async run(model, real) {
      model.nextId += 1
      const params: Params = { key: model.keyed ? key : 'single', name: `${key}${model.nextId}` }
      real.throwOnState = throwOnState
      let threw = false
      try {
        real.engine.pub(real.mutation.mutate$, params)
      } catch {
        threw = true
      }
      real.throwOnState = false
      const emitted = model.mutate(params)
      // The error reaches the publisher only if a state emission happened.
      expect(threw).toBe(throwOnState && emitted)
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
      // A throwing settled$ subscriber surfaces as one error from the settlement Promise.
      expect(caught.length - caughtBefore).toBe(throwOnSettled ? 1 : 0)
      expectSameState(model, real)
    },
    toString: () =>
      `${ok ? 'resolve' : 'reject'}(running[${index}]${reaction === 'none' ? '' : `, then ${reaction}`}${throwOnSettled ? ', throwOnSettled' : ''})`,
  }
}

function dismissCommand(key: RecordKey): Command {
  return {
    check: () => true,
    async run(model, real) {
      const recordKey = model.keyed ? key : 'single'
      if ('status$' in real.mutation) {
        real.engine.pub(real.mutation.dismiss$, recordKey)
      } else {
        real.engine.pub(real.mutation.dismiss$)
      }
      model.dismiss(recordKey)
      await flushPromises()
      expectSameState(model, real)
    },
    toString: () => `dismiss(${key})`,
  }
}

const dismissAllCommand: Command = {
  check: (model) => model.keyed,
  async run(model, real) {
    if ('status$' in real.mutation) {
      real.engine.pub(real.mutation.dismissAll$)
    }
    model.dismissAll()
    await flushPromises()
    expectSameState(model, real)
  },
  toString: () => 'dismissAll',
}

const commands = fc.commands(
  [
    // Roughly one command in ten arms a throwing subscriber. Shrinking moves the roll toward 0, so toward no throw.
    fc.tuple(fc.constantFrom<RecordKey>('a', 'b'), fc.integer({ max: 9, min: 0 })).map(([key, roll]) => mutateCommand(key, roll === 9)),
    fc
      .tuple(fc.nat(), fc.boolean(), fc.constantFrom<Reaction>('none', 'none', 'retry', 'dismiss'), fc.integer({ max: 9, min: 0 }))
      .map(([index, ok, reaction, roll]) => settleCommand(index, ok, reaction, roll === 9)),
    fc.constantFrom<RecordKey>('a', 'b').map((key) => dismissCommand(key)),
    fc.constant(dismissAllCommand),
  ],
  { maxCommands: 40 }
)

beforeEach(() => {
  caught.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Mutation model', () => {
  for (const keyed of [true, false]) {
    it(`matches the reference model (${keyed ? 'keyed' : 'key: false'})`, async () => {
      await fc.assert(
        fc.asyncProperty(commands, async (cmds) => {
          caught.length = 0
          const model = new Model(keyed)
          const real = createReal(keyed)
          await fc.asyncModelRun(() => ({ model, real }), cmds)

          // Settle everything that is left; afterwards every input has exactly one outcome.
          while (model.running.length > 0) {
            // oxlint-disable-next-line no-await-in-loop
            await settleCommand(0, true, 'none', false).run(model, real)
          }
          expect(model.outcomes).toBe(model.inputs)
          expect(real.log.filter((entry) => entry.startsWith('settled:'))).toHaveLength(model.inputs)
          real.engine.dispose()
        })
      )
    })
  }
})
