import type { Engine } from './Engine'

/** Result emitted by the Promise operators, such as {@link switchMapPromise}. */
export type SwitchMapPromiseResult<TInput, TValue> =
  | { input: TInput; status: 'success'; value: TValue }
  | { error: unknown; input: TInput; status: 'error' }

/**
 * How Promise work for the same key is scheduled.
 * - `parallel`: every input starts immediately; results arrive in completion order.
 * - `switch`: a new input aborts the running work and suppresses its result.
 * - `serial`: inputs run one at a time in arrival order.
 * - `coalesce`: one input runs at a time; while it runs, only the newest waiting input is kept.
 * @hidden
 */
export type PromiseWorkPolicy = 'coalesce' | 'parallel' | 'serial' | 'switch'

/** @hidden */
export type PromiseWorkProject<TInput, TValue> = (input: TInput, signal: AbortSignal, engine: Engine) => Promise<TValue>

/** @hidden */
export interface PromiseSchedulerOptions<TInput> {
  key?: (input: TInput) => unknown
  merge?: (waiting: TInput, next: TInput) => TInput
}

/** @hidden */
export interface PromiseSchedulerHandlers<TInput, TValue> {
  /** Called with the pending count when an input is queued or merged without starting work. */
  onQueue?: (pendingCount: number) => void
  /** Called with the pending count after work settles. Not called for superseded or cancelled work. */
  onSettle: (result: SwitchMapPromiseResult<TInput, TValue>, pendingCount: number) => void
  /** Called with the pending count right before the project starts. */
  onStart?: (input: TInput, pendingCount: number) => void
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
  /** Drops every running and waiting call. Returns the controllers of the dropped calls so the caller can abort them. */
  cancel: () => AbortController[]
  /** Counts running and waiting work across all keys. */
  pendingCount: () => number
  push: (input: TInput) => void
}

const noKey = Symbol('noKey')

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
  const merge = options.merge ?? ((_waiting: TInput, next: TInput) => next)
  let disposed = false

  const isClosed = () => disposed || eng.isDisposed

  const pendingCount = () => {
    let count = 0
    for (const slot of slots.values()) {
      count += slot.active.length + slot.queue.length
    }
    return count
  }

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
  // after draining.
  const drainSlot = (key: unknown, slot: Slot<TInput>) => {
    let failed = false
    let failure: unknown
    while (canStartNext(key, slot)) {
      try {
        // The queue holds at most the next input for coalesce, and every waiting input for serial.
        if (!start(key, slot, slot.queue.shift() as TInput)) {
          break
        }
      } catch (error) {
        if (!failed) {
          failed = true
          failure = error
        }
      }
    }
    releaseSlot(key, slot)
    if (failed) {
      // oxlint-disable-next-line no-throw-literal -- rethrowing the original subscriber error
      throw failure
    }
  }

  const settle = (key: unknown, slot: Slot<TInput>, run: Run, result: SwitchMapPromiseResult<TInput, TValue>, drain: boolean) => {
    if (!run.live || isClosed()) {
      return
    }
    removeRun(slot, run)
    // While subscribers handle the result, new inputs for this key must wait behind the queued input.
    slot.draining = true
    try {
      handlers.onSettle(result, pendingCount())
    } finally {
      slot.draining = false
      if (drain) {
        drainSlot(key, slot)
      }
    }
  }

  /** Starts work for an input. Returns true when the work settled synchronously, so the caller drains the queue. */
  function start(key: unknown, slot: Slot<TInput>, input: TInput): boolean {
    const run: Run = { controller: new AbortController(), live: true }
    slot.active.push(run)
    handlers.onStart?.(input, pendingCount())
    if (!run.live || isClosed()) {
      return false
    }

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
    let settledSynchronously: boolean
    try {
      settledSynchronously = start(key, slot, input)
    } catch (error) {
      drainSlot(key, slot)
      throw error
    }
    if (settledSynchronously) {
      drainSlot(key, slot)
    }
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

    if (policy === 'parallel') {
      launch(key, slot, input)
      return
    }

    const busy = slot.active.length > 0 || slot.draining
    if (!busy) {
      launch(key, slot, input)
      return
    }

    if (policy === 'coalesce' && slot.queue.length > 0) {
      slot.queue[0] = merge(slot.queue[0] as TInput, input)
    } else {
      slot.queue.push(input)
    }
    handlers.onQueue?.(pendingCount())
  }

  const cancel = () => {
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
    return controllers
  }

  eng.onDispose(() => {
    disposed = true
    for (const controller of cancel()) {
      controller.abort()
    }
  })

  return { cancel, pendingCount, push }
}
