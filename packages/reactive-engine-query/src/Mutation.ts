import { addNodeInit, Cell, Stream } from '@virtuoso.dev/reactive-engine-core'

import { assertKey, CommandQueue, isDevelopment, SINGLE_RECORD, trackOwner } from './runtime'
import { defaultRetryDelay, executeWithRetry } from './utils'

import type { DrainErrors } from './runtime'
import type {
  Key,
  KeyedMutationOptions,
  MutationActiveResult,
  MutationErrorResult,
  MutationIdleResult,
  MutationOptions,
  MutationPendingResult,
  MutationResult,
  MutationSettled,
  MutationSuccessResult,
  UnkeyedMutationOptions,
} from './types'
import type { Engine, NodeRef, StateRef } from '@virtuoso.dev/reactive-engine-core'

const idle: MutationIdleResult = {
  data: null,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  type: 'idle',
}

/** The nodes of a `Mutation` created with `key: false`. */
export interface UnkeyedMutation<TParams, TData> {
  /** The record's state: `idle`, `pending`, `success`, or `error`. A settled result stays until dismissed. */
  data$: StateRef<MutationResult<TData, TParams>>
  /** Dismisses a settled result. Never touches a pending call. */
  dismiss$: NodeRef<void>
  /** Starts a call, unless one is in flight; then the call is ignored. */
  mutate$: NodeRef<TParams>
  /** One outcome per `mutate$` input: `success`, `error`, or `ignored`. */
  settled$: NodeRef<MutationSettled<TData, TParams>>
}

/** The nodes of a `Mutation` with one record per key. */
export interface KeyedMutation<TParams, TData, TKey extends Key> {
  /** Dismisses one record's settled result. Never touches a pending call. */
  dismiss$: NodeRef<TKey>
  /** Dismisses every settled result. Never touches pending calls. */
  dismissAll$: NodeRef<void>
  /** Starts a call, unless the record has one in flight; then the call is ignored. */
  mutate$: NodeRef<TParams>
  /** One outcome per `mutate$` input: `success`, `error`, or `ignored`, each with `key`. */
  settled$: NodeRef<MutationSettled<TData, TParams, TKey>>
  /** One entry per record that is pending or has a settled result. A key with no entry is idle. */
  status$: StateRef<ReadonlyMap<TKey, MutationActiveResult<TData, TParams, TKey>>>
}

type RecordKey = Key | typeof SINGLE_RECORD

interface Call<TParams> {
  readonly controller: AbortController
  readonly key: RecordKey
  readonly params: TParams
}

type Item<TParams, TData> =
  | { call: Call<TParams>; data: TData; type: 'success' }
  | { call: Call<TParams>; error: unknown; type: 'error' }
  | { key: unknown; type: 'dismiss' }
  | { params: TParams; type: 'mutate' }
  | { type: 'dismissAll' }

/**
 * Creates a mutation that runs one call at a time per record. A call for a record that has a call in flight is
 * ignored: it is never sent, `settled$` reports it as `ignored`, and the UI is expected to disable the control while
 * the record is pending. Use it for actions where a second request would be a duplicate: create, delete, submit,
 * per-row actions. When every call carries a new value that must reach the server, such as a toggle that saves on each
 * click, use {@link ConcurrentMutation}.
 *
 * `key` is required. With a key function, each key is a record and the state is `status$`, a map; with `key: false`,
 * the whole mutation is one record and the state is `data$`. Pass the key type as the third type argument, for example
 * `Mutation<Task, Task, number>`; with `<TParams, TData>` alone, a key function is a compile error.
 *
 * A call that started is never aborted, because aborting a request does not undo it on the server. Its signal aborts
 * only when the engine is disposed.
 *
 * @example
 * ```typescript
 * const deleteTask = Mutation<{ id: number }, void, number>({
 *   mutationFn: ({ id }, signal) => api.deleteTask(id, signal),
 *   key: ({ id }) => id,
 *   onSuccess: (_data, { id }, engine) => {
 *     engine.pub(tasksQuery.refetch$)
 *     engine.pub(deleteTask.dismiss$, id)
 *   },
 * })
 * ```
 *
 * @category Query
 */
