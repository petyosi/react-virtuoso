/**
 * Utils includes
 * - a handful of functional utilities inspired by or taken from the [Ramda library](https://ramdajs.com/);
 * - TypeScript crutches - the [[tup]] function.
 *
 * Use these for your convenience - they are here so that urx is zero-dependency package.
 *
 * @packageDocumentation
 */

/** @internal */
export interface Proc {
  (): any
}

/**
 * Performs left to right composition of two functions.
 */
export function compose<I, A, R>(a: (arg: A) => R, b: (arg: I) => A): (arg: I) => R {
  return (arg: I) => a(b(arg))
}

/**
 * Takes a value and applies a function to it.
 */
export function thrush<I, K>(arg: I, proc: (arg: I) => K) {
  return proc(arg)
}

/**
 * Takes a 2 argument function and partially applies the first argument.
 */
export function curry2to1<T, K, R>(proc: (arg1: T, arg2: K) => R, arg1: T): (arg2: K) => R {
  return (arg2) => proc(arg1, arg2)
}

/**
 * Takes a 1 argument function and returns a function which when called, executes it with the provided argument.
 */
export function curry1to0<T, R>(proc: (arg: T) => R, arg: T): () => R {
  return () => proc(arg)
}

/**
 * Returns a function which extracts the property from from the passed object.
 */
export function prop(property: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return (object: any) => object[property]
}

/**
 * Calls callback with the first argument, and returns it.
 */
export function tap<T>(arg: T, proc: (arg: T) => any): T {
  proc(arg)
  return arg
}

/**
 *  Utility function to help typescript figure out that what we pass is a tuple and not a generic array.
 *  Taken from (this StackOverflow tread)[https://stackoverflow.com/questions/49729550/implicitly-create-a-tuple-in-typescript/52445008#52445008]
 */
export function tup<T extends Array<any>>(...args: T): T {
  return args
}

/**
 * Calls the passed function.
 */
export function call(proc: Proc) {
  proc()
}

/**
 * returns a function which when called always returns the passed value
 */
export function always<T>(value: T) {
  return () => value
}

/**
 * returns a function which calls all passed functions in the passed order.
 * joinProc does not pass arguments or collect return values.
 */
export function joinProc(...procs: Proc[]) {
  return () => {
    procs.map(call)
  }
}

export function isDefined<T>(arg: T): boolean {
  return arg !== undefined
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}
