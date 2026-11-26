import { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { defaultRetryDelay, executeWithRetry } from './utils'

import type { MutationIdleResult, MutationOptions, MutationResult, MutationSettled } from './types'
import type { PromiseWorkEvent, PromiseWorkOptions } from '@virtuoso.dev/reactive-engine-core'

const idle: MutationIdleResult = {
  data: null,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  type: 'idle',
}

/** A call made through `mutate$`, tagged with the display epoch it was made in. */
interface Call<TParams> {
  epoch: number
  params: TParams
}

/** What `data$` shows, and the epoch whose calls it may show. Every `reset$` starts a new epoch. */
interface Display<TData, TParams> {
  epoch: number
  result: MutationResult<TData, TParams>
}

/**
 * Creates a reactive mutation for performing remote operations like POST, PUT, DELETE requests.
 *
 * A mutation separates three concerns:
 * - `settled$` reports the outcome of every call exactly once: `success`, `error`, or `dropped` (never sent). Nothing,
 *   including `reset$`, suppresses an outcome, so graph wiring can always reconcile with the server.
 * - `data$` is display state: the latest start or result among calls made since the last `reset$`.
 * - `pendingCount$` counts calls that are running or waiting to start.
 *
 * No control aborts a call that already started, because aborting a request does not undo it on the server. The
 * `AbortSignal` passed to `mutationFn` is aborted only when the engine is disposed.
 *
 * Unlike Query, mutations are triggered manually by publishing to the `mutate$` stream and do not execute automatically
 * on initialization.
 *
 * @typeParam TParams - The type of parameters passed to the mutation function
 * @typeParam TData - The type of data returned by the mutation function
 *
 * @param options - Configuration options for the mutation
 * @param options.mutationFn - The async function that performs the mutation. Receives params and an AbortSignal
 * @param options.concurrency - How overlapping calls are scheduled: `'parallel'` (default), `'serial'`, or `'coalesce'`
 * @param options.key - With `'serial'` or `'coalesce'`, groups calls, for example by record ID, so the policy applies per key
 * @param options.merge - With `'coalesce'`, combines waiting params with newer params for the same key (default: replace them)
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 0)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.onSuccess - Called with the data, the params, and the engine for every call that succeeds
 * @param options.onError - Called with the error, the params, and the engine for every call that fails
 *
 * @returns An object containing reactive nodes for managing the mutation:
 * - `data$` - Cell holding what to display: the latest MutationResult among calls made since the last `reset$`
 * - `dropWaiting$` - Stream that drops every call waiting to start; each ends as `dropped` on `settled$`
 * - `mutate$` - Stream to trigger the mutation with provided params
 * - `pendingCount$` - Cell counting calls that are running or waiting to start
 * - `reset$` - Stream that returns `data$` to idle; calls made before it keep running and still report on `settled$`
 * - `settled$` - Stream with one outcome per call: `success`, `error`, or `dropped`
 *
 * @example
 * ```typescript
 * const updateUser = Mutation({
 *   mutationFn: async ({ userId, name }, signal) => {
 *     const res = await fetch(`/api/users/${userId}`, {
 *       method: 'PUT',
 *       body: JSON.stringify({ name }),
 *       signal,
 *     })
 *     return res.json()
 *   },
 *   onSuccess: (data) => console.log('User updated:', data),
 *   onError: (error) => console.error('Update failed:', error),
 * })
 *
 * const engine = new Engine()
 * engine.sub(updateUser.data$, (state) => {
 *   if (state.isPending) {
 *     console.log('Updating...')
 *   } else if (state.isSuccess) {
 *     console.log('Updated:', state.data)
 *   }
 * })
 *
 * // Trigger mutation
 * engine.pub(updateUser.mutate$, { userId: 1, name: 'John' })
 *
 * // Dismiss the displayed result; running calls still report on settled$
 * engine.pub(updateUser.reset$)
 * ```
 *
 * @example
 * Save a setting per record, sending at most one request per record at a time:
 * ```typescript
 * const saveSetting = Mutation<{ id: string; patch: Patch }, Saved>({
 *   mutationFn: ({ id, patch }, signal) => api.patch(id, patch, { signal }),
 *   concurrency: 'coalesce',
 *   key: ({ id }) => id,
 *   merge: (waiting, next) => ({ id: next.id, patch: { ...waiting.patch, ...next.patch } }),
 *   onSuccess: (saved, { id }, engine) => engine.pub(savedById$, { id, saved }),
 * })
 * ```
 *
 * @category Query
 */
export function Mutation<TParams, TData>(options: MutationOptions<TParams, TData>) {
  // Commands are events: publishing the same params, a second reset, or a second drop must act again.
  const mutate$ = Stream<TParams>(false)
  const reset$ = Stream<void>(false)
  const dropWaiting$ = Stream<void>(false)
  const settled$ = Stream<MutationSettled<TData, TParams>>(false)
  const pendingCount$ = Cell(0)
  const data$ = Cell<MutationResult<TData, TParams>>(idle)
  // Per-engine display state lives in the graph, because Mutation nodes are shared across engines.
  const display$ = Cell<Display<TData, TParams>>({ epoch: 0, result: idle })

  const retryCount = options.retry === false ? 0 : (options.retry ?? 0)
  const retryDelayFn = options.retryDelay ?? defaultRetryDelay
  const concurrency = options.concurrency ?? 'parallel'

  const workOptions: PromiseWorkOptions<Call<TParams>> = { dropWaiting$, policy: concurrency }
  const { key, merge } = options
  if (key !== undefined && concurrency !== 'parallel') {
    workOptions.key = (call) => key(call.params)
  }
  if (merge !== undefined && concurrency === 'coalesce') {
    // A merged call belongs to the epoch of its newest params.
    workOptions.merge = (waiting, next) => ({ epoch: next.epoch, params: merge(waiting.params, next.params) })
  }

  const calls$ = e.pipe(
    mutate$,
    e.withLatestFrom(display$),
    e.map(([params, display]): Call<TParams> => ({ epoch: display.epoch, params }), false)
  )

  const events$ = e.pipe(
    calls$,
    e.promiseWork<Call<TParams>, TData>(
      (call, signal) =>
        executeWithRetry(() => options.mutationFn(call.params, signal), {
          retry: retryCount,
          retryDelay: retryDelayFn,
          signal,
        }),
      workOptions
    )
  )

  e.changeWith(display$, reset$, (display) => ({ epoch: display.epoch + 1, result: idle }))
  e.changeWith(display$, events$, (display, event) => showEvent(display, event))
  e.link(
    e.pipe(
      display$,
      e.map((display) => display.result)
    ),
    data$
  )
  e.changeWith(pendingCount$, events$, (_count, event) => event.pendingCount)
  e.link(e.pipe(events$, e.filterMap(toSettled<TParams, TData>, false)), settled$)

  // Callbacks run after the cycle settles, so data$ and settled$ subscribers see every result before a callback can
  // start or reset another mutation.
  e.sub(e.pipe(settled$, e.afterSettle()), (outcome, engine) => {
    if (outcome.type === 'dropped') {
      return
    }
    try {
      if (outcome.type === 'success') {
        options.onSuccess?.(outcome.data, outcome.params, engine)
      } else {
        options.onError?.(outcome.error, outcome.params, engine)
      }
    } catch (error) {
      console.error(`Mutation ${outcome.type === 'success' ? 'onSuccess' : 'onError'} callback error:`, error)
    }
  })

  return { data$, dropWaiting$, mutate$, pendingCount$, reset$, settled$ }
}

/** Shows starts and results of calls made in the current epoch. Queued and dropped calls do not change the display. */
function showEvent<TParams, TData>(
  display: Display<TData, TParams>,
  event: PromiseWorkEvent<Call<TParams>, TData>
): Display<TData, TParams> {
  if (event.type === 'start') {
    if (event.input.epoch !== display.epoch) {
      return display
    }
    return {
      epoch: display.epoch,
      result: {
        data: null,
        error: null,
        isError: false,
        isPending: true,
        isSuccess: false,
        params: event.input.params,
        type: 'pending',
      },
    }
  }
  if (event.type !== 'settle' || event.result.input.epoch !== display.epoch) {
    return display
  }
  const { result } = event
  if (result.status === 'success') {
    return {
      epoch: display.epoch,
      result: {
        data: result.value,
        error: null,
        isError: false,
        isPending: false,
        isSuccess: true,
        params: result.input.params,
        type: 'success',
      },
    }
  }
  return {
    epoch: display.epoch,
    result: {
      data: null,
      error: result.error,
      isError: true,
      isPending: false,
      isSuccess: false,
      params: result.input.params,
      type: 'error',
    },
  }
}

function toSettled<TParams, TData>(event: PromiseWorkEvent<Call<TParams>, TData>): MutationSettled<TData, TParams> | null {
  if (event.type === 'drop') {
    return { params: event.input.params, type: 'dropped' }
  }
  if (event.type !== 'settle') {
    return null
  }
  const { result } = event
  if (result.status === 'success') {
    return { data: result.value, params: result.input.params, type: 'success' }
  }
  return { error: result.error, params: result.input.params, type: 'error' }
}
