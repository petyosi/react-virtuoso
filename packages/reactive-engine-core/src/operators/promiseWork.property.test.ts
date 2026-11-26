import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../index'

import type { PromiseWorkEvent, PromiseWorkPolicy } from '../index'

// Model-based test: fast-check generates command sequences, runs them against promiseWork and against a small
// reference model of the scheduler, and shrinks any failure to a minimal sequence. On failure, the error includes
// the seed and path to replay it: `fc.assert(..., { seed, path })`.

interface Input {
  ids: string[]
  key: string
}

interface Config {
  merge: boolean
  policy: PromiseWorkPolicy
}

interface Deferred {
  reject: (error: unknown) => void
  resolve: (value: string) => void
}

const nameOf = (input: Input) => input.ids.join('+')

/** Reference model of the scheduler's observable behavior. */
class Model {
  aborted: string[] = []
  readonly config: Config
  drops: string[] = []
  nextId = 0
  pushed: string[] = []
  /** Started and not yet settled or superseded, in start order. */
  running: Input[] = []
  settles: string[] = []
  starts: string[] = []
  private readonly queues = new Map<string, Input[]>()

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

  /** Returns true if the input started right away. */
  push(input: Input): boolean {
    const { merge, policy } = this.config
    this.pushed.push(...input.ids)
    if (policy === 'switch') {
      for (const run of this.runningFor(input.key)) {
        this.aborted.push(nameOf(run))
        this.running.splice(this.running.indexOf(run), 1)
      }
      this.start(input)
      return true
    }
    if (policy === 'parallel' || this.runningFor(input.key).length === 0) {
      this.start(input)
      return true
    }
    const queue = this.queueFor(input.key)
    const waiting = queue[0]
    if (policy === 'coalesce' && waiting !== undefined) {
      if (merge) {
        queue[0] = { ids: [...waiting.ids, ...input.ids], key: input.key }
      } else {
        this.drops.push(nameOf(waiting))
        queue[0] = input
      }
    } else {
      queue.push(input)
    }
    return false
  }

