import { addNodeInit, Cell, Stream } from '@virtuoso.dev/reactive-engine-core'

import { assertKey, CommandQueue, SINGLE_RECORD, trackOwner } from './runtime'
import { defaultRetryDelay, executeWithRetry } from './utils'

import type { DrainErrors } from './runtime'
import type {
  ConcurrentMutationOptions,
  ConcurrentMutationSettled,
  ConcurrentMutationState,
  Key,
  KeyedConcurrentMutationOptions,
  UnkeyedConcurrentMutationOptions,
} from './types'
import type { Engine, NodeRef, StateRef } from '@virtuoso.dev/reactive-engine-core'

/** The nodes of a `ConcurrentMutation` created with `key: false`. */
export interface UnkeyedConcurrentMutation<TParams, TData> {
  /** The record's state. It starts empty: not pending, no calls, no failures, no `lastSuccess`. */
  data$: StateRef<ConcurrentMutationState<TParams, TData>>
  /** Clears `failures` and `lastSuccess`. Never touches running or waiting calls. */
  dismiss$: NodeRef<void>
  /** Drops every waiting call; each ends as `dropped`. Running calls are not touched. */
  dropWaiting$: NodeRef<void>
  /** Makes a call, scheduled by the `concurrency` policy. */
  mutate$: NodeRef<TParams>
  /** One outcome per call: `success`, `error`, or `dropped`. */
  settled$: NodeRef<ConcurrentMutationSettled<TData, TParams>>
}

/** The nodes of a `ConcurrentMutation` with one record per key. */
export interface KeyedConcurrentMutation<TParams, TData, TKey extends Key> {
  /** Clears one record's `failures` and `lastSuccess`. Never touches running or waiting calls. */
  dismiss$: NodeRef<TKey>
  /** Clears `failures` and `lastSuccess` of every record. */
  dismissAll$: NodeRef<void>
  /** Drops one record's waiting calls; each ends as `dropped`. */
  dropWaiting$: NodeRef<TKey>
  /** Drops every record's waiting calls. */
  dropWaitingAll$: NodeRef<void>
  /** Makes a call, scheduled per record by the `concurrency` policy. */
  mutate$: NodeRef<TParams>
  /** One outcome per call: `success`, `error`, or `dropped`, each with `key`. */
  settled$: NodeRef<ConcurrentMutationSettled<TData, TParams, TKey>>
  /** One entry per record that has running or waiting calls, failures, or a `lastSuccess`. A key with no entry is idle. */
  status$: StateRef<ReadonlyMap<TKey, ConcurrentMutationState<TParams, TData, TKey>>>
}

type RecordKey = Key | typeof SINGLE_RECORD

interface Call<TParams> {
  readonly controller: AbortController
  readonly key: RecordKey
  readonly params: TParams
}

interface RecordState<TParams, TData> {
  failures: ConcurrentMutationState<TParams, TData>['failures']
  lastSuccess: ConcurrentMutationState<TParams, TData>['lastSuccess']
  running: readonly Call<TParams>[]
  /** A start-next item is queued for this record, so it counts as occupied. */
  startPending: boolean
  /** The last published state, reused so unchanged arrays and entries keep their identity. */
  view: ConcurrentMutationState<TParams, TData, Key> | null
  waiting: readonly Call<TParams>[]
}

type Item<TParams, TData> =
  | { all: boolean; key: unknown; type: 'dismiss' }
  | { all: boolean; key: unknown; type: 'dropWaiting' }
  | { call: Call<TParams>; data: TData; type: 'success' }
  | { call: Call<TParams>; error: unknown; type: 'error' }
  | { key: RecordKey; type: 'startNext' }
  | { params: TParams; type: 'mutate' }

const emptyState: ConcurrentMutationState<never, never> = {
  failures: [],
  isPending: false,
  lastSuccess: null,
  running: [],
  waiting: [],
}

