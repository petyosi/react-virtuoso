import React from 'react'

import { ScrollContainerState, SizeFunction, SizeRange } from '../interfaces'
import { Log, LogLevel } from '../loggerSystem'
import { useSizeWithElRef } from './useSize'
export default function useChangedListContentsSizes(
  callback: (ranges: SizeRange[]) => void,
  itemSize: SizeFunction,
  enabled: boolean,
  scrollContainerStateCallback: (state: ScrollContainerState) => void,
  log: Log,
  gap: ((gap: number) => void) | undefined,
  customScrollParent: HTMLElement | undefined,
  horizontalDirection: boolean,
  skipAnimationFrame: boolean
) {
  const memoedCallback = React.useCallback(
    (el: HTMLElement) => {
      const ranges = getChangedChildSizes(el.children, itemSize, horizontalDirection ? 'offsetWidth' : 'offsetHeight', log)
      let scrollableElement = el.parentElement!

      while (!scrollableElement.dataset.virtuosoScroller) {
        scrollableElement = scrollableElement.parentElement!
      }

      // eslint-disable-next-line @typescript-eslint/no-confusing-non-null-assertion
      const windowScrolling = (scrollableElement.lastElementChild! as HTMLDivElement).dataset.viewportType! === 'window'
      let theWindow!: Window
      if (windowScrolling) {
        theWindow = scrollableElement.ownerDocument.defaultView!
      }

      const scrollTop = customScrollParent
        ? horizontalDirection
          ? customScrollParent.scrollLeft
          : customScrollParent.scrollTop
        : windowScrolling
          ? horizontalDirection
            ? theWindow.scrollX || theWindow.document.documentElement.scrollLeft
            : theWindow.scrollY || theWindow.document.documentElement.scrollTop
          : horizontalDirection
            ? scrollableElement.scrollLeft
            : scrollableElement.scrollTop

      const scrollHeight = customScrollParent
        ? horizontalDirection
          ? customScrollParent.scrollWidth
          : customScrollParent.scrollHeight
        : windowScrolling
          ? horizontalDirection
            ? theWindow.document.documentElement.scrollWidth
            : theWindow.document.documentElement.scrollHeight
          : horizontalDirection
            ? scrollableElement.scrollWidth
            : scrollableElement.scrollHeight

      const viewportHeight = customScrollParent
        ? horizontalDirection
          ? customScrollParent.offsetWidth
          : customScrollParent.offsetHeight
        : windowScrolling
          ? horizontalDirection
            ? theWindow.innerWidth
            : theWindow.innerHeight
          : horizontalDirection
            ? scrollableElement.offsetWidth
            : scrollableElement.offsetHeight

      scrollContainerStateCallback({
        scrollHeight,
        scrollTop: Math.max(scrollTop, 0),
        viewportHeight,
      })

      gap?.(
        horizontalDirection
          ? resolveGapValue('column-gap', getComputedStyle(el).columnGap, log)
          : resolveGapValue('row-gap', getComputedStyle(el).rowGap, log)
      )

      if (ranges !== null) {
        callback(ranges)
      }
    },
    [callback, itemSize, log, gap, customScrollParent, scrollContainerStateCallback, horizontalDirection]
  )

  return useSizeWithElRef(memoedCallback, enabled, skipAnimationFrame)
}

function getChangedChildSizes(children: HTMLCollection, itemSize: SizeFunction, field: 'offsetHeight' | 'offsetWidth', log: Log) {
  const length = children.length

  if (length === 0) {
    return null
  }

  const results: SizeRange[] = []

  for (let i = 0; i < length; i++) {
    const child = children.item(i) as HTMLElement

    if (child.dataset.index === undefined) {
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
      results.push({ endIndex: index, size, startIndex: index })
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
