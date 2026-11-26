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

// Shared by Mutation and ConcurrentMutation

/** A record key: a string, or a finite number. `1` and `'1'` are different keys. */
export type Key = number | string

/** Adds `key` to keyed outputs. Unkeyed primitives (`key: false`) have no `key` field. */
export type KeyField<TKey extends Key> = [TKey] extends [never] ? object : { key: TKey }

// Mutation state

export interface MutationIdleResult {
  data: null
  error: null
  isError: false
  isPending: false
  isSuccess: false
  type: 'idle'
}

export type MutationPendingResult<TParams = unknown, TKey extends Key = never> = KeyField<TKey> & {
  data: null
  error: null
  isError: false
  isPending: true
  isSuccess: false
  /** The params of the running call. */
  params: TParams
  type: 'pending'
}

export type MutationSuccessResult<TData, TParams = unknown, TKey extends Key = never> = KeyField<TKey> & {
  data: TData
  error: null
  isError: false
  isPending: false
  isSuccess: true
  /** The params of the call that succeeded. */
  params: TParams
  /** `Date.now()` when the call settled. */
  settledAt: number
  type: 'success'
}

export type MutationErrorResult<TParams = unknown, TKey extends Key = never> = KeyField<TKey> & {
  data: null
  error: unknown
  isError: true
  isPending: false
  isSuccess: false
  /** The params of the call that failed. */
  params: TParams
  /** `Date.now()` when the call settled. */
  settledAt: number
  type: 'error'
}

/** The state of one `Mutation` record. A pending record has a call in flight; a settled result stays until dismissed. */
export type MutationResult<TData, TParams = unknown, TKey extends Key = never> =
  | MutationErrorResult<TParams, TKey>
  | MutationIdleResult
  | MutationPendingResult<TParams, TKey>
  | MutationSuccessResult<TData, TParams, TKey>

/** A keyed `Mutation` record that is not idle. Idle records have no entry in `status$`. */
export type MutationActiveResult<TData, TParams = unknown, TKey extends Key = never> =
  | MutationErrorResult<TParams, TKey>
  | MutationPendingResult<TParams, TKey>
  | MutationSuccessResult<TData, TParams, TKey>

/**
 * One outcome per `mutate$` input, emitted on `settled$`.
 * - `success` and `error`: the call ran.
 * - `ignored`: the call was refused because its record had a call in flight; it was never sent.
 */
export type MutationSettled<TData, TParams = unknown, TKey extends Key = never> = KeyField<TKey> &
  (
    | { data: TData; params: TParams; type: 'success' }
    | { error: unknown; params: TParams; type: 'error' }
    | { params: TParams; type: 'ignored' }
  )

interface MutationBaseOptions<TParams, TData> {
  /**
   * Performs the call. The signal aborts only when the engine is disposed; a call that started is never aborted
   * otherwise, because aborting a request does not undo it on the server.
   */
  mutationFn: (params: TParams, signal: AbortSignal) => Promise<TData> | TData
  /** Runs for every call that fails, after the outcome is delivered. Receives the engine that owns the mutation. */
  onError?: (error: unknown, params: NoInfer<TParams>, engine: Engine) => void
  /**
   * Runs for every ignored call. Providing it turns off the development warning. Record or notify here; never publish
   * the same params to `mutate$` again synchronously.
   */
  onIgnored?: (params: NoInfer<TParams>, engine: Engine) => void
  /** Runs for every call that succeeds, after the outcome is delivered. Receives the engine that owns the mutation. */
  onSuccess?: (data: NoInfer<TData>, params: NoInfer<TParams>, engine: Engine) => void
  /** Retries inside one call; the record stays busy until the last attempt settles. Defaults to 0. */
  retry?: false | number
  retryDelay?: (attemptIndex: number) => number
}

/** Options for a `Mutation` with one record per key. */
export interface KeyedMutationOptions<TParams, TData, TKey extends Key> extends MutationBaseOptions<TParams, TData> {
  /** Identifies the record a call belongs to. One call per record runs at a time. */
  key: (params: NoInfer<TParams>) => TKey
}

