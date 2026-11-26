import type * as Utils from '../utils'

/**
 * Wraps `executeWithRetry` so every settlement Promise the runtime creates gets a catch handler. A subscriber that
 * throws while an asynchronous settle is delivered then becomes a recorded error instead of an unhandled rejection.
 */
export function wrapExecuteWithRetry(actual: typeof Utils, caught: unknown[]): typeof Utils {
  return {
    ...actual,
    executeWithRetry: ((...args: Parameters<typeof actual.executeWithRetry>) => {
      const promise = actual.executeWithRetry(...args)
      const originalThen = promise.then.bind(promise)
      // oxlint-disable-next-line unicorn/no-thenable -- wraps then to capture the settlement Promise the runtime creates
      promise.then = ((onFulfilled, onRejected) => {
        const settlement = originalThen(onFulfilled, onRejected)
        settlement.catch((error: unknown) => {
          caught.push(error)
        })
        return settlement
      }) as typeof promise.then
      return promise
    }) as typeof actual.executeWithRetry,
  }
}
