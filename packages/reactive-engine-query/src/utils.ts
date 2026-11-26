function abortError() {
  return new Error('Aborted')
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout)
      reject(abortError())
    }
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export function defaultRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000)
}

export async function executeWithRetry<T>(
  fn: () => Promise<T> | T,
  options: {
    retry: number
    retryDelay: (n: number) => number
    signal: AbortSignal
  }
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= options.retry; attempt++) {
    if (options.signal.aborted) {
      throw abortError()
    }

    try {
      // oxlint-disable-next-line no-await-in-loop
      return await fn()
    } catch (error) {
      lastError = error

      // An aborted call stops retrying instead of sleeping and trying again.
      if (options.signal.aborted) {
        throw abortError()
      }

      if (attempt < options.retry) {
        const delay = options.retryDelay(attempt)
        // oxlint-disable-next-line no-await-in-loop
        await sleep(delay, options.signal)
      }
    }
  }

  // oxlint-disable-next-line no-throw-literal -- re-throwing the original caught error
  throw lastError
}
