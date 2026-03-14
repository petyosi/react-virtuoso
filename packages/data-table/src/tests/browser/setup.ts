// Suppress the `null` logged by vitest's error catcher for ResizeObserver errors
// ResizeObserver errors have event.error = null, and vitest logs this null value
const originalError = console.error
console.error = (...args: unknown[]) => {
  if (args.length === 1 && args[0] === null) {
    return
  }
  return originalError.apply(console, args)
}

export { delay } from '../utils'
