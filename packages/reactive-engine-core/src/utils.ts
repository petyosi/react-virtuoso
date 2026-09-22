import type { Comparator, ProjectionFunc } from './types'

/**
 * Calls callback with the first argument, and returns it.
 * @typeParam T - The type of the argument that is passed and returned.
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
 * @typeParam T - The type of values being compared.
 * @category Nodes
 */

export function defaultComparator<T>(current: T | undefined, next: T) {
  return current === next
}

/**
 * Creates a comparator from the fields that define a value's observable identity.
 * An undefined previous value is never equal.
 *
 * @category Misc
 */
export function equalBy<T>(...selectors: ((value: T) => unknown)[]): Comparator<T> {
  return (previous, current) => previous !== undefined && selectors.every((select) => select(previous) === select(current))
}

/**
 * Lifts a domain comparator over nullable state.
 * The domain comparator runs only when both values are non-null.
 *
 * @category Misc
 */
export function equalNullable<T>(equal: (left: T, right: T) => boolean): Comparator<null | T> {
  return (previous, current) => {
    if (previous === current) {
      return true
    }
    if (previous === undefined || previous === null || current === null) {
      return false
    }
    return equal(previous, current)
  }
}

/**
 * Compares ordered arrays by length and item position.
 * Two absent arrays are equal, while absence and an empty array are different.
 *
 * @category Misc
 */
export function equalArrays<T>(
  left: readonly T[] | undefined,
  right: readonly T[] | undefined,
  itemEqual: (left: T, right: T) => boolean = Object.is
): boolean {
  if (left === right) {
    return true
  }
  if (left === undefined || right === undefined || left.length !== right.length) {
    return false
  }
  return left.every((item, index) => itemEqual(item, right[index] as T))
}

export const combinedCellProjection: ProjectionFunc = (done) => {
  return (...args) => {
    done(args)
  }
}
