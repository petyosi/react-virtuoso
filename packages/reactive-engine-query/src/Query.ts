import type { Engine } from '@virtuoso.dev/reactive-engine-core'

import { addNodeInit, Cell, e, Trigger } from '@virtuoso.dev/reactive-engine-core'

import type { QueryOptions, QueryResult } from './types'

import { defaultRetryDelay, executeWithRetry } from './utils'

/**
 * Creates a reactive query for fetching remote data with automatic retry, polling, and cache management.
 *
 * This factory function creates a set of reactive nodes for managing asynchronous queries with features like:
 * - Automatic retries with exponential backoff
 * - Polling support for automatic refetching
 * - Query invalidation and manual refetching
 * - Enable/disable capability
 * - AbortController integration for request cancellation
 *
 * @typeParam TParams - The type of parameters passed to the query function
 * @typeParam TData - The type of data returned by the query function
 *
 * @param options - Configuration options for the query
 * @param options.queryFn - The async function that fetches the data. Receives params and an AbortSignal
 * @param options.initialParams - Initial parameters to use for the first query execution
 * @param options.enabled - Whether the query should execute automatically (default: true)
 * @param options.retry - Number of retry attempts on failure, or false to disable (default: 3)
 * @param options.retryDelay - Function that returns delay in ms for each retry attempt (default: exponential backoff)
 * @param options.refetchInterval - Interval in ms for automatic refetching, or false to disable
 * @param options.initialData - Initial data to show immediately while the first query executes
 *
 * @returns An object containing reactive nodes for managing the query:
 * - `data$` - Cell emitting QueryResult with data, loading, and error states
 * - `refetch$` - Stream to trigger a refetch with current params
 * - `params$` - Cell for updating query parameters (triggers new query)
 * - `enabled$` - Cell for enabling/disabling the query
 * - `invalidate$` - Stream to invalidate and refetch while keeping existing data
 * - `unload$` - Stream to unload current data and transition to pending state
 *
 * @example
 * ```typescript
 * const userQuery = Query({
 *   queryFn: async ({ userId }, signal) => {
 *     const res = await fetch(`/api/users/${userId}`, { signal })
 *     return res.json()
 *   },
 *   initialParams: { userId: 1 },
 *   retry: 3,
 *   refetchInterval: 5000
 * })
 *
 * const engine = new Engine()
 * engine.sub(userQuery.data$, (state) => {
 *   if (state.isSuccess) {
 *     console.log('User data:', state.data)
 *   }
 * })
 *
 * // Change params to fetch different user
 * engine.pub(userQuery.params$, { userId: 2 })
 *
 * // Manually refetch
 * engine.pub(userQuery.refetch$)
 * ```
 *
 * @category Query
 */
