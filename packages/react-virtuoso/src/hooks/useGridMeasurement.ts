import React from 'react'

import { LogLevel } from '../loggerSystem'
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect'

import type { GridMeasurement } from '../gridSystem'
import type { WindowViewportInfo } from '../interfaces'
import type { Log } from '../loggerSystem'

interface Options {
  customScrollParent: HTMLElement | undefined
  enabled: boolean
  log: Log
  onMeasurement: (measurement: GridMeasurement) => void
  onScrollHeight: (height: number) => void
  onWindowViewport: (info: WindowViewportInfo) => void
  skipAnimationFrame: boolean
  useWindowScroll: boolean
}

// The viewport and list must be read in the same pass: CSS can change the
// column count before either element's ResizeObserver notification arrives.
export default function useGridMeasurement({
  customScrollParent,
  enabled,
  log,
  onMeasurement,
  onScrollHeight,
  onWindowViewport,
  skipAnimationFrame,
  useWindowScroll,
}: Options) {
  const [viewport, viewportRef] = React.useState<HTMLElement | null>(null)
  const [list, listRef] = React.useState<HTMLElement | null>(null)
  const item = React.useRef({ height: 0, width: 0 })
  const observerRef = React.useRef<ResizeObserver | undefined>(undefined)
  const observedItem = React.useRef<Element | null>(null)
  const observeItem = React.useCallback(() => {
    if (!observerRef.current) {
      return
    }
    const firstItem = list?.firstElementChild ?? null
    if (observedItem.current !== firstItem) {
      if (observedItem.current) {
        observerRef.current?.unobserve(observedItem.current)
      }
      observedItem.current = firstItem
      if (firstItem) {
        observerRef.current?.observe(firstItem)
      }
    }
  }, [list])

  useIsomorphicLayoutEffect(() => {
    if (!viewport) {
      return
    }
    const ownerWindow = viewport.ownerDocument.defaultView!
    const windowScrolling = useWindowScroll || customScrollParent !== undefined
    let frame: number | undefined
    let disposed = false

    const measure = () => {
      if (disposed || viewport.offsetParent === null) {
        return
      }
      const rect = viewport.getBoundingClientRect()
      let windowInfo: WindowViewportInfo | undefined
      if (windowScrolling) {
        const parentRect = customScrollParent?.getBoundingClientRect()
        const deltaTop = rect.top - (parentRect?.top ?? 0)
        windowInfo = {
          listHeight: rect.height,
          offsetTop: deltaTop + (customScrollParent?.scrollTop ?? ownerWindow.scrollY),
          visibleHeight: (parentRect?.height ?? ownerWindow.innerHeight) - Math.max(0, deltaTop),
          visibleWidth: rect.width,
        }
      }
      // Read all geometry before publishing: subscribers can update the DOM.
      if (enabled && list && list.offsetParent !== null) {
        const firstItem = list.firstElementChild
        if (firstItem) {
          const { height, width } = firstItem.getBoundingClientRect()
          item.current = { height, width }
        }
        const style = ownerWindow.getComputedStyle(list)
        const measurement = {
          viewport: { height: windowInfo?.visibleHeight ?? rect.height, width: rect.width },
          item: item.current,
          gap: {
            column: resolveGapValue('column-gap', style.columnGap, log),
            row: resolveGapValue('row-gap', style.rowGap, log),
          },
        }
        const scrollHeight = viewport.parentElement!.scrollHeight
        onMeasurement(measurement)
        onScrollHeight(scrollHeight)
      }
      if (windowInfo) {
        onWindowViewport(windowInfo)
      }
    }

    const scheduleMeasurement = () => {
      if (skipAnimationFrame) {
        measure()
      } else if (frame === undefined) {
        frame = ownerWindow.requestAnimationFrame(() => {
          frame = undefined
          measure()
        })
      }
    }

    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(scheduleMeasurement)
    observerRef.current = observer
    observeItem()
    observer?.observe(viewport)
    if (list) {
      observer?.observe(list)
    }
    if (customScrollParent) {
      observer?.observe(customScrollParent)
    }
    ownerWindow.addEventListener('resize', scheduleMeasurement)
    const scrollTarget = customScrollParent ?? ownerWindow
    if (windowScrolling) {
      scrollTarget.addEventListener('scroll', measure)
    }
    return () => {
      disposed = true
      observer?.disconnect()
      observerRef.current = undefined
      observedItem.current = null
      if (frame !== undefined) {
        ownerWindow.cancelAnimationFrame(frame)
      }
      ownerWindow.removeEventListener('resize', scheduleMeasurement)
      scrollTarget.removeEventListener('scroll', measure)
    }
  }, [
    viewport,
    list,
    customScrollParent,
    enabled,
    log,
    onMeasurement,
    onScrollHeight,
    onWindowViewport,
    observeItem,
    skipAnimationFrame,
    useWindowScroll,
  ])

  return { listRef, viewportRef, observeItem }
}

function resolveGapValue(property: string, value: string | undefined, log: Log) {
  if (value !== 'normal' && value?.endsWith('px') !== true) {
    log(`${property} was not resolved to pixel value correctly`, value, LogLevel.WARN)
  }
  if (value === 'normal') {
    return 0
  }
  return parseInt(value ?? '0', 10)
}