  settle(input: Input, ok: boolean) {
    this.running.splice(this.running.indexOf(input), 1)
    this.settles.push(`${ok ? 'ok' : 'error'}:${nameOf(input)}`)
    const next = this.queueFor(input.key).shift()
    if (next !== undefined) {
      this.start(next)
    }
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

  private runningFor(key: string) {
    return this.running.filter((run) => run.key === key)
  }

  private start(input: Input) {
    this.running.push(input)
    this.starts.push(nameOf(input))
  }
}

/** The system under test: promiseWork in a real engine, with Promises the commands settle. */
interface Real {
  dropWaiting$: ReturnType<typeof Stream<void>>
  engine: Engine
  log: PromiseWorkEvent<Input, string>[]
  requests: Map<string, Deferred>
  signals: Map<string, AbortSignal>
  source$: ReturnType<typeof Stream<Input>>
  /** When set, the next start subscriber call throws. */
  throwOnStart: boolean
}

function createReal(config: Config): Real {
  const real: Real = {
    dropWaiting$: Stream<void>(false),
    engine: new Engine(),
    log: [],
    requests: new Map(),
    signals: new Map(),
    source$: Stream<Input>(false),
    throwOnStart: false,
  }
  const mergeInputs = (waiting: Input, next: Input): Input => ({ ids: [...waiting.ids, ...next.ids], key: next.key })
  const events$ = e.pipe(
    real.source$,
    e.promiseWork<Input, string>(
      (input, signal) =>
        new Promise<string>((resolve, reject) => {
          real.requests.set(nameOf(input), { reject, resolve })
          real.signals.set(nameOf(input), signal)
        }),
      {
        dropWaiting$: real.dropWaiting$,
        key: (input) => input.key,
        policy: config.policy,
        ...(config.merge ? { merge: mergeInputs } : {}),
      }
    )
  )
  real.engine.sub(events$, (event) => {
    real.log.push(event)
    if (event.type === 'start' && real.throwOnStart) {
      real.throwOnStart = false
      throw new Error('start subscriber failed')
    }
  })
  return real
}

const pendingCountOf = (real: Real) => real.log.at(-1)?.pendingCount ?? 0

const namesOf = (real: Real, type: 'drop' | 'start') => real.log.flatMap((event) => (event.type === type ? [nameOf(event.input)] : []))

const settlesOf = (real: Real) =>
  real.log.flatMap((event) =>
    event.type === 'settle' ? [`${event.result.status === 'success' ? 'ok' : 'error'}:${nameOf(event.result.input)}`] : []
  )

async function flushPromises() {
  for (let index = 0; index < 5; index++) {
    // oxlint-disable-next-line no-await-in-loop
    await Promise.resolve()
  }
}

function expectSameState(model: Model, real: Real) {
  expect(namesOf(real, 'start')).toEqual(model.starts)
  expect(settlesOf(real)).toEqual(model.settles)
  expect(namesOf(real, 'drop').toSorted()).toEqual(model.drops.toSorted())
  expect(pendingCountOf(real)).toBe(model.count)
  const aborted = [...real.signals].flatMap(([name, signal]) => (signal.aborted ? [name] : []))
  expect(aborted.toSorted()).toEqual(model.aborted.toSorted())
}

type Command = fc.AsyncCommand<Model, Real>

function pushCommand(key: string, throwOnStart: boolean): Command {
  return {
    check: () => true,
    async run(model, real) {
      model.nextId += 1
      const input: Input = { ids: [`${key}${model.nextId}`], key }
      real.throwOnStart = throwOnStart
      let threw = false
      try {
        real.engine.pub(real.source$, input)
      } catch {
        threw = true
      }
      real.throwOnStart = false
      const started = model.push(input)
      // The subscriber error reaches the publisher only if the input started, and the work still runs.
      expect(threw).toBe(throwOnStart && started)
      await flushPromises()
      expectSameState(model, real)
    },
    toString: () => `push(${key}${throwOnStart ? ', throwOnStart' : ''})`,
  }
}

function settleCommand(index: number, ok: boolean): Command {
  return {
    check: (model) => model.running.length > 0,
    async run(model, real) {
      const input = model.running[index % model.running.length] as Input
      const request = real.requests.get(nameOf(input))
      expect(request, `request for ${nameOf(input)}`).toBeDefined()
      if (ok) {
        request?.resolve(`value ${nameOf(input)}`)
      } else {
        request?.reject(new Error(`failed ${nameOf(input)}`))
      }
      await flushPromises()
      model.settle(input, ok)
      expectSameState(model, real)
    },
    toString: () => `${ok ? 'resolve' : 'reject'}(running[${index}])`,
  }
}

const dropWaitingCommand: Command = {
  check: () => true,
  async run(model, real) {
    real.engine.pub(real.dropWaiting$)
    await flushPromises()
    model.dropWaiting()
    expectSameState(model, real)
  },
  toString: () => 'dropWaiting',
}

const commands = fc.commands(
  [
    // Roughly one push in ten throws from its start subscriber. Shrinking moves the roll toward 0, so toward no throw.
    fc.tuple(fc.constantFrom('a', 'b'), fc.integer({ max: 9, min: 0 })).map(([key, roll]) => pushCommand(key, roll === 9)),
    fc.tuple(fc.nat(), fc.boolean()).map(([index, ok]) => settleCommand(index, ok)),
    fc.constant(dropWaitingCommand),
  ],
  { maxCommands: 40 }
)

const configs: Config[] = [
  { merge: false, policy: 'parallel' },
  { merge: false, policy: 'serial' },
  { merge: false, policy: 'coalesce' },
  { merge: true, policy: 'coalesce' },
  { merge: false, policy: 'switch' },
]

describe('promiseWork model', () => {
  for (const config of configs) {
    it(`matches the reference model under ${config.policy}${config.merge ? ' with merge' : ''}`, async () => {
      await fc.assert(
        fc.asyncProperty(commands, async (cmds) => {
          const model = new Model(config)
          const real = createReal(config)
          await fc.asyncModelRun(() => ({ model, real }), cmds)

          // Settle everything that is left. Afterwards nothing is pending and no key is stuck: a new input per key
          // starts right away.
          while (model.running.length > 0) {
            // oxlint-disable-next-line no-await-in-loop
            await settleCommand(0, true).run(model, real)
          }
          expect(pendingCountOf(real)).toBe(0)
          for (const key of ['a', 'b']) {
            // oxlint-disable-next-line no-await-in-loop
            await pushCommand(key, false).run(model, real)
          }
          expect(model.running).toHaveLength(2)

          // Every input ends exactly once: settled, dropped, or (under switch) superseded.
          const ended = [...model.settles.map((entry) => entry.slice(entry.indexOf(':') + 1)), ...model.drops, ...model.aborted]
          const endedIds = ended.flatMap((name) => name.split('+'))
          const runningIds = model.running.flatMap((input) => input.ids)
          expect([...endedIds, ...runningIds].toSorted()).toEqual(model.pushed.toSorted())
          real.engine.dispose()
        })
      )
    })
  }
})
