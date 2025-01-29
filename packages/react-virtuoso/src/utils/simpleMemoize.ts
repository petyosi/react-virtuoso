export function simpleMemoize<T extends () => any>(func: T): T {
  let called = false
  let result: unknown

  return (() => {
    if (!called) {
      called = true
      result = func()
    }
    return result
  }) as T
}
