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
/**
 * The default comparator for distinct nodes - a function to determine if two values are equal. Works for primitive values.
 * @category Nodes
 */

export function defaultComparator<T>(current: T | undefined, next: T) {
  return current === next
}
