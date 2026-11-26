import type { Engine } from './Engine'

/** Result emitted by the Promise operators, such as {@link switchMapPromise}. */
export type SwitchMapPromiseResult<TInput, TValue> =
  | { input: TInput; status: 'success'; value: TValue }
  | { error: unknown; input: TInput; status: 'error' }

/**
 * How Promise work for the same key is scheduled.
 * - `switch`: a new input aborts the running work and suppresses its result.
 * - `serial`: inputs run one at a time in arrival order.
 * - `coalesce`: one input runs at a time; while it runs, only the newest waiting input is kept.
 * - `exhaust`: one input runs at a time; inputs that arrive while it runs are ignored. The key frees as soon as the work
 *   settles, so it is already free inside subscribers of that result.
 * @hidden
 */
export type PromiseWorkPolicy = 'coalesce' | 'exhaust' | 'serial' | 'switch'

/** @hidden */
export type PromiseWorkProject<TInput, TValue> = (input: TInput, signal: AbortSignal, engine: Engine) => Promise<TValue>

/** @hidden */
export interface PromiseSchedulerOptions<TInput> {
  key?: (input: TInput) => unknown
  merge?: (waiting: TInput, next: TInput) => TInput
}

/** @hidden */
export interface PromiseSchedulerHandlers<TInput, TValue> {
  /** Called after work settles. Not called for superseded or disposed work. */
  onSettle: (result: SwitchMapPromiseResult<TInput, TValue>) => void
}

interface Run {
  controller: AbortController
  live: boolean
}

interface Slot<TInput> {
  active: Run[]
  draining: boolean
  generation: number
  queue: TInput[]
}

/** @hidden */
export interface PromiseScheduler<TInput> {
  push: (input: TInput) => void
}

const noKey = Symbol('noKey')

/**
 * Collects errors from steps that must all run. The first is rethrown at the end; later ones are logged, so one
 * failure never hides another.
 */
function createErrors() {
  let failed = false
  let first: unknown
  const add = (error: unknown) => {
    if (failed) {
      console.error('Promise operator: an additional error occurred while delivering results:', error)
      return
    }
    failed = true
    first = error
  }
  return {
    add,
    rethrow: () => {
      if (failed) {
        // oxlint-disable-next-line no-throw-literal -- rethrowing the original subscriber error
        throw first
      }
    },
    /** Runs one step and collects its error. Returns false if it threw. */
    run: (step: () => void): boolean => {
      try {
        step()
        return true
      } catch (error) {
        add(error)
        return false
      }
    },
  }
}

/**
 * Creates per-engine keyed Promise scheduling state. Every operator instance owns one scheduler.
 * @hidden
 */
