/**
 * Calls callback with the first argument, and returns it.
 */
export function tap<T>(arg: T, callback: (arg: T) => unknown): T {
  callback(arg)
  return arg
}

export function noop() {
  // do nothing
}
