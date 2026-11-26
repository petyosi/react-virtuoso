import { afterEach, describe, expect, it, vi } from 'vitest'

import { executeWithRetry } from './utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('executeWithRetry', () => {
  it('keeps the attempt error when the signal aborts while the attempt runs', async () => {
    const controller = new AbortController()
    const serverError = new Error('validation failed')
    const run = executeWithRetry(
      () => {
        controller.abort()
        return Promise.reject(serverError)
      },
      { retry: 2, retryDelay: () => 10, signal: controller.signal }
    )

    await expect(run).rejects.toBe(serverError)
  })

  it('stops with an abort error when the signal aborts during a retry delay, without another attempt', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    let attempts = 0
    const run = executeWithRetry(
      () => {
        attempts += 1
        return Promise.reject(new Error('failed'))
      },
      { retry: 2, retryDelay: () => 100, signal: controller.signal }
    )
    const settled = expect(run).rejects.toThrow('Aborted')
    await vi.advanceTimersByTimeAsync(10)
    controller.abort()
    await settled
    expect(attempts).toBe(1)
  })

  it('does not start an attempt when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const fn = vi.fn(() => Promise.resolve('ok'))

    await expect(executeWithRetry(fn, { retry: 0, retryDelay: () => 0, signal: controller.signal })).rejects.toThrow('Aborted')
    expect(fn).not.toHaveBeenCalled()
  })
})
