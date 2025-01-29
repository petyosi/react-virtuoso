import { ListRange } from './interfaces'

export function tupleComparator<T1, T2>(prev: [T1, T2] | undefined, current: [T1, T2]) {
  return !!(prev && prev[0] === current[0] && prev[1] === current[1])
}

export function rangeComparator(prev: ListRange | undefined, next: ListRange) {
  return !!(prev && prev.startIndex === next.startIndex && prev.endIndex === next.endIndex)
}
