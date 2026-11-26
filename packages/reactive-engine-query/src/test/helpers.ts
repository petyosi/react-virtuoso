export interface Deferred<T> {
  promise: Promise<T>
  reject: (error: unknown) => void
  resolve: (value: T) => void
}

export function deferred<T>(): Deferred<T> {
  let resolveDeferred!: (value: T) => void
  let rejectDeferred!: (error: unknown) => void
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve
    rejectDeferred = reject
  })
  return { promise, reject: rejectDeferred, resolve: resolveDeferred }
}

/** Settles every pending Promise reaction, however many microtask hops the retry wrapper adds. */
export async function flushPromises() {
  for (let index = 0; index < 10; index++) {
    // oxlint-disable-next-line no-await-in-loop
    await Promise.resolve()
  }
}

/** A mutationFn whose calls the test settles by hand. */
export function controlledFn<TParams, TData>() {
  const calls: { params: TParams; request: Deferred<TData>; signal: AbortSignal }[] = []
  const fn = (params: TParams, signal: AbortSignal) => {
    const request = deferred<TData>()
    calls.push({ params, request, signal })
    return request.promise
  }
  return { calls, fn }
}

/** A Promise executor that never settles the Promise. */
export function neverSettle() {
  // Intentionally empty: the Promise stays pending.
}
