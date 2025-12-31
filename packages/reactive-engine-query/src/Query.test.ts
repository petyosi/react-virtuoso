import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it, vi } from 'vitest'

import { Query } from './Query'

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
    const queryFn = vi.fn(() => {
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
        error: expect.any(Error) as Error,
        isError: true,
        isFetching: false,
        isLoading: false,
        type: 'error',
      }),
      engine
    )
  })

  it('should refetch when refetch$ triggered', async () => {
    const queryFn = vi.fn(({ count }: { count: number }) => {
      return Promise.resolve(`Result ${count}`)
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
    const queryFn = vi.fn(({ userId }: { userId: number }) => {
      return Promise.resolve(`User ${userId}`)
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
    const queryFn = vi.fn(() => Promise.resolve('Result'))

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

    const queryFn = vi.fn(() => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error(`Attempt ${attemptCount} failed`)
      }
      return Promise.resolve('Success on third attempt')
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
    const queryFn = vi.fn(() => {
      callCount++
      return Promise.resolve(`Call ${callCount}`)
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
    const queryFn = vi.fn(() => 'Fetched data')

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
    const queryFn = vi.fn(() => {
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
    const queryFn = vi.fn(() => {
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
    const queryFn = vi.fn(() => {
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
    const queryFn = vi.fn(() => {
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

    // Wait for initial query + at least one refetch
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(queryFn.mock.calls.length).toBeGreaterThanOrEqual(1)

    // Disable
    engine.pub(query.enabled$, false)
    const callCountAfterDisable = queryFn.mock.calls.length

    // Wait longer, should not poll anymore
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(queryFn.mock.calls.length).toBe(callCountAfterDisable)
  })

  describe('unload', () => {
    it('should transition to pending from success state', async () => {
      const queryFn = vi.fn(() => 'User data')

      const query = Query({
        initialParams: {},
        queryFn,
      })

      const engine = new Engine()
      engine.sub(query.data$, vi.fn())

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
      const queryFn = vi.fn(() => {
        throw new Error('Network error')
      })

      const query = Query({
        initialParams: {},
        queryFn,
        retry: false,
      })

      const engine = new Engine()
      engine.sub(query.data$, vi.fn())

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(engine.getValue(query.data$)).toMatchObject({
        error: expect.any(Error) as Error,
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
      const queryFn = vi.fn(() => {
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
      engine.sub(query.data$, vi.fn())

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
      const queryFn = vi.fn(() => 'User data')

      const query = Query({
        initialParams: {},
        queryFn,
      })

      const engine = new Engine()
      engine.sub(query.data$, vi.fn())

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
  })
})
