import { describe, expect, it, vi } from 'vitest'

import { Engine } from '../../Engine'
import { Query } from '../../query/Query'

describe('Query', () => {
  it('should execute query on init with success', async () => {
    const queryFn = vi.fn(async ({ userId }: { userId: number }) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(`User ${userId}`)
        }, 50)
      })
    })

    const query = Query({
      initialParams: { userId: 1 },
      queryFn,
    })

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(query.data$, sub)

    // Initial state should be pending
    expect(engine.getValue(query.data$)).toMatchObject({
      data: null,
      isFetching: true,
      isLoading: true,
      type: 'pending',
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    // After query completes, should be success
    expect(sub).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: 'User 1',
        isFetching: false,
        isLoading: false,
        isSuccess: true,
        type: 'success',
      }),
      engine
    )

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledWith({ userId: 1 }, expect.any(AbortSignal))
  })

  it('should handle query errors', async () => {
    const queryFn = vi.fn(async () => {
      throw new Error('Network error')
    })

    const query = Query({
      initialParams: {},
      queryFn,
      retry: false,
    })

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(query.data$, sub)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(sub).toHaveBeenLastCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        isError: true,
        isFetching: false,
        isLoading: false,
        type: 'error',
      }),
      engine
    )
  })

  it('should refetch when refetch$ triggered', async () => {
    const queryFn = vi.fn(async ({ count }: { count: number }) => {
      return `Result ${count}`
    })

    const query = Query({
      initialParams: { count: 1 },
      queryFn,
    })

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(query.data$, sub)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(queryFn).toHaveBeenCalledTimes(1)

    // Trigger refetch
    engine.pub(query.refetch$)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(queryFn).toHaveBeenLastCalledWith({ count: 1 }, expect.any(AbortSignal))
  })

  it('should execute new query when params$ changes', async () => {
    const queryFn = vi.fn(async ({ userId }: { userId: number }) => {
      return `User ${userId}`
    })

    const query = Query({
      initialParams: { userId: 1 },
      queryFn,
    })

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(query.data$, sub)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledWith({ userId: 1 }, expect.any(AbortSignal))

    // Change params
    engine.pub(query.params$, { userId: 2 })

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(queryFn).toHaveBeenLastCalledWith({ userId: 2 }, expect.any(AbortSignal))

    expect(sub).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: 'User 2',
        type: 'success',
      }),
      engine
    )
  })

  it('should not execute when enabled$ is false', async () => {
    const queryFn = vi.fn(async () => 'Result')

    const query = Query({
      enabled: false,
      initialParams: {},
      queryFn,
    })

    const engine = new Engine()
    engine.sub(query.data$, vi.fn())

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(queryFn).not.toHaveBeenCalled()

    // Enable query
    engine.pub(query.enabled$, true)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should disable query when enabled$ set to false', async () => {
    const queryFn = vi.fn(async () => {
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve('Result')
        }, 100)
      })
    })

    const query = Query({
      initialParams: {},
      queryFn,
    })

    const engine = new Engine()
    engine.sub(query.data$, vi.fn())

    // Disable immediately
    engine.pub(query.enabled$, false)

    await new Promise((resolve) => setTimeout(resolve, 150))

    // Query should still complete but we should be in pending state
    // because we disabled it
    const state = engine.getValue(query.data$)
    expect(state.type).toBe('pending')
  })

  it('should abort previous fetch when new fetch starts', async () => {
    let abortedCount = 0

    const queryFn = vi.fn(async ({ id }: { id: number }, signal: AbortSignal) => {
      return new Promise<string>((resolve, reject) => {
        signal.addEventListener('abort', () => {
          abortedCount++
          reject(new Error('Aborted'))
        })

        setTimeout(() => {
          if (!signal.aborted) {
            resolve(`Result ${id}`)
          }
        }, 100)
      })
    })

    const query = Query({
      initialParams: { id: 1 },
      queryFn,
    })

    const engine = new Engine()
    engine.sub(query.data$, vi.fn())

    // Quickly change params to trigger abort
    await new Promise((resolve) => setTimeout(resolve, 20))
    engine.pub(query.params$, { id: 2 })

    await new Promise((resolve) => setTimeout(resolve, 20))
    engine.pub(query.params$, { id: 3 })

    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(abortedCount).toBe(2)
    expect(engine.getValue(query.data$)).toMatchObject({
      data: 'Result 3',
      type: 'success',
    })
  })

  it('should retry on failure with exponential backoff', async () => {
    let attemptCount = 0

    const queryFn = vi.fn(async () => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error(`Attempt ${attemptCount} failed`)
      }
      return 'Success on third attempt'
    })

    const query = Query({
      initialParams: {},
      queryFn,
      retry: 2,
      retryDelay: () => 10, // Short delay for testing
    })

    const engine = new Engine()
    engine.sub(query.data$, vi.fn())

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(queryFn).toHaveBeenCalledTimes(3)
    expect(engine.getValue(query.data$)).toMatchObject({
      data: 'Success on third attempt',
      type: 'success',
    })
  })

  it('should poll with refetchInterval', async () => {
    let callCount = 0
    const queryFn = vi.fn(async () => {
      callCount++
      return `Call ${callCount}`
    })

    const query = Query({
      initialParams: {},
      queryFn,
      refetchInterval: 50,
    })

    const engine = new Engine()
    engine.sub(query.data$, vi.fn())

    // Wait for initial query
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(queryFn).toHaveBeenCalledTimes(1)

    // Wait for first refetch
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(queryFn.mock.calls.length).toBeGreaterThanOrEqual(2)

    // Wait for second refetch
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(queryFn.mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  it('should use initial data', async () => {
    const queryFn = vi.fn(async () => 'Fetched data')

    const query = Query({
      initialData: 'Initial data',
      initialParams: {},
      queryFn,
    })

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(query.data$, sub)

    // Should immediately have initial data
    const state = engine.getValue(query.data$)
    expect(state).toMatchObject({
      data: 'Initial data',
      isFetching: true, // Query still executes in background
      isLoading: false,
      type: 'success',
    })

    await new Promise((resolve) => setTimeout(resolve, 50))

    // After query completes, should have fetched data
    expect(engine.getValue(query.data$)).toMatchObject({
      data: 'Fetched data',
      isFetching: false,
      type: 'success',
    })
  })

  it('should invalidate and refetch while keeping data', async () => {
    let callCount = 0
    const queryFn = vi.fn(async () => {
      callCount++
      return `Data ${callCount}`
    })

    const query = Query({
      initialParams: {},
      queryFn,
    })

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(query.data$, sub)

    // Wait for initial query
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(engine.getValue(query.data$)).toMatchObject({
      data: 'Data 1',
      isFetching: false,
      type: 'success',
    })

    // Invalidate
    engine.pub(query.invalidate$)

    // Should keep data but set isFetching
    const stateAfterInvalidate = engine.getValue(query.data$)
    expect(stateAfterInvalidate).toMatchObject({
      data: 'Data 1',
      isFetching: true,
      type: 'success',
    })

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Should have new data
    expect(engine.getValue(query.data$)).toMatchObject({
      data: 'Data 2',
      isFetching: false,
      type: 'success',
    })
  })

  it('should handle retry: false option', async () => {
    const queryFn = vi.fn(async () => {
      throw new Error('Always fails')
    })

    const query = Query({
      initialParams: {},
      queryFn,
      retry: false,
    })

    const engine = new Engine()
    engine.sub(query.data$, vi.fn())

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Should only be called once (no retries)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(engine.getValue(query.data$)).toMatchObject({
      type: 'error',
    })
  })

  it('should handle retry: 0 option', async () => {
    const queryFn = vi.fn(async () => {
      throw new Error('Always fails')
    })

    const query = Query({
      initialParams: {},
      queryFn,
      retry: 0,
    })

    const engine = new Engine()
    engine.sub(query.data$, vi.fn())

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Should only be called once (no retries)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should clear polling when disabled', async () => {
    let callCount = 0
    const queryFn = vi.fn(async () => {
      callCount++
      return `Call ${callCount}`
    })

    const query = Query({
      initialParams: {},
      queryFn,
      refetchInterval: 50,
    })

    const engine = new Engine()
    engine.sub(query.data$, vi.fn())

    // Wait for initial query
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(queryFn).toHaveBeenCalledTimes(1)

    // Wait for first refetch
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(queryFn).toHaveBeenCalledTimes(2)

    // Disable
    engine.pub(query.enabled$, false)

    // Wait longer, should not poll anymore
    await new Promise((resolve) => setTimeout(resolve, 120))
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  describe('unload', () => {
    it('should transition to pending from success state', async () => {
      const queryFn = vi.fn(async () => {
        return 'User data'
      })

      const query = Query({
        initialParams: {},
        queryFn,
      })

      const engine = new Engine()
      engine.sub(query.data$, () => {})

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(engine.getValue(query.data$)).toMatchObject({
        data: 'User data',
        isSuccess: true,
        type: 'success',
      })

      engine.pub(query.unload$)

      expect(engine.getValue(query.data$)).toMatchObject({
        data: null,
        dataUpdatedAt: null,
        isError: false,
        isFetching: true,
        isLoading: true,
        isSuccess: false,
        type: 'pending',
      })
    })

    it('should transition to pending from error state', async () => {
      const queryFn = vi.fn(async () => {
        throw new Error('Network error')
      })

      const query = Query({
        initialParams: {},
        queryFn,
        retry: false,
      })

      const engine = new Engine()
      engine.sub(query.data$, () => {})

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(engine.getValue(query.data$)).toMatchObject({
        error: expect.any(Error),
        isError: true,
        type: 'error',
      })

      engine.pub(query.unload$)

      expect(engine.getValue(query.data$)).toMatchObject({
        data: null,
        error: null,
        isError: false,
        isFetching: true,
        isLoading: true,
        isSuccess: false,
        type: 'pending',
      })
    })

    it('should remain pending when already pending', async () => {
      const queryFn = vi.fn(async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('Data')
          }, 200)
        })
      })

      const query = Query({
        initialParams: {},
        queryFn,
      })

      const engine = new Engine()
      engine.sub(query.data$, () => {})

      expect(engine.getValue(query.data$)).toMatchObject({
        isLoading: true,
        type: 'pending',
      })

      engine.pub(query.unload$)

      expect(engine.getValue(query.data$)).toMatchObject({
        data: null,
        isFetching: true,
        isLoading: true,
        type: 'pending',
      })

      // Query function aborted, shouldn't complete
      await new Promise((resolve) => setTimeout(resolve, 250))
      expect(engine.getValue(query.data$).type).toBe('pending')
    })

    it('should clear data when Query is disabled', async () => {
      const queryFn = vi.fn(async () => {
        return 'User data'
      })

      const query = Query({
        initialParams: {},
        queryFn,
      })

      const engine = new Engine()
      engine.sub(query.data$, () => {})

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(engine.getValue(query.data$)).toMatchObject({
        data: 'User data',
        type: 'success',
      })

      engine.pub(query.enabled$, false)
      engine.pub(query.unload$)

      expect(engine.getValue(query.data$)).toMatchObject({
        data: null,
        isFetching: true,
        isLoading: true,
        type: 'pending',
      })

      // Unload doesn't trigger refetch
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(engine.getValue(query.data$).type).toBe('pending')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should prevent stale data when unloading before params change', async () => {
      const queryFn = vi.fn(async ({ userId }: { userId: number }) => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve(`User ${userId}`)
          }, 50)
        })
      })

      const query = Query({
        initialParams: { userId: 1 },
        queryFn,
      })

      const engine = new Engine()
      const states: { data: null | string; type: string }[] = []
      engine.sub(query.data$, (state) => {
        states.push({ data: state.data, type: state.type })
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(engine.getValue(query.data$)).toMatchObject({
        data: 'User 1',
        type: 'success',
      })

      states.length = 0

      engine.pub(query.unload$)
      engine.pub(query.params$, { userId: 2 })

      expect(engine.getValue(query.data$)).toMatchObject({
        data: null,
        type: 'pending',
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(engine.getValue(query.data$)).toMatchObject({
        data: 'User 2',
        type: 'success',
      })

      const staleDataShown = states.some((s) => s.data === 'User 1')
      expect(staleDataShown).toBe(false)
    })

    it('should show stale data when params change without unload', async () => {
      const queryFn = vi.fn(async ({ userId }: { userId: number }) => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve(`User ${userId}`)
          }, 50)
        })
      })

      const query = Query({
        initialParams: { userId: 1 },
        queryFn,
      })

      const engine = new Engine()
      const states: { data: null | string; type: string }[] = []
      engine.sub(query.data$, (state) => {
        states.push({ data: state.data, type: state.type })
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(engine.getValue(query.data$)).toMatchObject({
        data: 'User 1',
        type: 'success',
      })

      states.length = 0

      engine.pub(query.params$, { userId: 2 })

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(engine.getValue(query.data$)).toMatchObject({
        data: 'User 2',
        type: 'success',
      })

      // Control test: stale data IS visible during background refetch
      const staleDataShown = states.some((s) => s.type === 'success' && s.data === 'User 1')
      expect(staleDataShown).toBe(true)
    })

    it('should abort in-flight requests when unloaded', async () => {
      let abortSignalReceived: AbortSignal | undefined

      const queryFn = vi.fn(async (_params: object, signal: AbortSignal) => {
        abortSignalReceived = signal
        return new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve('Data')
          }, 200)
          signal.addEventListener('abort', () => {
            clearTimeout(timeout)
            reject(new Error('Aborted'))
          })
        })
      })

      const query = Query({
        initialParams: {},
        queryFn,
      })

      const engine = new Engine()
      engine.sub(query.data$, () => {})

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(abortSignalReceived).toBeDefined()
      expect(abortSignalReceived?.aborted).toBe(false)

      engine.pub(query.unload$)

      expect(abortSignalReceived?.aborted).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 250))

      expect(engine.getValue(query.data$)).toMatchObject({
        data: null,
        type: 'pending',
      })
    })

    it('should preserve polling intervals after unload', async () => {
      const queryFn = vi.fn(async () => {
        return 'Data'
      })

      const query = Query({
        initialParams: {},
        queryFn,
        refetchInterval: 50,
      })

      const engine = new Engine()
      engine.sub(query.data$, () => {})

      await new Promise((resolve) => setTimeout(resolve, 120))

      const callCountBeforeUnload = queryFn.mock.calls.length
      expect(callCountBeforeUnload).toBeGreaterThanOrEqual(2)

      engine.pub(query.unload$)

      expect(engine.getValue(query.data$).type).toBe('pending')

      await new Promise((resolve) => setTimeout(resolve, 120))

      const callCountAfterUnload = queryFn.mock.calls.length
      expect(callCountAfterUnload).toBeGreaterThan(callCountBeforeUnload)
    })

    it('should abort retry sequences when unloaded', async () => {
      let attemptCount = 0

      const queryFn = vi.fn(async () => {
        attemptCount++
        throw new Error('Network error')
      })

      const query = Query({
        initialParams: {},
        queryFn,
        retry: 5,
        retryDelay: () => 100,
      })

      const engine = new Engine()
      engine.sub(query.data$, () => {})

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(attemptCount).toBe(1)

      engine.pub(query.unload$)

      expect(engine.getValue(query.data$).type).toBe('pending')

      await new Promise((resolve) => setTimeout(resolve, 400))

      // Retry aborted - no additional attempts after unload
      expect(attemptCount).toBe(1)
    })

    it('should be idempotent with multiple rapid unload calls', async () => {
      const queryFn = vi.fn(async () => {
        return 'User data'
      })

      const query = Query({
        initialParams: {},
        queryFn,
      })

      const engine = new Engine()
      const stateUpdates: { type: string }[] = []
      engine.sub(query.data$, (state) => {
        stateUpdates.push({ type: state.type })
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(engine.getValue(query.data$).type).toBe('success')

      stateUpdates.length = 0

      engine.pub(query.unload$)
      engine.pub(query.unload$)
      engine.pub(query.unload$)

      // Each unload triggers handler publishing identical pending state
      // Distinct check may allow some through, but result is the same
      const pendingTransitions = stateUpdates.filter((s) => s.type === 'pending')
      expect(pendingTransitions.length).toBeGreaterThanOrEqual(1)

      expect(engine.getValue(query.data$)).toMatchObject({
        data: null,
        type: 'pending',
      })

      expect(queryFn).toHaveBeenCalledTimes(1)
    })
  })
})