/** Options for a `Mutation` that is one record. */
export interface UnkeyedMutationOptions<TParams, TData> extends MutationBaseOptions<TParams, TData> {
  /** The whole mutation is one record: one call runs at a time. */
  key: false
}

export type MutationOptions<TParams, TData, TKey extends Key = never> =
  | KeyedMutationOptions<TParams, TData, TKey>
  | UnkeyedMutationOptions<TParams, TData>

// ConcurrentMutation state

/** The state of one `ConcurrentMutation` record. A keyed record with no entry in `status$` is idle. */
export type ConcurrentMutationState<TParams, TData, TKey extends Key = never> = KeyField<TKey> & {
  /** Calls that failed, in settle order. Only dismiss clears them. */
  failures: readonly { error: unknown; params: TParams; settledAt: number }[]
  /** True while `running` or `waiting` is non-empty. */
  isPending: boolean
  /** The last call to finish successfully, not the last to start. A failed call does not change it. */
  lastSuccess: null | { data: TData; params: TParams; settledAt: number }
  /** Params of the running calls, in start order. */
  running: readonly TParams[]
  /** Params of the waiting calls, in arrival order. A merged waiting call appears once, with its merged params. */
  waiting: readonly TParams[]
}

/**
 * One outcome per call, emitted on `settled$`.
 * - `success` and `error`: the call ran.
 * - `dropped`: the call was waiting, then replaced or removed; it was never sent and has no callback.
 *
 * Inputs merged into a waiting call share that call's outcome, which carries the merged params.
 */
export type ConcurrentMutationSettled<TData, TParams = unknown, TKey extends Key = never> = KeyField<TKey> &
  (
    | { data: TData; params: TParams; type: 'success' }
    | { error: unknown; params: TParams; type: 'error' }
    | { params: TParams; type: 'dropped' }
  )

/** How overlapping calls for the same record are scheduled. */
export type ConcurrentMutationConcurrency = 'coalesce' | 'parallel' | 'serial'

interface ConcurrentMutationBaseOptions<TParams, TData> {
  /** Performs the call. The signal aborts only when the engine is disposed. */
  mutationFn: (params: TParams, signal: AbortSignal) => Promise<TData> | TData
  /** Runs for every call that fails, after the outcome is delivered. */
  onError?: (error: unknown, params: NoInfer<TParams>, engine: Engine) => void
  /** Runs for every call that succeeds, after the outcome is delivered. */
  onSuccess?: (data: NoInfer<TData>, params: NoInfer<TParams>, engine: Engine) => void
  retry?: false | number
  retryDelay?: (attemptIndex: number) => number
}

type ConcurrentMutationPolicyOptions<TParams> =
  | {
      /**
       * - `parallel`: every call starts immediately.
       * - `serial`: one call per record at a time, in arrival order.
       */
      concurrency: 'parallel' | 'serial'
      merge?: never
    }
  | {
      /** `coalesce`: one call per record at a time; only the newest waiting params are kept. */
      concurrency: 'coalesce'
      /**
       * Combines waiting params with newer params for the same record. Without it, the newer params replace the
       * waiting ones, whose call ends as `dropped`.
       */
      merge?: (waiting: NoInfer<TParams>, next: NoInfer<TParams>) => NoInfer<TParams>
    }

/** Options for a `ConcurrentMutation` with one record per key. */
export type KeyedConcurrentMutationOptions<TParams, TData, TKey extends Key> = ConcurrentMutationBaseOptions<TParams, TData> &
  ConcurrentMutationPolicyOptions<TParams> & {
    /** Identifies the record a call belongs to. Under `parallel`, it splits state only. */
    key: (params: NoInfer<TParams>) => TKey
  }

/** Options for a `ConcurrentMutation` that is one record. */
export type UnkeyedConcurrentMutationOptions<TParams, TData> = ConcurrentMutationBaseOptions<TParams, TData> &
  ConcurrentMutationPolicyOptions<TParams> & {
    key: false
  }

export type ConcurrentMutationOptions<TParams, TData, TKey extends Key = never> =
  | KeyedConcurrentMutationOptions<TParams, TData, TKey>
  | UnkeyedConcurrentMutationOptions<TParams, TData>
