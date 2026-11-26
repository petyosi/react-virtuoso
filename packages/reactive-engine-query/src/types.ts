import type { Engine } from '@virtuoso.dev/reactive-engine-core'

// Query state discriminated union

export interface QueryPendingResult {
  data: null
  dataUpdatedAt: null
  error: null
  isError: false
  isFetching: true
  isLoading: true
  isSuccess: false
  type: 'pending'
}

export interface QuerySuccessResult<T> {
  data: T
  dataUpdatedAt: number
  error: null
  isError: false
  isFetching: boolean
  isLoading: false
  isSuccess: true
  type: 'success'
}

export interface QueryErrorResult {
  data: null
  dataUpdatedAt: null
  error: unknown
  isError: true
  isFetching: false
  isLoading: false
  isSuccess: false
  type: 'error'
}

export type QueryResult<T> = QueryErrorResult | QueryPendingResult | QuerySuccessResult<T>

export interface QueryOptions<TParams, TData> {
  enabled?: boolean
  gcTime?: number
  initialData?: TData
  initialParams: TParams
  placeholderData?: TData
  queryFn: (params: TParams, signal: AbortSignal) => Promise<TData> | TData
  refetchInterval?: false | number
  retry?: false | number
  retryDelay?: (attemptIndex: number) => number
  staleTime?: number
}

// Mutation state discriminated union

export interface MutationIdleResult {
  data: null
  error: null
  isError: false
  isPending: false
  isSuccess: false
  type: 'idle'
}

export interface MutationPendingResult<TParams = unknown> {
  data: null
  error: null
  isError: false
  isPending: true
  isSuccess: false
  /** The params of the call that started. */
  params: TParams
  type: 'pending'
}

export interface MutationSuccessResult<T, TParams = unknown> {
  data: T
  error: null
  isError: false
  isPending: false
  isSuccess: true
  /** The params of the call that succeeded. */
  params: TParams
  type: 'success'
}

export interface MutationErrorResult<TParams = unknown> {
  data: null
  error: unknown
  isError: true
  isPending: false
  isSuccess: false
  /** The params of the call that failed. */
  params: TParams
  type: 'error'
}

/**
 * The latest event of a mutation. `isPending` describes that event only; when calls overlap, read `pendingCount$`
 * to know whether any call is still running or waiting.
 */
export type MutationResult<T, TParams = unknown> =
  | MutationErrorResult<TParams>
  | MutationIdleResult
  | MutationPendingResult<TParams>
  | MutationSuccessResult<T, TParams>

/**
 * How overlapping `mutate$` calls with the same key are scheduled.
 * - `parallel` (default): every call starts immediately; results arrive in completion order.
 * - `serial`: calls run one at a time in arrival order.
 * - `coalesce`: one call runs at a time; while it runs, only the newest waiting params are kept (see `merge`).
 * - `switch`: a new call aborts the running one and suppresses its result.
 */
export type MutationConcurrency = 'coalesce' | 'parallel' | 'serial' | 'switch'

export interface MutationOptions<TParams, TData> {
  /** Scheduling policy for overlapping calls. Defaults to `'parallel'`. */
  concurrency?: MutationConcurrency
  /** Groups calls, for example by record ID, so `serial`, `coalesce`, and `switch` apply per key. Ignored by `parallel`. */
  key?: (params: NoInfer<TParams>) => unknown
  /**
   * With `concurrency: 'coalesce'`, combines waiting params with newer params for the same key. Defaults to keeping the
   * newest. Provide it when params are partial updates, or earlier updates are never sent.
   */
  merge?: (waiting: NoInfer<TParams>, next: NoInfer<TParams>) => NoInfer<TParams>
  /** Performs the mutation. The signal is aborted by `reset$`, by a newer call under `'switch'`, and on engine disposal. */
  mutationFn: (params: TParams, signal: AbortSignal) => Promise<TData> | TData
  onError?: (error: unknown, params: NoInfer<TParams>, engine: Engine) => void
  onSuccess?: (data: NoInfer<TData>, params: NoInfer<TParams>, engine: Engine) => void
  retry?: false | number
  retryDelay?: (attemptIndex: number) => number
}
