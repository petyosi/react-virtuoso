import { useCallback, useRef } from 'react'

import { e, map, Resource, Stream } from '@virtuoso.dev/reactive-engine-core'
import { useCellValue } from '@virtuoso.dev/reactive-engine-react'

const rootResizeObserverSignal$ = Stream<ResizeObserverEntry[]>()

export const resizeObserverSingleton$ = Resource((engine) => {
  if (typeof ResizeObserver === 'undefined') {
    return null
  }
  return new ResizeObserver((entries) => {
    engine.pub(rootResizeObserverSignal$, entries)
  })
})

export function createResizeObserverSignal(filterFn: (entry: ResizeObserverEntry) => boolean) {
  const signal$ = Stream<ResizeObserverEntry[]>()
  e.link(
    e.pipe(
      rootResizeObserverSignal$,
      map((entries) => {
        return entries.filter(filterFn)
      })
    ),
    signal$
  )
  return signal$
}

export function useResizeObserver(box: ResizeObserverBoxOptions = 'border-box') {
  const observer = useCellValue(resizeObserverSingleton$)
  const elRef = useRef<HTMLElement | null>(null)

  return useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        elRef.current = el
        observer?.observe(el, { box })
      } else if (elRef.current) {
        observer?.unobserve(elRef.current)
        elRef.current = null
      }
    },
    [observer, box]
  )
}
