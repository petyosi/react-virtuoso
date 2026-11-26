import { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { defaultRetryDelay, executeWithRetry } from './utils'

import type { MutationIdleResult, MutationOptions, MutationResult } from './types'
import type { PromiseWorkEvent, PromiseWorkOptions } from '@virtuoso.dev/reactive-engine-core'

const idle: MutationIdleResult = {
  data: null,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  pendingCount: 0,
  type: 'idle',
}

/**
 * Creates a reactive mutation for performing remote operations like POST, PUT, DELETE requests.
 *
 * This factory function creates a set of reactive nodes for managing asynchronous mutations with features like:
 * - Automatic retries with exponential backoff
 * - Concurrency control for overlapping calls, optionally per key
 * - Results that carry the params of the call they belong to
 * - Success and error callbacks that can publish back into the engine
 * - Reset capability that aborts running calls and returns to idle state
 *
 * Unlike Query, mutations are triggered manually by publishing to the mutate$ stream and do not
 * execute automatically on initialization.
 *
 * @typeParam TParams - The type of parameters passed to the mutation function
 * @typeParam TData - The type of data returned by the mutation function
 *
 * @param options - Configuration options for the mutation
 * @param options.mutationFn - The async function that performs the mutation. Receives params and an AbortSignal
 * @param options.concurrency - How overlapping calls are scheduled: `'parallel'` (default), `'serial'`, `'coalesce'`, or `'switch'`
 * @param options.key - Groups calls, for example by record ID, so the concurrency policy applies per key
 * @param options.merge - With `'coalesce'`, combines waiting params with newer params for the same key (default: keep the newest)
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 0)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.onSuccess - Called with the data, the params, and the engine on successful mutation
 * @param options.onError - Called with the error, the params, and the engine on failed mutation
 *
 * @returns An object containing reactive nodes for managing the mutation:
 * - `dataimport { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { defaultRetryDelay, executeWithRetry } from './utils'

import type { MutationIdleResult, MutationOptions, MutationResult } from './types'
import type { PromiseWorkEvent, PromiseWorkOptions } from '@virtuoso.dev/reactive-engine-core'

const idle: MutationIdleResult = {
  data: null,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  pendingCount: 0,
  type: 'idle',
}

/**
 * Creates a reactive mutation for performing remote operations like POST, PUT, DELETE requests.
 *
 * This factory function creates a set of reactive nodes for managing asynchronous mutations with features like:
 * - Automatic retries with exponential backoff
 * - Concurrency control for overlapping calls, optionally per key
 * - Results that carry the params of the call they belong to
 * - Success and error callbacks that can publish back into the engine
 * - Reset capability that aborts running calls and returns to idle state
 *
 * Unlike Query, mutations are triggered manually by publishing to the mutate$ stream and do not
 * execute automatically on initialization.
 *
 * @typeParam TParams - The type of parameters passed to the mutation function
 * @typeParam TData - The type of data returned by the mutation function
 *
 * @param options - Configuration options for the mutation
 * @param options.mutationFn - The async function that performs the mutation. Receives params and an AbortSignal
 * @param options.concurrency - How overlapping calls are scheduled: `'parallel'` (default), `'serial'`, `'coalesce'`, or `'switch'`
 * @param options.key - Groups calls, for example by record ID, so the concurrency policy applies per key
 * @param options.merge - With `'coalesce'`, combines waiting params with newer params for the same key (default: keep the newest)
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 0)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.onSuccess - Called with the data, the params, and the engine on successful mutation
 * @param options.onError - Called with the error, the params, and the engine on failed mutation
 *
 * @returns An object containing reactive nodes for managing the mutation:
 - Cell holding the latest MutationResult; pending, success, and error results include `params`, and every
 *   result includes `pendingCount`
 * - `mutate$` - Stream to trigger the mutation with provided params
 * - `pendingCountimport { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { defaultRetryDelay, executeWithRetry } from './utils'

import type { MutationIdleResult, MutationOptions, MutationResult } from './types'
import type { PromiseWorkEvent, PromiseWorkOptions } from '@virtuoso.dev/reactive-engine-core'

const idle: MutationIdleResult = {
  data: null,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  pendingCount: 0,
  type: 'idle',
}

/**
 * Creates a reactive mutation for performing remote operations like POST, PUT, DELETE requests.
 *
 * This factory function creates a set of reactive nodes for managing asynchronous mutations with features like:
 * - Automatic retries with exponential backoff
 * - Concurrency control for overlapping calls, optionally per key
 * - Results that carry the params of the call they belong to
 * - Success and error callbacks that can publish back into the engine
 * - Reset capability that aborts running calls and returns to idle state
 *
 * Unlike Query, mutations are triggered manually by publishing to the mutate$ stream and do not
 * execute automatically on initialization.
 *
 * @typeParam TParams - The type of parameters passed to the mutation function
 * @typeParam TData - The type of data returned by the mutation function
 *
 * @param options - Configuration options for the mutation
 * @param options.mutationFn - The async function that performs the mutation. Receives params and an AbortSignal
 * @param options.concurrency - How overlapping calls are scheduled: `'parallel'` (default), `'serial'`, `'coalesce'`, or `'switch'`
 * @param options.key - Groups calls, for example by record ID, so the concurrency policy applies per key
 * @param options.merge - With `'coalesce'`, combines waiting params with newer params for the same key (default: keep the newest)
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 0)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.onSuccess - Called with the data, the params, and the engine on successful mutation
 * @param options.onError - Called with the error, the params, and the engine on failed mutation
 *
 * @returns An object containing reactive nodes for managing the mutation:
 * - `dataimport { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { defaultRetryDelay, executeWithRetry } from './utils'

import type { MutationIdleResult, MutationOptions, MutationResult } from './types'
import type { PromiseWorkEvent, PromiseWorkOptions } from '@virtuoso.dev/reactive-engine-core'

const idle: MutationIdleResult = {
  data: null,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  pendingCount: 0,
  type: 'idle',
}

/**
 * Creates a reactive mutation for performing remote operations like POST, PUT, DELETE requests.
 *
 * This factory function creates a set of reactive nodes for managing asynchronous mutations with features like:
 * - Automatic retries with exponential backoff
 * - Concurrency control for overlapping calls, optionally per key
 * - Results that carry the params of the call they belong to
 * - Success and error callbacks that can publish back into the engine
 * - Reset capability that aborts running calls and returns to idle state
 *
 * Unlike Query, mutations are triggered manually by publishing to the mutate$ stream and do not
 * execute automatically on initialization.
 *
 * @typeParam TParams - The type of parameters passed to the mutation function
 * @typeParam TData - The type of data returned by the mutation function
 *
 * @param options - Configuration options for the mutation
 * @param options.mutationFn - The async function that performs the mutation. Receives params and an AbortSignal
 * @param options.concurrency - How overlapping calls are scheduled: `'parallel'` (default), `'serial'`, `'coalesce'`, or `'switch'`
 * @param options.key - Groups calls, for example by record ID, so the concurrency policy applies per key
 * @param options.merge - With `'coalesce'`, combines waiting params with newer params for the same key (default: keep the newest)
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 0)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.onSuccess - Called with the data, the params, and the engine on successful mutation
 * @param options.onError - Called with the error, the params, and the engine on failed mutation
 *
 * @returns An object containing reactive nodes for managing the mutation:
 - Cell holding the latest MutationResult; pending, success, and error results include `params`, and every
 *   result includes `pendingCount`
 * - `mutate$` - Stream to trigger the mutation with provided params
 - Cell counting calls that are running or waiting to start, derived from `dataimport { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { defaultRetryDelay, executeWithRetry } from './utils'

import type { MutationIdleResult, MutationOptions, MutationResult } from './types'
import type { PromiseWorkEvent, PromiseWorkOptions } from '@virtuoso.dev/reactive-engine-core'

const idle: MutationIdleResult = {
  data: null,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  pendingCount: 0,
  type: 'idle',
}

/**
 * Creates a reactive mutation for performing remote operations like POST, PUT, DELETE requests.
 *
 * This factory function creates a set of reactive nodes for managing asynchronous mutations with features like:
 * - Automatic retries with exponential backoff
 * - Concurrency control for overlapping calls, optionally per key
 * - Results that carry the params of the call they belong to
 * - Success and error callbacks that can publish back into the engine
 * - Reset capability that aborts running calls and returns to idle state
 *
 * Unlike Query, mutations are triggered manually by publishing to the mutate$ stream and do not
 * execute automatically on initialization.
 *
 * @typeParam TParams - The type of parameters passed to the mutation function
 * @typeParam TData - The type of data returned by the mutation function
 *
 * @param options - Configuration options for the mutation
 * @param options.mutationFn - The async function that performs the mutation. Receives params and an AbortSignal
 * @param options.concurrency - How overlapping calls are scheduled: `'parallel'` (default), `'serial'`, `'coalesce'`, or `'switch'`
 * @param options.key - Groups calls, for example by record ID, so the concurrency policy applies per key
 * @param options.merge - With `'coalesce'`, combines waiting params with newer params for the same key (default: keep the newest)
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 0)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.onSuccess - Called with the data, the params, and the engine on successful mutation
 * @param options.onError - Called with the error, the params, and the engine on failed mutation
 *
 * @returns An object containing reactive nodes for managing the mutation:
 * - `dataimport { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { defaultRetryDelay, executeWithRetry } from './utils'

import type { MutationIdleResult, MutationOptions, MutationResult } from './types'
import type { PromiseWorkEvent, PromiseWorkOptions } from '@virtuoso.dev/reactive-engine-core'

const idle: MutationIdleResult = {
  data: null,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  pendingCount: 0,
  type: 'idle',
}

/**
 * Creates a reactive mutation for performing remote operations like POST, PUT, DELETE requests.
 *
 * This factory function creates a set of reactive nodes for managing asynchronous mutations with features like:
 * - Automatic retries with exponential backoff
 * - Concurrency control for overlapping calls, optionally per key
 * - Results that carry the params of the call they belong to
 * - Success and error callbacks that can publish back into the engine
 * - Reset capability that aborts running calls and returns to idle state
 *
 * Unlike Query, mutations are triggered manually by publishing to the mutate$ stream and do not
 * execute automatically on initialization.
 *
 * @typeParam TParams - The type of parameters passed to the mutation function
 * @typeParam TData - The type of data returned by the mutation function
 *
 * @param options - Configuration options for the mutation
 * @param options.mutationFn - The async function that performs the mutation. Receives params and an AbortSignal
 * @param options.concurrency - How overlapping calls are scheduled: `'parallel'` (default), `'serial'`, `'coalesce'`, or `'switch'`
 * @param options.key - Groups calls, for example by record ID, so the concurrency policy applies per key
 * @param options.merge - With `'coalesce'`, combines waiting params with newer params for the same key (default: keep the newest)
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 0)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.onSuccess - Called with the data, the params, and the engine on successful mutation
 * @param options.onError - Called with the error, the params, and the engine on failed mutation
 *
 * @returns An object containing reactive nodes for managing the mutation:
 - Cell holding the latest MutationResult; pending, success, and error results include `params`, and every
 *   result includes `pendingCount`
 * - `mutate$` - Stream to trigger the mutation with provided params

 * - `reset$` - Stream that aborts running calls, drops waiting ones, and resets the state to idle
 *
 * @example
 * ```typescript
 * const updateUser = Mutation({
 *   mutationFn: async ({ userId, name }) => {
 *     const res = await fetch(`/api/users/${userId}`, {
 *       method: 'PUT',
 *       body: JSON.stringify({ name })
 *     })
 *     return res.json()
 *   },
 *   onSuccess: (data) => console.log('User updated:', data),
 *   onError: (error) => console.error('Update failed:', error)
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
 * // Reset state
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
  const data$ = Cell<MutationResult<TData, TParams>>(idle)
  const pendingCount$ = Cell(0)
  // Commands are events: publishing the same params or a second reset must act again.
  const mutate$ = Stream<TParams>(false)
  const reset$ = Stream(false)

  const retryCount = options.retry === false ? 0 : (options.retry ?? 0)
  const retryDelayFn = options.retryDelay ?? defaultRetryDelay
  const concurrency = options.concurrency ?? 'parallel'

  const workOptions: PromiseWorkOptions<TParams> = { cancel$: reset$, policy: concurrency }
  if (options.key !== undefined && concurrency !== 'parallel') {
    workOptions.key = options.key
  }
  if (options.merge !== undefined) {
    workOptions.merge = options.merge
  }

  const events$ = e.pipe(
    mutate$,
    e.promiseWork<TParams, TData>(
      (params, signal) =>
        executeWithRetry(() => options.mutationFn(params, signal), {
          retry: retryCount,
          retryDelay: retryDelayFn,
          signal,
        }),
      workOptions
    )
  )

  // Each result carries its pending count, so data$ is a coherent snapshot. pendingCount$ derives from data$, so its
  // subscribers always read the matching data$.
  e.changeWith(data$, events$, (current, event) => toResult(current, event))
  e.link(
    e.pipe(
      data$,
      e.map((result) => result.pendingCount)
    ),
    pendingCount$
  )

  // Callbacks run after the cycle settles, so data$ subscribers see every result before a callback can start or reset
  // another mutation.
  e.sub(e.pipe(events$, e.afterSettle()), (event, engine) => {
    if (event.type !== 'settle') {
      return
    }
    const { result } = event
    try {
      if (result.status === 'success') {
        options.onSuccess?.(result.value, result.input, engine)
      } else {
        options.onError?.(result.error, result.input, engine)
      }
    } catch (error) {
      console.error(`Mutation ${result.status === 'success' ? 'onSuccess' : 'onError'} callback error:`, error)
    }
  })

  return { data$, mutate$, pendingCount$, reset$ }
}

function toResult<TParams, TData>(
  current: MutationResult<TData, TParams>,
  event: PromiseWorkEvent<TParams, TData>
): MutationResult<TData, TParams> {
  const { pendingCount } = event
  if (event.type === 'cancel') {
    return idle
  }
  if (event.type === 'queue') {
    // A waiting call changes only the count; the latest event stays the same.
    return { ...current, pendingCount }
  }
  if (event.type === 'start') {
    return {
      data: null,
      error: null,
      isError: false,
      isPending: true,
      isSuccess: false,
      params: event.input,
      pendingCount,
      type: 'pending',
    }
  }
  const { result } = event
  if (result.status === 'success') {
    return {
      data: result.value,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      params: result.input,
      pendingCount,
      type: 'success',
    }
  }
  return {
    data: null,
    error: result.error,
    isError: true,
    isPending: false,
    isSuccess: false,
    params: result.input,
    pendingCount,
    type: 'error',
  }
}
