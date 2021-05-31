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
    // If size is zero, we might be in a CSS Grid that's using `display: contents`
    // on the Item and/or itemContent or both, so look up to 2 levels down for the 1st cell.
    // for (let i = 0, current = child.firstElementChild; i < 2 && size === 0 && current; i++, current = current.firstElementChild) {
    //   size = (current as HTMLElement)[field]
    // }

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
