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
 * What a mutation displays: the latest start or result among the calls made since the last `reset$`. When calls
 * overlap, `isPending` describes the latest event only; read `pendingCount$` to know whether any call is still running
 * or waiting. To react to every outcome, subscribe to `settled$` instead.
 */
export type MutationResult<T, TParams = unknown> =
  | MutationErrorResult<TParams>
  | MutationIdleResult
  | MutationPendingResult<TParams>
  | MutationSuccessResult<T, TParams>

// Mutation outcomes, one per call

/** The call ran and succeeded. */
export interface MutationSettledSuccess<T, TParams = unknown> {
  data: T
  params: TParams
  type: 'success'
}

/**
 * The call ran and failed, including when it was aborted by engine disposal. The server may or may not have applied
 * it, so reconcile, for example by refetching.
 */
export interface MutationSettledError<TParams = unknown> {
  error: unknown
  params: TParams
  type: 'error'
}

/**
 * The call never started, so the server never received it: a newer call replaced it while it waited under
 * `concurrency: 'coalesce'` without `merge`, or `dropWaiting$` removed it.
 */
export interface MutationSettledDropped<TParams = unknown> {
  params: TParams
  type: 'dropped'
}

/**
 * The outcome of one call, emitted on `settled$`. Every call ends with exactly one outcome, including calls made before
 * a `reset$`. Params merged into a waiting call under `'coalesce'` share that call's outcome.
 */
export type MutationSettled<T, TParams = unknown> =
  | MutationSettledDropped<TParams>
  | MutationSettledError<TParams>
  | MutationSettledSuccess<T, TParams>

/**
 * How overlapping `mutate$` calls with the same key are scheduled.
 * - `parallel` (default): every call starts immediately; results arrive in completion order.
 * - `serial`: calls run one at a time in arrival order.
 * - `coalesce`: one call runs at a time; while it runs, only the newest waiting params are kept (see `merge`).
 *
 * No policy aborts a call that already started: aborting a request does not undo it on the server.
 */
export type MutationConcurrency = 'coalesce' | 'parallel' | 'serial'

interface MutationBaseOptions<TParams, TData> {
  /** Performs the mutation. The signal is aborted only when the engine is disposed. */
  mutationFn: (params: TParams, signal: AbortSignal) => Promise<TData> | TData
  /** Called for every call that fails, including calls made before a `reset$`. */
  onError?: (error: unknown, params: NoInfer<TParams>, engine: Engine) => void
  /** Called for every call that succeeds, including calls made before a `reset$`. */
  onSuccess?: (data: NoInfer<TData>, params: NoInfer<TParams>, engine: Engine) => void
  retry?: false | number
  retryDelay?: (attemptIndex: number) => number
}

/** Every call starts immediately. `key` and `merge` do not apply. */
export interface ParallelMutationOptions<TParams, TData> extends MutationBaseOptions<TParams, TData> {
  /** Scheduling policy for overlapping calls. Defaults to `'parallel'`. */
  concurrency?: 'parallel'
  key?: never
  merge?: never
}

/** Calls run one at a time, in arrival order, per key. */
export interface SerialMutationOptions<TParams, TData> extends MutationBaseOptions<TParams, TData> {
  concurrency: 'serial'
  /** Groups calls, for example by record ID, so ordering applies per key and different keys run concurrently. */
  key?: (params: NoInfer<TParams>) => unknown
  merge?: never
}

/** One call runs at a time per key; while it runs, only the newest waiting params are kept. */
export interface CoalesceMutationOptions<TParams, TData> extends MutationBaseOptions<TParams, TData> {
  concurrency: 'coalesce'
  /** Groups calls, for example by record ID, so coalescing applies per key and different keys run concurrently. */
  key?: (params: NoInfer<TParams>) => unknown
  /**
   * Combines waiting params with newer params for the same key. Without it, the newer params replace the waiting ones,
   * whose call ends as `dropped`. Provide it when params are partial updates, or earlier updates are never sent.
   */
  merge?: (waiting: NoInfer<TParams>, next: NoInfer<TParams>) => NoInfer<TParams>
}

export type MutationOptions<TParams, TData> =
  | CoalesceMutationOptions<TParams, TData>
  | ParallelMutationOptions<TParams, TData>
  | SerialMutationOptions<TParams, TData>