/**
 * Creates a mutation for writes where every new call carries a value the server must receive, such as a toggle that
 * saves on every click, or autosave while typing. Calls for the same record can overlap; `concurrency` decides how:
 *
 * - `coalesce`: one call per record at a time, and only the newest waiting params are kept (latest value wins).
 * - `serial`: one call per record at a time, in arrival order (every call matters, in order).
 * - `parallel`: every call starts immediately (calls are independent).
 *
 * When a second call would be a duplicate, such as a double click on Delete, use {@link Mutation} instead.
 *
 * `key` is required. With a key function, each key is a record and the state is `status$`, a map; with `key: false`,
 * the whole mutation is one record and the state is `data$`. A call that started is never aborted; its signal aborts
 * only when the engine is disposed.
 *
 * @example
 * ```typescript
 * const saveDone = ConcurrentMutation<{ id: number; done: boolean }, Task, number>({
 *   mutationFn: ({ id, done }, signal) => api.updateTask(id, { done }, signal),
 *   concurrency: 'coalesce',
 *   key: ({ id }) => id,
 *   onSuccess: (_task, _params, engine) => {
 *     engine.pub(tasksQuery.refetch$)
 *   },
 * })
 * ```
 *
 * @category Query
 */
export function ConcurrentMutation<TParams, TData, TKey extends Key = never>(
  options: KeyedConcurrentMutationOptions<TParams, TData, TKey>
): KeyedConcurrentMutation<TParams, TData, TKey>
export function ConcurrentMutation<TParams, TData>(
  options: UnkeyedConcurrentMutationOptions<TParams, TData>
): UnkeyedConcurrentMutation<TParams, TData>
export function ConcurrentMutation<TParams, TData, TKey extends Key = never>(
  options: ConcurrentMutationOptions<TParams, TData, TKey>
): KeyedConcurrentMutation<TParams, TData, TKey> | UnkeyedConcurrentMutation<TParams, TData>
export function ConcurrentMutation<TParams, TData, TKey extends Key = never>(
  options: ConcurrentMutationOptions<TParams, TData, TKey>
): KeyedConcurrentMutation<TParams, TData, TKey> | UnkeyedConcurrentMutation<TParams, TData> {
  const keyFn = options.key === false ? null : options.key
  const { concurrency } = options
  const merge = options.concurrency === 'coalesce' ? options.merge : undefined
  const mutate$ = Stream<TParams>(false)
  const settled$ = Stream<unknown>(false)
  const dismiss$ = Stream<unknown>(false)
  const dismissAll$ = Stream<void>(false)
  const dropWaiting$ = Stream<unknown>(false)
  const dropWaitingAll$ = Stream<void>(false)
  const data$ = Cell<ConcurrentMutationState<TParams, TData>>(emptyState)
  const status$ = Cell<ReadonlyMap<Key, ConcurrentMutationState<TParams, TData, Key>>>(new Map())
  const nodes: NodeRef[] =
    keyFn === null
      ? [mutate$, settled$, dismiss$, dropWaiting$, data$]
      : [mutate$, settled$, dismiss$, dismissAll$, dropWaiting$, dropWaitingAll$, status$]
  const owners = new Set<Engine>()
  const retry = options.retry === false ? 0 : (options.retry ?? 0)
  const retryDelay = options.retryDelay ?? defaultRetryDelay

  addNodeInit(
    (engine) => {
      trackOwner(owners, engine, 'ConcurrentMutation')
      for (const node of nodes) {
        engine.register(node)
      }

      let closed = false
      const isClosed = () => closed || engine.isDisposed
      const pub = <T>(node: NodeRef<T>, value: T) => {
        if (!isClosed()) {
          engine.pub(node, value)
        }
      }
      const records = new Map<RecordKey, RecordState<TParams, TData>>()
      let keyed: ReadonlyMap<Key, ConcurrentMutationState<TParams, TData, Key>> = new Map()
      let single: ConcurrentMutationState<TParams, TData> = emptyState

      const keyFields = (key: RecordKey) => (key === SINGLE_RECORD ? {} : { key })

      const recordFor = (key: RecordKey) => {
        let record = records.get(key)
        if (record === undefined) {
          record = { failures: [], lastSuccess: null, running: [], startPending: false, view: null, waiting: [] }
          records.set(key, record)
        }
        return record
      }

      const isEmpty = (record: RecordState<TParams, TData>) =>
        record.running.length === 0 && record.waiting.length === 0 && record.failures.length === 0 && record.lastSuccess === null

      const viewOf = (key: RecordKey, record: RecordState<TParams, TData>): ConcurrentMutationState<TParams, TData, Key> => {
        const previous = record.view
        const running = previous !== null && sameCalls(previous.running, record.running) ? previous.running : record.running.map(paramsOf)
        const waiting = previous !== null && sameCalls(previous.waiting, record.waiting) ? previous.waiting : record.waiting.map(paramsOf)
        const isPending = running.length > 0 || waiting.length > 0
        if (
          previous !== null &&
          previous.running === running &&
          previous.waiting === waiting &&
          previous.failures === record.failures &&
          previous.lastSuccess === record.lastSuccess
        ) {
          return previous
        }
        return {
          failures: record.failures,
          isPending,
          lastSuccess: record.lastSuccess,
          running,
          waiting,
          ...keyFields(key),
        } as ConcurrentMutationState<TParams, TData, Key>
      }

      // Tracks which call objects produced the params arrays in the last published view.
      const viewCalls = new WeakMap<readonly TParams[], readonly Call<TParams>[]>()
      const sameCalls = (params: readonly TParams[], calls: readonly Call<TParams>[]) => viewCalls.get(params) === calls
      const paramsOf = (call: Call<TParams>) => call.params

      /** Recomputes a record's view, reusing the previous view and arrays when they did not change. */
      const refreshView = (key: RecordKey, record: RecordState<TParams, TData>) => {
        const previous = record.view
        const view = viewOf(key, record)
        if (view !== previous) {
          viewCalls.set(view.running, record.running)
          viewCalls.set(view.waiting, record.waiting)
        }
        record.view = isEmpty(record) ? null : view
        return view
      }

      /** Publishes the state of the given records in one publication, or nothing if no view changed. */
      const publishStates = (keys: readonly RecordKey[], errors: DrainErrors) => {
        if (keyFn === null) {
          const record = recordFor(SINGLE_RECORD)
          const view = refreshView(SINGLE_RECORD, record)
          const value = (isEmpty(record) ? emptyState : view) as ConcurrentMutationState<TParams, TData>
          if (value === single) {
            return
          }
          single = value
          errors.step(() => {
            pub(data$, value)
          })
          return
        }
        let next: Map<Key, ConcurrentMutationState<TParams, TData, Key>> | null = null
        for (const key of keys as Key[]) {
          const record = recordFor(key)
          const view = refreshView(key, record)
          const current = keyed.get(key)
          if (isEmpty(record)) {
            if (current !== undefined) {
              next ??= new Map(keyed)
              next.delete(key)
            }
          } else if (current !== view) {
            next ??= new Map(keyed)
            next.set(key, view)
          }
        }
        if (next === null) {
          return
        }
        keyed = next
        const value = next
        errors.step(() => {
          pub(status$, value)
        })
      }

      const publishState = (key: RecordKey, errors: DrainErrors) => {
        publishStates([key], errors)
      }

      const releaseIfIdle = (key: RecordKey) => {
        const record = records.get(key)
        if (record !== undefined && isEmpty(record) && !record.startPending) {
          records.delete(key)
        }
      }

      const start = (call: Call<TParams>) => {
        const { signal } = call.controller
        // oxlint-disable-next-line promise/catch-or-return, promise/prefer-catch -- settle errors surface as unhandled rejections by design
        void executeWithRetry(() => options.mutationFn(call.params, signal), { retry, retryDelay, signal }).then(
          (data) => {
            queue.enqueue({ call, data, type: 'success' })
            return undefined
          },
          (error: unknown) => {
            queue.enqueue({ call, error, type: 'error' })
            return undefined
          }
        )
      }

      const startCall = (call: Call<TParams>, errors: DrainErrors) => {
        const record = recordFor(call.key)
        record.running = [...record.running, call]
        publishState(call.key, errors)
        if (!isClosed()) {
          start(call)
        }
      }

      const runCallback = (name: string, callback: () => void) => {
        try {
          callback()
        } catch (error) {
          console.error(`ConcurrentMutation ${name} callback error:`, error)
        }
      }

      const emitDropped = (calls: readonly Call<TParams>[], errors: DrainErrors) => {
        for (const call of calls) {
          errors.step(() => {
            pub(settled$, { params: call.params, type: 'dropped', ...keyFields(call.key) })
          })
        }
      }

      const keysFor = (item: { all: boolean; key: unknown }): RecordKey[] => {
        if (keyFn === null) {
          return [SINGLE_RECORD]
        }
        if (item.all) {
          return [...records.keys()]
        }
        assertKey(item.key, 'ConcurrentMutation')
        return [item.key]
      }

      const process = (item: Item<TParams, TData>, errors: DrainErrors) => {
        switch (item.type) {
          case 'mutate': {
            let key: RecordKey = SINGLE_RECORD
            if (keyFn !== null) {
              const computed: unknown = keyFn(item.params)
              assertKey(computed, 'ConcurrentMutation')
              key = computed
            }
            const call: Call<TParams> = { controller: new AbortController(), key, params: item.params }
            const record = recordFor(key)
            const occupied = record.running.length > 0 || record.waiting.length > 0 || record.startPending
            if (concurrency === 'parallel' || !occupied) {
              startCall(call, errors)
              return
            }
            if (concurrency === 'serial') {
              record.waiting = [...record.waiting, call]
              publishState(key, errors)
              return
            }
            const [waiting] = record.waiting
            if (waiting === undefined) {
              record.waiting = [call]
              publishState(key, errors)
              return
            }
            if (merge !== undefined) {
              // A throwing merge leaves the waiting call unchanged; the error is rethrown as a programming error.
              const params = merge(waiting.params, item.params)
              record.waiting = [{ controller: waiting.controller, key, params }]
              publishState(key, errors)
              return
            }
            record.waiting = [call]
            publishState(key, errors)
            emitDropped([waiting], errors)
            return
          }
          case 'success':
          case 'error': {
            const { call } = item
            const record = records.get(call.key)
            if (record === undefined || !record.running.includes(call)) {
              return
            }
            record.running = record.running.filter((running) => running !== call)
            const settledAt = Date.now()
            const fields = keyFields(call.key)
            if (item.type === 'success') {
              const { data } = item
              record.lastSuccess = { data, params: call.params, settledAt }
              publishState(call.key, errors)
              errors.step(() => {
                pub(settled$, { data, params: call.params, type: 'success', ...fields })
              })
              if (!isClosed() && options.onSuccess !== undefined) {
                const { onSuccess } = options
                runCallback('onSuccess', () => {
                  onSuccess(data, call.params, engine)
                })
              }
            } else {
              const { error } = item
              record.failures = [...record.failures, { error, params: call.params, settledAt }]
              publishState(call.key, errors)
              errors.step(() => {
                pub(settled$, { error, params: call.params, type: 'error', ...fields })
              })
              if (!isClosed() && options.onError !== undefined) {
                const { onError } = options
                runCallback('onError', () => {
                  onError(error, call.params, engine)
                })
              }
            }
            // The next waiting call starts after commands queued while this settle was delivered.
            if (concurrency !== 'parallel' && record.waiting.length > 0 && !record.startPending) {
              record.startPending = true
              queue.enqueue({ key: call.key, type: 'startNext' })
            }
            releaseIfIdle(call.key)
            return
          }
          case 'startNext': {
            const record = records.get(item.key)
            if (record === undefined) {
              return
            }
            record.startPending = false
            const [next, ...rest] = record.waiting
            if (next === undefined) {
              releaseIfIdle(item.key)
              return
            }
            record.waiting = rest
            startCall(next, errors)
            return
          }
          case 'dismiss': {
            const changed: RecordKey[] = []
            for (const key of keysFor(item)) {
              const record = records.get(key)
              if (record === undefined || (record.failures.length === 0 && record.lastSuccess === null)) {
                continue
              }
              record.failures = []
              record.lastSuccess = null
              changed.push(key)
            }
            // One publication, however many records changed.
            publishStates(changed, errors)
            for (const key of changed) {
              releaseIfIdle(key)
            }
            return
          }
          case 'dropWaiting': {
            const changed: RecordKey[] = []
            const dropped: Call<TParams>[] = []
            for (const key of keysFor(item)) {
              const record = records.get(key)
              if (record === undefined || record.waiting.length === 0) {
                continue
              }
              dropped.push(...record.waiting)
              record.waiting = []
              changed.push(key)
            }
            publishStates(changed, errors)
            emitDropped(dropped, errors)
            for (const key of changed) {
              releaseIfIdle(key)
            }
            return
          }
          default:
            // oxlint-disable-next-line no-useless-return
            return
        }
      }

      // Commands discarded by the drain cap are lost, but a discarded start-next item is re-issued in a fresh drain, so
      // the record's waiting calls still start.
      const queue: CommandQueue<Item<TParams, TData>> = new CommandQueue<Item<TParams, TData>>(
        'ConcurrentMutation',
        process,
        isClosed,
        (items) => {
          const starts = items.filter((item) => item.type === 'startNext')
          if (starts.length > 0) {
            queueMicrotask(() => {
              for (const item of starts) {
                queue.enqueue(item)
              }
            })
          }
        }
      )

      engine.onDispose(() => {
        closed = true
        queue.clear()
        for (const record of records.values()) {
          for (const call of record.running) {
            call.controller.abort()
          }
        }
        records.clear()
      })

      engine.sub(mutate$, (params) => {
        queue.enqueue({ params, type: 'mutate' })
      })
      engine.sub(dismiss$, (key) => {
        queue.enqueue({ all: false, key, type: 'dismiss' })
      })
      engine.sub(dropWaiting$, (key) => {
        queue.enqueue({ all: false, key, type: 'dropWaiting' })
      })
      if (keyFn !== null) {
        engine.sub(dismissAll$, () => {
          queue.enqueue({ all: true, key: undefined, type: 'dismiss' })
        })
        engine.sub(dropWaitingAll$, () => {
          queue.enqueue({ all: true, key: undefined, type: 'dropWaiting' })
        })
      }
    },
    ...nodes
  )

  if (keyFn === null) {
    return {
      data$,
      dismiss$: dismiss$ as NodeRef<void>,
      dropWaiting$: dropWaiting$ as NodeRef<void>,
      mutate$,
      settled$: settled$ as NodeRef<ConcurrentMutationSettled<TData, TParams>>,
    }
  }
  return {
    dismiss$: dismiss$ as NodeRef<TKey>,
    dismissAll$,
    dropWaiting$: dropWaiting$ as NodeRef<TKey>,
    dropWaitingAll$,
    mutate$,
    settled$: settled$ as NodeRef<ConcurrentMutationSettled<TData, TParams, TKey>>,
    status$: status$ as unknown as StateRef<ReadonlyMap<TKey, ConcurrentMutationState<TParams, TData, TKey>>>,
  }
}