export function Query<TParams, TData>(options: QueryOptions<TParams, TData>) {
  // Determine initial state
  const initialState: QueryResult<TData> = options.initialData
    ? {
        data: options.initialData,
        dataUpdatedAt: Date.now(),
        error: null,
        isError: false,
        isFetching: false,
        isLoading: false,
        isSuccess: true,
        type: 'success',
      }
    : {
        data: null,
        dataUpdatedAt: null,
        error: null,
        isError: false,
        isFetching: true,
        isLoading: true,
        isSuccess: false,
        type: 'pending',
      }

  // Create nodes
  const data$ = Cell<QueryResult<TData>>(initialState)
  const refetch$ = Trigger()

  const params$ = Cell<TParams>(options.initialParams)
  const enabled$ = Cell(options.enabled ?? true)
  const invalidate$ = Trigger()
  const unload$ = Trigger()

  // Store AbortController per engine instance
  const abortControllers = new WeakMap<Engine, AbortController>()
  // Store intervals per engine instance
  const intervals = new WeakMap<Engine, ReturnType<typeof setInterval>>()

  function clearPolling(engine: Engine) {
    const intervalId = intervals.get(engine)
    if (intervalId !== undefined) {
      clearInterval(intervalId)
      intervals.delete(engine)
    }
  }

  function startPolling(engine: Engine, params: TParams) {
    if (options.refetchInterval && options.refetchInterval > 0) {
      clearPolling(engine)
      const intervalId = setInterval(() => {
        executeQuery(params, engine)
      }, options.refetchInterval)
      intervals.set(engine, intervalId)
    }
  }

  function executeQuery(params: TParams, engine: Engine) {
    // Abort previous fetch
    const prevController = abortControllers.get(engine)
    if (prevController) {
      prevController.abort()
    }

    // Clear polling while fetching
    clearPolling(engine)

    const controller = new AbortController()
    abortControllers.set(engine, controller)

    // Get current state to determine if this is initial load
    const currentState = engine.getValue(data$)
    const isInitialLoad = currentState.type === 'pending'

    // Set loading/fetching state
    if (isInitialLoad) {
      // Initial load: show placeholder if available
      engine.pub(data$, {
        data: null,
        dataUpdatedAt: null,
        error: null,
        isError: false,
        isFetching: true,
        isLoading: true,
        isSuccess: false,
        type: 'pending',
      })
    } else if (currentState.type === 'success') {
      // Background refetch: keep existing data, set isFetching
      engine.pub(data$, {
        ...currentState,
        isFetching: true,
      })
    } else {
      // Error state refetch
      engine.pub(data$, {
        data: null,
        dataUpdatedAt: null,
        error: null,
        isError: false,
        isFetching: true,
        isLoading: true,
        isSuccess: false,
        type: 'pending',
      })
    }

    // Execute with retry
    const retryCount = options.retry === false ? 0 : (options.retry ?? 3)
    const retryDelayFn = options.retryDelay ?? defaultRetryDelay

    executeWithRetry(() => options.queryFn(params, controller.signal), {
      retry: retryCount,
      retryDelay: retryDelayFn,
      signal: controller.signal,
    })
      .then((result) => {
        // Check if this request was aborted
        if (controller.signal.aborted) {
          return
        }

        engine.pub(data$, {
          data: result,
          dataUpdatedAt: Date.now(),
          error: null,
          isError: false,
          isFetching: false,
          isLoading: false,
          isSuccess: true,
          type: 'success',
        })

        // Start polling if configured
        startPolling(engine, params)
      })
      .catch((error: unknown) => {
        // Check if this is an abort error
        if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Aborted')) {
          return
        }

        // Check if this request was aborted
        if (controller.signal.aborted) {
          return
        }

        engine.pub(data$, {
          data: null,
          dataUpdatedAt: null,
          error,
          isError: true,
          isFetching: false,
          isLoading: false,
          isSuccess: false,
          type: 'error',
        })
      })
  }

  // Init: run query if enabled
  addNodeInit((engine) => {
    if (engine.getValue(enabled$)) {
      executeQuery(options.initialParams, engine)
    }
  }, data$)

  // Subscribe to params$ changes - only execute when enabled
  e.sub(
    e.pipe(
      params$,
      e.withLatestFrom(enabled$),
      e.filter(([_, enabled]) => enabled)
    ),
    ([params], engine) => {
      executeQuery(params, engine)
    }
  )

  // Subscribe to refetch$ - only execute when enabled
  e.sub(
    e.pipe(
      refetch$,
      e.withLatestFrom(enabled$, params$),
      e.filter(([_, enabled]) => enabled)
    ),
    ([, , params], engine) => {
      executeQuery(params, engine)
    }
  )

  // Subscribe to enabled$ changes - execute query when enabled
  e.sub(
    e.pipe(
      enabled$,
      e.filter((enabled) => enabled),
      e.withLatestFrom(params$)
    ),
    ([, params], engine) => {
      executeQuery(params, engine)
    }
  )

  // Subscribe to enabled$ changes - cleanup when disabled
  e.sub(
    e.pipe(
      enabled$,
      e.filter((enabled) => !enabled)
    ),
    (_, engine) => {
      // Abort current fetch
      const controller = abortControllers.get(engine)
      if (controller) {
        controller.abort()
      }
      // Clear polling
      clearPolling(engine)
    }
  )

  // Subscribe to invalidate$ - only execute when enabled and set isFetching for success state
  e.sub(
    e.pipe(
      invalidate$,
      e.withLatestFrom(enabled$, params$, data$),
      e.filter(([_, enabled]) => enabled)
    ),
    ([, , params, currentValue], engine) => {
      if (currentValue.type === 'success') {
        // Keep data but set isFetching: true
        engine.pub(data$, { ...currentValue, isFetching: true })
      }
      executeQuery(params, engine)
    }
  )

  // Subscribe to unload$ - clear data and abort requests (works in all states)
  e.sub(unload$, (_, engine) => {
    // Abort current fetch
    const controller = abortControllers.get(engine)
    if (controller) {
      controller.abort()
    }

    // Transition to pending state with null data
    engine.pub(data$, {
      data: null,
      dataUpdatedAt: null,
      error: null,
      isError: false,
      isFetching: true,
      isLoading: true,
      isSuccess: false,
      type: 'pending',
    })
  })

  return { data$, enabled$, invalidate$, params$, refetch$, unload$ }
}
