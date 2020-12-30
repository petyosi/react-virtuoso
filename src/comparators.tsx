import { ListRange } from './interfaces'

export function tupleComparator(prev: [any, any] | undefined, current: [any, any]) {
  return !!(prev && prev[0] === current[0] && prev[1] === current[1])
}

export function rangeComparator(prev: ListRange | undefined, next: ListRange) {
  return !!(prev && prev.startIndex === next.startIndex && prev.endIndex === next.endIndex)
}