export function createPromiseScheduler<TInput, TValue>(
  eng: Engine,
  policy: PromiseWorkPolicy,
  project: PromiseWorkProject<TInput, TValue>,
  options: PromiseSchedulerOptions<TInput>,
  handlers: PromiseSchedulerHandlers<TInput, TValue>
): PromiseScheduler<TInput> {
  const slots = new Map<unknown, Slot<TInput>>()
  const keyOf = options.key ?? (() => noKey)
  const { merge } = options
  let disposed = false

  const isClosed = () => disposed || eng.isDisposed

  const getSlot = (key: unknown) => {
    let slot = slots.get(key)
    if (slot === undefined) {
      slot = { active: [], draining: false, generation: 0, queue: [] }
      slots.set(key, slot)
    }
    return slot
  }

  const releaseSlot = (key: unknown, slot: Slot<TInput>) => {
    if (slots.get(key) === slot && slot.active.length === 0 && slot.queue.length === 0 && !slot.draining) {
      slots.delete(key)
    }
  }

  const removeRun = (slot: Slot<TInput>, run: Run) => {
    run.live = false
    const index = slot.active.indexOf(run)
    if (index !== -1) {
      slot.active.splice(index, 1)
    }
  }

  const canStartNext = (key: unknown, slot: Slot<TInput>) =>
    !isClosed() && slots.get(key) === slot && slot.active.length === 0 && !slot.draining && slot.queue.length > 0

  // Starts waiting inputs until one is left running. A loop rather than recursion, so a long queue of synchronously
  // failing work cannot overflow the stack. A subscriber error does not stall the queue; the first one is rethrown
  // after draining, and later ones are logged.
  const drainSlot = (key: unknown, slot: Slot<TInput>) => {
    const errors = createErrors()
    let settledSynchronously = true
    while (settledSynchronously && canStartNext(key, slot)) {
      // The queue holds at most the next input for coalesce, and every waiting input for serial.
      const input = slot.queue.shift() as TInput
      let returned = false
      // A start that throws settled synchronously: the project threw, and a subscriber of its error threw too.
      const ok = errors.run(() => {
        returned = start(key, slot, input)
      })
      settledSynchronously = !ok || returned
    }
    releaseSlot(key, slot)
    errors.rethrow()
  }

  const settle = (key: unknown, slot: Slot<TInput>, run: Run, result: SwitchMapPromiseResult<TInput, TValue>, drain: boolean) => {
    if (!run.live || isClosed()) {
      return
    }
    removeRun(slot, run)
    const errors = createErrors()
    // While subscribers handle the result, new inputs for this key must wait behind the queued input.
    slot.draining = true
    errors.run(() => {
      handlers.onSettle(result)
    })
    slot.draining = false
    if (drain) {
      errors.run(() => {
        drainSlot(key, slot)
      })
    }
    errors.rethrow()
  }

  /** Starts work for an input. Returns true when the work settled synchronously, so the caller drains the queue. */
  function start(key: unknown, slot: Slot<TInput>, input: TInput): boolean {
    const run: Run = { controller: new AbortController(), live: true }
    slot.active.push(run)

    let promise: Promise<TValue>
    try {
      promise = project(input, run.controller.signal, eng)
    } catch (error) {
      settle(key, slot, run, { error, input, status: 'error' }, false)
      return true
    }

    // The rejection handler must not catch errors thrown by success-result subscribers.
    // oxlint-disable-next-line promise/prefer-catch
    Promise.resolve(promise).then(
      (value) => {
        settle(key, slot, run, { input, status: 'success', value }, true)
        return undefined
      },
      (error: unknown) => {
        settle(key, slot, run, { error, input, status: 'error' }, true)
        return undefined
      }
    )
    return false
  }

  /** Starts an input now and drains the queue if it settled synchronously. */
  const launch = (key: unknown, slot: Slot<TInput>, input: TInput) => {
    const errors = createErrors()
    let returned = false
    const ok = errors.run(() => {
      returned = start(key, slot, input)
    })
    if (!ok || returned) {
      errors.run(() => {
        drainSlot(key, slot)
      })
    }
    errors.rethrow()
  }

  const push = (input: TInput) => {
    if (isClosed()) {
      return
    }
    const key = keyOf(input)
    const slot = getSlot(key)

    if (policy === 'switch') {
      slot.generation += 1
      const owner = slot.generation
      const superseded = slot.active.splice(0)
      for (const run of superseded) {
        run.live = false
      }
      // Abort listeners may publish new inputs; only the newest generation may start.
      for (const run of superseded) {
        run.controller.abort()
      }
      if (isClosed() || slots.get(key) !== slot || slot.generation !== owner) {
        return
      }
      launch(key, slot, input)
      return
    }

    if (policy === 'exhaust') {
      // Only running work makes a key busy. A settled run is removed before its result is delivered, so result
      // subscribers can start new work for the same key.
      if (slot.active.length === 0) {
        launch(key, slot, input)
      }
      return
    }

    if (slot.active.length === 0 && !slot.draining) {
      launch(key, slot, input)
      return
    }

    if (policy === 'coalesce' && slot.queue.length > 0) {
      // The newer input replaces the waiting one, which will never start, unless merge combines them.
      slot.queue[0] = merge === undefined ? input : merge(slot.queue[0] as TInput, input)
      return
    }
    slot.queue.push(input)
  }

  eng.onDispose(() => {
    disposed = true
    const controllers: AbortController[] = []
    for (const slot of slots.values()) {
      slot.generation += 1
      slot.queue.length = 0
      for (const run of slot.active.splice(0)) {
        run.live = false
        controllers.push(run.controller)
      }
    }
    slots.clear()
    for (const controller of controllers) {
      controller.abort()
    }
  })

  return { push }
}
