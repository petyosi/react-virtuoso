import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { Engine } from './Engine'
import { createPromiseScheduler } from './promiseScheduler'

import type { PromiseWorkPolicy } from './promiseScheduler'

// Model-based test: fast-check generates command sequences, runs them against the Promise scheduler and a small
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
  ignored: string[] = []
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
    if (policy === 'exhaust') {
      if (this.runningFor(input.key).length > 0) {
        this.ignored.push(nameOf(input))
        return false
      }
      this.start(input)
      return true
    }
    if (this.runningFor(input.key).length === 0) {
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

/** The system under test: the Promise scheduler in a real engine, with Promises the commands settle. */
interface Real {
  engine: Engine
  requests: Map<string, Deferred>
  scheduler: ReturnType<typeof createPromiseScheduler<Input, string>>
  settles: string[]
  signals: Map<string, AbortSignal>
  starts: string[]
}

function createReal(config: Config): Real {
  const engine = new Engine()
  const requests = new Map<string, Deferred>()
  const settles: string[] = []
  const signals = new Map<string, AbortSignal>()
  const starts: string[] = []
  const mergeInputs = (waiting: Input, next: Input): Input => ({ ids: [...waiting.ids, ...next.ids], key: next.key })
  return {
    engine,
    requests,
    scheduler: createPromiseScheduler<Input, string>(
      engine,
      config.policy,
      (input, signal) =>
        new Promise<string>((resolve, reject) => {
          starts.push(nameOf(input))
          requests.set(nameOf(input), { reject, resolve })
          signals.set(nameOf(input), signal)
        }),
      { key: (input) => input.key, ...(config.merge ? { merge: mergeInputs } : {}) },
      {
        onSettle: (result) => {
          settles.push(`${result.status === 'success' ? 'ok' : 'error'}:${nameOf(result.input)}`)
        },
      }
    ),
    settles,
    signals,
    starts,
  }
}

async function flushPromises() {
  for (let index = 0; index < 5; index++) {
    // oxlint-disable-next-line no-await-in-loop
    await Promise.resolve()
  }
}

// Dropped and ignored inputs are not reported by the scheduler. Matching the exact starts, in order, shows that
// every other input was dropped or ignored as the model says.
function expectSameState(model: Model, real: Real) {
  expect(real.starts).toEqual(model.starts)
  expect(real.settles).toEqual(model.settles)
  const aborted = [...real.signals].flatMap(([name, signal]) => (signal.aborted ? [name] : []))
  expect(aborted.toSorted()).toEqual(model.aborted.toSorted())
}

type Command = fc.AsyncCommand<Model, Real>

function pushCommand(key: string): Command {
  return {
    check: () => true,
    async run(model, real) {
      model.nextId += 1
      const input: Input = { ids: [`${key}${model.nextId}`], key }
      real.scheduler.push(input)
      model.push(input)
      await flushPromises()
      expectSameState(model, real)
    },
    toString: () => `push(${key})`,
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

const commands = fc.commands(
  [
    fc.constantFrom('a', 'b').map((key) => pushCommand(key)),
    fc.tuple(fc.nat(), fc.boolean()).map(([index, ok]) => settleCommand(index, ok)),
  ],
  { maxCommands: 40 }
)

const configs: Config[] = [
  { merge: false, policy: 'serial' },
  { merge: false, policy: 'coalesce' },
  { merge: true, policy: 'coalesce' },
  { merge: false, policy: 'switch' },
  { merge: false, policy: 'exhaust' },
]

describe('Promise scheduler model', () => {
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
          for (const key of ['a', 'b']) {
            // oxlint-disable-next-line no-await-in-loop
            await pushCommand(key).run(model, real)
          }
          expect(model.running).toHaveLength(2)

          // Every input ends exactly once: settled, dropped, ignored (under exhaust), or superseded (under switch).
          const ended = [
            ...model.settles.map((entry) => entry.slice(entry.indexOf(':') + 1)),
            ...model.drops,
            ...model.aborted,
            ...model.ignored,
          ]
          const endedIds = ended.flatMap((name) => name.split('+'))
          const runningIds = model.running.flatMap((input) => input.ids)
          expect([...endedIds, ...runningIds].toSorted()).toEqual(model.pushed.toSorted())
          real.engine.dispose()
        })
      )
    })
  }
})
