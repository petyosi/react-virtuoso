import { vi } from 'vitest'

/**
 * Wait for the next microtask to complete
 */
export async function waitForMicrotask(): Promise<void> {
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve)
  })
}

/**
 * Wait for a specified timeout duration
 */
export async function waitForTimeout(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create a spy function that tracks all calls with history
 */
export function createSpyWithHistory<T>() {
  const spy = vi.fn()
  const history: T[] = []

  spy.mockImplementation((value: T) => {
    history.push(value)
  })

  return {
    callCount: () => history.length,
    clear: () => {
      history.length = 0
      spy.mockClear()
    },
    history,
    lastCall: () => history[history.length - 1],
    spy,
  }
}

/**
 * Generate a complex test object for testing
 */
export function generateComplexObject() {
  return {
    date: new Date('2023-01-01'),
    id: 123,
    name: 'test',
    nested: {
      array: [1, 2, 3],
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
    },
  }
}

/**
 * Generate various promise test scenarios
 */
export function generatePromiseScenarios() {
  return {
    delayedReject: new Promise((_, reject) =>
      setTimeout(() => {
        reject(new Error('delayed error'))
      }, 10)
    ),
    delayedResolve: new Promise((resolve) =>
      setTimeout(() => {
        resolve('delayed')
      }, 10)
    ),
    immediateReject: Promise.reject(new Error('immediate error')),
    immediateResolve: Promise.resolve('immediate'),
    neverResolve: new Promise(() => {
      /* empty */
    }), // Never resolves
  }
}

/**
 * Create reusable error objects for testing
 */
export const testErrors = {
  customError: new Error('Custom error object'),
  simple: new Error('Test error'),
  typeError: new TypeError('Type error for testing'),
  withMessage: new Error('Specific test message'),
}

/**
 * No-op function for testing
 */
export const noop = () => {
  /* empty */
}
