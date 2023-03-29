import React from 'react'
import { Log, LogLevel } from '../loggerSystem'
import { SizeRange } from '../sizeSystem'
import { useSizeWithElRef } from './useSize'
import { SizeFunction, ScrollContainerState } from '../interfaces'
export default function useChangedListContentsSizes(
  callback: (ranges: SizeRange[]) => void,
  itemSize: SizeFunction,
  enabled: boolean,
  scrollContainerStateCallback: (state: ScrollContainerState) => void,
  log: Log,
  gap?: (gap: number) => void,
  customScrollParent?: HTMLElement
) {
  const memoedCallback = React.useCallback(
    (el: HTMLElement) => {
      const ranges = getChangedChildSizes(el.children, itemSize, 'offsetHeight', log)
      let scrollableElement = el.parentElement!

      while (!scrollableElement.dataset['virtuosoScroller']) {
        scrollableElement = scrollableElement.parentElement!
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const windowScrolling = (scrollableElement.lastElementChild! as HTMLDivElement).dataset['viewportType']! === 'window'

      const scrollTop = customScrollParent
        ? customScrollParent.scrollTop
        : windowScrolling
        ? window.pageYOffset || document.documentElement.scrollTop
        : scrollableElement.scrollTop

      const scrollHeight = customScrollParent
        ? customScrollParent.scrollHeight
        : windowScrolling
        ? document.documentElement.scrollHeight
        : scrollableElement.scrollHeight

      const viewportHeight = customScrollParent
        ? customScrollParent.offsetHeight
        : windowScrolling
        ? window.innerHeight
        : scrollableElement.offsetHeight

      scrollContainerStateCallback({
        scrollTop: Math.max(scrollTop, 0),
        scrollHeight,
        viewportHeight,
      })

      gap?.(resolveGapValue('row-gap', getComputedStyle(el).rowGap, log))

      if (ranges !== null) {
        callback(ranges)
      }
    },
    [callback, itemSize, log, gap, customScrollParent, scrollContainerStateCallback]
  )

  return useSizeWithElRef(memoedCallback, enabled)
}

function getChangedChildSizes(children: HTMLCollection, itemSize: SizeFunction, field: 'offsetHeight' | 'offsetWidth', log: Log) {
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

    const index = parseInt(child.dataset.index)
    const knownSize = parseFloat(child.dataset.knownSize!)
    const size = itemSize(child, field)

    if (size === 0) {
      log('Zero-sized element, this should not happen', { child }, LogLevel.ERROR)
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

function resolveGapValue(property: string, value: string | undefined, log: Log) {
  if (value !== 'normal' && !value?.endsWith('px')) {
    log(`${property} was not resolved to pixel value correctly`, value, LogLevel.WARN)
  }
  if (value === 'normal') {
    return 0
  }
  return parseInt(value ?? '0', 10)
}
