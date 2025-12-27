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

export interface MutationPendingResult {
  data: null
  error: null
  isError: false
  isPending: true
  isSuccess: false
  type: 'pending'
}

export interface MutationSuccessResult<T> {
  data: T
  error: null
  isError: false
  isPending: false
  isSuccess: true
  type: 'success'
}

export interface MutationErrorResult {
  data: null
  error: unknown
  isError: true
  isPending: false
  isSuccess: false
  type: 'error'
}

export type MutationResult<T> = MutationErrorResult | MutationIdleResult | MutationPendingResult | MutationSuccessResult<T>

export interface MutationOptions<TParams, TData> {
  mutationFn: (params: TParams) => Promise<TData> | TData
  onError?: (error: unknown) => void
  onSuccess?: (data: TData) => void
  retry?: false | number
  retryDelay?: (attemptIndex: number) => number
}
