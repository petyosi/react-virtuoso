export interface Dict<T> {
  [key: string]: T
}

export function omit<O extends Dict<any>, K extends readonly string[]>(keys: K, obj: O): Omit<O, K[number]> {
  var result = {} as Dict<any>
  var index = {} as Dict<1>
  var idx = 0
  var len = keys.length

  while (idx < len) {
    index[keys[idx]] = 1
    idx += 1
  }

  for (var prop in obj) {
    if (!index.hasOwnProperty(prop)) {
      result[prop] = obj[prop]
    }
  }

  return result as any
}
