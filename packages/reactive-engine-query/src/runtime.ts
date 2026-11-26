import type { Key } from './types'
import type { Engine } from '@virtuoso.dev/reactive-engine-core'

/** The most items one drain processes before it treats the work as a synchronous feedback loop. */
export const DRAIN_CAP = 10_000

/** Stands in for the record key of a primitive created with `key: false`. */
export const SINGLE_RECORD: unique symbol = Symbol('single record')

/**
 * Reads `process.env.NODE_ENV` at call time. Bundlers replace the expression; in unbundled ESM, where `process` does
 * not exist, the read throws and the check reports production.
 */
export function isDevelopment(): boolean {
  let development = false
  try {
    development = process.env.NODE_ENV !== 'production'
  } catch {
    // No `process` global: treat as production.
  }
  return development
}

/** Throws unless `key` is a string or a finite number. An invalid key is a programming error. */
export function assertKey(key: unknown, primitive: string): asserts key is Key {
  if (typeof key === 'string' || (typeof key === 'number' && Number.isFinite(key))) {
    return
  }
  throw new TypeError(`${primitive}: a key must be a string or a finite number, got ${describeValue(key)}.`)
}

function describeValue(value: unknown): string {
  if (typeof value === 'number') {
    return String(value)
  }
  if (value === null) {
    return 'null'
  }
  return typeof value
}

/**
 * Collects the errors of one drain. The first is rethrown once the queue is drained; later ones are logged, so one
 * failure never hides another.
 */
export interface DrainErrors {
  add: (error: unknown) => void
  rethrow: () => void
  /** Runs one step, such as a publication. A throw is collected, so the next steps still run. */
  step: (run: () => void) => void
}

function createDrainErrors(primitive: string): DrainErrors {
  let failed = false
  let first: unknown
  const add = (error: unknown) => {
    if (failed) {
      console.error(`${primitive}: an additional error occurred while delivering updates:`, error)
      return
    }
    failed = true
    first = error
  }
  return {
    add,
    rethrow: () => {
      if (failed) {
        // oxlint-disable-next-line no-throw-literal -- rethrowing the original error
        throw first
      }
    },
    step: (run) => {
      try {
        run()
      } catch (error) {
        add(error)
      }
    },
  }
}

/**
 * A FIFO queue of commands and scheduler events for one primitive in one engine.
 *
 * A command enqueued while nothing is being processed is processed at once, inside the caller. Anything enqueued
 * while an item is being processed (for example by a subscriber reacting to a publication of that item) is appended
 * and runs after the current item. The queue is drained before control returns to the caller that started the drain.
 */
export class CommandQueue<TItem> {
  private readonly isClosed: () => boolean
  private readonly items: TItem[] = []
  private readonly primitive: string
  private readonly process: (item: TItem, errors: DrainErrors) => void
  private processing = false

  constructor(primitive: string, process: (item: TItem, errors: DrainErrors) => void, isClosed: () => boolean) {
    this.primitive = primitive
    this.process = process
    this.isClosed = isClosed
  }

  clear() {
    this.items.length = 0
  }

  enqueue(item: TItem) {
    if (this.isClosed()) {
      return
    }
    this.items.push(item)
    if (this.processing) {
      return
    }
    this.processing = true
    const errors = createDrainErrors(this.primitive)
    let processed = 0
    try {
      while (this.items.length > 0 && !this.isClosed()) {
        processed += 1
        if (processed > DRAIN_CAP) {
          this.items.length = 0
          errors.add(
            new Error(
              `${this.primitive}: processed more than ${DRAIN_CAP} updates in one drain, so the remaining ones were discarded. ` +
                'This usually means a subscriber or callback republishes synchronously in a loop, such as an onIgnored handler ' +
                'that publishes the same params to mutate$ again.'
            )
          )
          break
        }
        const next = this.items.shift() as TItem
        try {
          this.process(next, errors)
        } catch (error) {
          errors.add(error)
        }
      }
    } finally {
      this.processing = false
    }
    errors.rethrow()
  }
}

/**
 * Tracks the engines that own a primitive. Registering a primitive in an engine that is an ancestor of an existing
 * owner creates a second instance, which duplicates calls. That setup is unsupported; this warns about it in
 * development.
 */
export function trackOwner(owners: Set<Engine>, engine: Engine, primitive: string) {
  if (isDevelopment()) {
    for (const owner of owners) {
      if (engine.isAncestorOf(owner)) {
        console.warn(
          `${primitive}: this primitive was first used in a child engine, and is now used in one of its ancestors. ` +
            'That creates two instances, which can run calls twice, and is unsupported. Register shared primitives in the ' +
            'root engine at startup, for example root.register(mutation.mutate$).'
        )
        break
      }
    }
  }
  owners.add(engine)
  engine.onDispose(() => {
    owners.delete(engine)
  })
}
