import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it, vi } from 'vitest'

import { Mutation } from './Mutation'

describe('Mutation', () => {
  it('should start in idle state', () => {
    const mutationFn = vi.fn((params: { name: string }) => params.name)

    const mutation = Mutation({
      mutationFn,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    const state = engine.getValue(mutation.data$)
    expect(state).toMatchObject({
      data: null,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: false,
      type: 'idle',
    })
  })

  it('should execute successful mutation', async () => {
    const mutationFn = vi.fn(async (params: { name: string }) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(`Hello ${params.name}`)
        }, 50)
      })
    })

    const mutation = Mutation({
      mutationFn,
    })

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(mutation.data$, sub)

    // Trigger mutation
    engine.pub(mutation.mutate$, { name: 'World' })

    // Should be pending
    expect(sub).toHaveBeenCalledWith(
      expect.objectContaining({
        isPending: true,
        type: 'pending',
      }),
      engine
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should be success
    expect(sub).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: 'Hello World',
        isPending: false,
        isSuccess: true,
        type: 'success',
      }),
      engine
    )

    expect(mutationFn).toHaveBeenCalledTimes(1)
    expect(mutationFn).toHaveBeenCalledWith({ name: 'World' })
  })

  it('should handle mutation errors', async () => {
    const mutationFn = vi.fn(() => {
      throw new Error('Mutation failed')
    })

    const mutation = Mutation({
      mutationFn,
      retry: false,
    })

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(mutation.data$, sub)

    // Trigger mutation
    engine.pub(mutation.mutate$, {})

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(sub).toHaveBeenLastCalledWith(
      expect.objectContaining({
        error: expect.any(Error) as Error,
        isError: true,
        isPending: false,
        type: 'error',
      }),
      engine
    )
  })

  it('should reset mutation state', async () => {
    const mutationFn = vi.fn((params: { value: number }) => params.value * 2)

    const mutation = Mutation({
      mutationFn,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    // Execute mutation
    engine.pub(mutation.mutate$, { value: 5 })

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(engine.getValue(mutation.data$)).toMatchObject({
      data: 10,
      type: 'success',
    })

    // Reset
    engine.pub(mutation.reset$)

    expect(engine.getValue(mutation.data$)).toMatchObject({
      data: null,
      error: null,
      type: 'idle',
    })
  })

  it('should retry on failure', async () => {
    let attemptCount = 0

    const mutationFn = vi.fn(() => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error(`Attempt ${attemptCount} failed`)
      }
      return 'Success on third attempt'
    })

    const mutation = Mutation({
      mutationFn,
      retry: 2,
      retryDelay: () => 10, // Short delay for testing
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    // Trigger mutation
    engine.pub(mutation.mutate$, {})

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mutationFn).toHaveBeenCalledTimes(3)
    expect(engine.getValue(mutation.data$)).toMatchObject({
      data: 'Success on third attempt',
      type: 'success',
    })
  })

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn()
    const mutationFn = vi.fn((params: { value: number }) => params.value * 2)

    const mutation = Mutation({
      mutationFn,
      onSuccess,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    // Trigger mutation
    engine.pub(mutation.mutate$, { value: 5 })

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(10)
  })

  it('should call onError callback', async () => {
    const onError = vi.fn()
    const mutationFn = vi.fn(() => {
      throw new Error('Mutation failed')
    })

    const mutation = Mutation({
      mutationFn,
      onError,
      retry: false,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    // Trigger mutation
    engine.pub(mutation.mutate$, {})

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('should handle retry: false option', async () => {
    const mutationFn = vi.fn(() => {
      throw new Error('Always fails')
    })

    const mutation = Mutation({
      mutationFn,
      retry: false,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    // Trigger mutation
    engine.pub(mutation.mutate$, {})

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Should only be called once (no retries)
    expect(mutationFn).toHaveBeenCalledTimes(1)
    expect(engine.getValue(mutation.data$)).toMatchObject({
      type: 'error',
    })
  })

  it('should handle retry: 0 option', async () => {
    const mutationFn = vi.fn(() => {
      throw new Error('Always fails')
    })

    const mutation = Mutation({
      mutationFn,
      retry: 0,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    // Trigger mutation
    engine.pub(mutation.mutate$, {})

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Should only be called once (no retries)
    expect(mutationFn).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple mutations', async () => {
    let callCount = 0
    const mutationFn = vi.fn((params: { value: number }) => {
      callCount++
      return `Call ${callCount}: ${params.value}`
    })

    const mutation = Mutation({
      mutationFn,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    // First mutation
    engine.pub(mutation.mutate$, { value: 1 })
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(engine.getValue(mutation.data$)).toMatchObject({
      data: 'Call 1: 1',
      type: 'success',
    })

    // Second mutation
    engine.pub(mutation.mutate$, { value: 2 })
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(engine.getValue(mutation.data$)).toMatchObject({
      data: 'Call 2: 2',
      type: 'success',
    })

    expect(mutationFn).toHaveBeenCalledTimes(2)
  })

  it('should handle errors in onSuccess callback', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())

    const onSuccess = vi.fn(() => {
      throw new Error('Callback error')
    })

    const mutationFn = vi.fn(() => 'Success')

    const mutation = Mutation({
      mutationFn,
      onSuccess,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    engine.pub(mutation.mutate$, {})

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Mutation should still succeed
    expect(engine.getValue(mutation.data$)).toMatchObject({
      data: 'Success',
      type: 'success',
    })

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should handle errors in onError callback', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())

    const onError = vi.fn(() => {
      throw new Error('Callback error')
    })

    const mutationFn = vi.fn(() => {
      throw new Error('Mutation failed')
    })

    const mutation = Mutation({
      mutationFn,
      onError,
      retry: false,
    })

    const engine = new Engine()
    engine.sub(mutation.data$, vi.fn())

    engine.pub(mutation.mutate$, {})

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Mutation should still be in error state
    expect(engine.getValue(mutation.data$)).toMatchObject({
      type: 'error',
    })

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
