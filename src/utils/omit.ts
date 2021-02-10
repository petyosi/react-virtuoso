export interface Dict<T> {
  [key: string]: T
}

export function omit<O extends Dict<any>, K extends readonly string[]>(keys: K, obj: O): Omit<O, K[number]> {
  const result = {} as Dict<any>
  const index = {} as Dict<1>
  let idx = 0
  const len = keys.length

  while (idx < len) {
    index[keys[idx]] = 1
    idx += 1
  }

  for (const prop in obj) {
    if (!index.hasOwnProperty(prop)) {
      result[prop] = obj[prop]
    }
  }

  return result as any
}