export function Mutation<TParams, TData, TKey extends Key = never>(
  options: KeyedMutationOptions<TParams, TData, TKey>
): KeyedMutation<TParams, TData, TKey>
export function Mutation<TParams, TData>(options: UnkeyedMutationOptions<TParams, TData>): UnkeyedMutation<TParams, TData>
export function Mutation<TParams, TData, TKey extends Key = never>(
  options: MutationOptions<TParams, TData, TKey>
): KeyedMutation<TParams, TData, TKey> | UnkeyedMutation<TParams, TData>
export function Mutation<TParams, TData, TKey extends Key = never>(
  options: MutationOptions<TParams, TData, TKey>
): KeyedMutation<TParams, TData, TKey> | UnkeyedMutation<TParams, TData> {
  const keyFn = options.key === false ? null : options.key
  // Commands are events: equal params published twice make two calls.
  const mutate$ = Stream<TParams>(false)
  const settled$ = Stream<unknown>(false)
  const dismiss$ = Stream<unknown>(false)
  const dismissAll$ = Stream<void>(false)
  const data$ = Cell<MutationResult<TData, TParams>>(idle)
  const status$ = Cell<ReadonlyMap<Key, MutationActiveResult<TData, TParams, Key>>>(new Map())
  const nodes: NodeRef[] = keyFn === null ? [mutate$, settled$, dismiss$, data$] : [mutate$, settled$, dismiss$, dismissAll$, status$]
  const owners = new Set<Engine>()
  const retry = options.retry === false ? 0 : (options.retry ?? 0)
  const retryDelay = options.retryDelay ?? defaultRetryDelay

  addNodeInit(
    (engine) => {
      trackOwner(owners, engine, 'Mutation')
      // The whole primitive lives in one engine, so its state and its queue cannot be split across engines.
      for (const node of nodes) {
        engine.register(node)
      }

      let closed = false
      const isClosed = () => closed || engine.isDisposed
      // Publishes nothing once the engine is disposed, even in the middle of an item.
      const pub = <T>(node: NodeRef<T>, value: T) => {
        if (!isClosed()) {
          engine.pub(node, value)
        }
      }
      const running = new Map<RecordKey, Call<TParams>>()
      let single: MutationResult<TData, TParams> = idle
      let keyed: ReadonlyMap<Key, MutationActiveResult<TData, TParams, Key>> = new Map()

      const keyFields = (key: RecordKey) => (key === SINGLE_RECORD ? {} : { key })

      /** Publishes a record's new result; `null` makes the record idle. Keyed results get their `key` here. */
      const publishState = (key: RecordKey, result: MutationActiveResult<TData, TParams> | null, errors: DrainErrors) => {
        if (key === SINGLE_RECORD) {
          single = result ?? idle
          const value = single
          errors.step(() => {
            pub(data$, value)
          })
          return
        }
        const next = new Map(keyed)
        if (result === null) {
          next.delete(key)
        } else {
          next.set(key, { ...result, key } as MutationActiveResult<TData, TParams, Key>)
        }
        keyed = next
        errors.step(() => {
          pub(status$, next)
        })
      }

      const settledResult = (key: RecordKey): boolean => {
        const result = key === SINGLE_RECORD ? single : keyed.get(key)
        return result !== undefined && (result.type === 'success' || result.type === 'error')
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

      const runCallback = (name: string, callback: () => void) => {
        try {
          callback()
        } catch (error) {
          console.error(`Mutation ${name} callback error:`, error)
        }
      }

      const process = (item: Item<TParams, TData>, errors: DrainErrors) => {
        switch (item.type) {
          case 'mutate': {
            const { params } = item
            let key: RecordKey = SINGLE_RECORD
            if (keyFn !== null) {
              const computed: unknown = keyFn(params)
              assertKey(computed, 'Mutation')
              key = computed
            }
            if (running.has(key)) {
              const outcome = { params, type: 'ignored' as const, ...keyFields(key) }
              errors.step(() => {
                pub(settled$, outcome)
              })
              if (isClosed()) {
                return
              }
              if (options.onIgnored === undefined) {
                if (isDevelopment()) {
                  console.warn(
                    `Mutation: a call was ignored because ${key === SINGLE_RECORD ? 'the mutation' : `record ${JSON.stringify(key)}`} ` +
                      'has a call in flight. Disable the control while the record is pending, or use ConcurrentMutation if each call ' +
                      'carries a new value. If ignoring is intended, for example as double-submit protection, pass onIgnored.'
                  )
                }
              } else {
                const { onIgnored } = options
                runCallback('onIgnored', () => {
                  onIgnored(params, engine)
                })
              }
              return
            }
            const call: Call<TParams> = { controller: new AbortController(), key, params }
            running.set(key, call)
            const pending: MutationPendingResult<TParams> = {
              data: null,
              error: null,
              isError: false,
              isPending: true,
              isSuccess: false,
              params,
              type: 'pending',
            }
            publishState(key, pending, errors)
            if (!isClosed()) {
              start(call)
            }
            return
          }
          case 'success':
          case 'error': {
            const { call } = item
            if (running.get(call.key) !== call) {
              return
            }
            running.delete(call.key)
            const settledAt = Date.now()
            const fields = keyFields(call.key)
            if (item.type === 'success') {
              const { data } = item
              const success: MutationSuccessResult<TData, TParams> = {
                data,
                error: null,
                isError: false,
                isPending: false,
                isSuccess: true,
                params: call.params,
                settledAt,
                type: 'success',
              }
              publishState(call.key, success, errors)
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
              const failure: MutationErrorResult<TParams> = {
                data: null,
                error,
                isError: true,
                isPending: false,
                isSuccess: false,
                params: call.params,
                settledAt,
                type: 'error',
              }
              publishState(call.key, failure, errors)
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
            return
          }
          case 'dismiss': {
            let key: RecordKey = SINGLE_RECORD
            if (keyFn !== null) {
              assertKey(item.key, 'Mutation')
              ;({ key } = item)
            }
            if (settledResult(key)) {
              publishState(key, null, errors)
            }
            return
          }
          case 'dismissAll': {
            const next = new Map(keyed)
            for (const [key, result] of keyed) {
              if (result.type !== 'pending') {
                next.delete(key)
              }
            }
            if (next.size !== keyed.size) {
              keyed = next
              errors.step(() => {
                pub(status$, next)
              })
            }
            return
          }
          default:
            // oxlint-disable-next-line no-useless-return
            return
        }
      }

      const queue = new CommandQueue<Item<TParams, TData>>('Mutation', process, isClosed)

      engine.onDispose(() => {
        closed = true
        queue.clear()
        for (const call of running.values()) {
          call.controller.abort()
        }
        running.clear()
      })

      engine.sub(mutate$, (params) => {
        queue.enqueue({ params, type: 'mutate' })
      })
      engine.sub(dismiss$, (key) => {
        queue.enqueue({ key, type: 'dismiss' })
      })
      if (keyFn !== null) {
        engine.sub(dismissAll$, () => {
          queue.enqueue({ type: 'dismissAll' })
        })
      }
    },
    ...nodes
  )

  if (keyFn === null) {
    return {
      data$,
      dismiss$: dismiss$ as NodeRef<void>,
      mutate$,
      settled$: settled$ as NodeRef<MutationSettled<TData, TParams>>,
    }
  }
  return {
    dismiss$: dismiss$ as NodeRef<TKey>,
    dismissAll$,
    mutate$,
    settled$: settled$ as NodeRef<MutationSettled<TData, TParams, TKey>>,
    status$: status$ as unknown as StateRef<ReadonlyMap<TKey, MutationActiveResult<TData, TParams, TKey>>>,
  }
}
