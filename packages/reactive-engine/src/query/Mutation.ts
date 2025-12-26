import type { Engine } from '../Engine'
import type { MutationOptions, MutationResult } from './types'

import { e } from '../e'
import { Cell, Stream } from '../nodes'
import { defaultRetryDelay, executeWithRetry } from './utils'

/**
 * Creates a reactive mutation for performing remote operations like POST, PUT, DELETE requests.
 *
 * This factory function creates a set of reactive nodes for managing asynchronous mutations with features like:
 * - Automatic retries with exponential backoff
 * - Success and error callbacks
 * - Reset capability to return to idle state
 * - Proper error handling
 *
 * Unlike Query, mutations are triggered manually by publishing to the mutate$ stream and do not
 * execute automatically on initialization.
 *
 * @typeParam TParams - The type of parameters passed to the mutation function
 * @typeParam TData - The type of data returned by the mutation function
 *
 * @param options - Configuration options for the mutation
 * @param options.mutationFn - The async function that performs the mutation. Receives params
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 0)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.onSuccess - Callback function called with the result on successful mutation
 * @param options.onError - Callback function called with the error on failed mutation
 *
 * @returns An object containing reactive nodes for managing the mutation:
 * - `data$` - Cell emitting MutationResult with data, pending, and error states
 * - `mutate$` - Stream to trigger the mutation with provided params
 * - `reset$` - Stream to reset the mutation state back to idle
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
 * @category Query
 */
export function Mutation<TParams, TData>(options: MutationOptions<TParams, TData>) {
  // Create nodes
  const data$ = Cell<MutationResult<TData>>({
    data: null,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    type: 'idle',
  })

  const mutate$ = Stream<TParams>()
  const reset$ = Stream()

  function executeMutation(params: TParams, engine: Engine) {
    // Set pending state
    engine.pub(data$, {
      data: null,
      error: null,
      isError: false,
      isPending: true,
      isSuccess: false,
      type: 'pending',
    })

    // Execute with retry
    const retryCount = options.retry === false ? 0 : (options.retry ?? 0)
    const retryDelayFn = options.retryDelay ?? defaultRetryDelay

    // Create a signal for abort support
    const controller = new AbortController()

    executeWithRetry(() => options.mutationFn(params), {
      retry: retryCount,
      retryDelay: retryDelayFn,
      signal: controller.signal,
    })
      .then((result) => {
        engine.pub(data$, {
          data: result,
          error: null,
          isError: false,
          isPending: false,
          isSuccess: true,
          type: 'success',
        })

        // Call onSuccess callback if provided
        try {
          options.onSuccess?.(result)
        } catch (error) {
          // Log but don't break execution
          console.error('Mutation onSuccess callback error:', error)
        }
      })
      .catch((error: unknown) => {
        engine.pub(data$, {
          data: null,
          error,
          isError: true,
          isPending: false,
          isSuccess: false,
          type: 'error',
        })

        // Call onError callback if provided
        try {
          options.onError?.(error)
        } catch (callbackError) {
          // Log but don't break execution
          console.error('Mutation onError callback error:', callbackError)
        }
      })
  }

  // Subscribe to mutate$
  e.sub(mutate$, executeMutation)

  // Subscribe to reset$
  e.sub(reset$, (_, engine) => {
    engine.pub(data$, {
      data: null,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: false,
      type: 'idle',
    })
  })

  return { data$, mutate$, reset$ }
}
