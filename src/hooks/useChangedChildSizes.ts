import { SizeFunction, SizeRange } from '../sizeSystem'
import useSize from './useSize'

export default function useChangedChildSizes(callback: (ranges: SizeRange[]) => void, itemSize: SizeFunction, enabled: boolean) {
  return useSize((el: HTMLElement) => {
    const ranges = getChangedChildSizes(el.children, itemSize, 'offsetHeight')
    if (ranges !== null) {
      callback(ranges)
    }
  }, enabled)
}

function getChangedChildSizes(children: HTMLCollection, itemSize: SizeFunction, field: 'offsetHeight' | 'offsetWidth') {
  const length = children.length

  if (length === 0) {
    return null
  }

  const results: SizeRange[] = []

  for (let i = 0; i < length; i++) {
    const child = children.item(i) as HTMLElement

    if (!child || child.dataset.index === undefined) {
      continue
    }

    const index = parseInt(child.dataset.index!)
    const knownSize = parseInt(child.dataset.knownSize!)
    const size = itemSize(child, field)

    if (size === 0) {
      throw new Error('Zero-sized element, this should not happen')
    }

    if (size === knownSize) {
      continue
    }

    const lastResult = results[results.length - 1]
    if (results.length === 0 || lastResult.size !== size || lastResult.endIndex !== index - 1) {
      results.push({ startIndex: index, endIndex: index, size })
    } else {
      results[results.length - 1].endIndex++
    }
  }

  return results
}
