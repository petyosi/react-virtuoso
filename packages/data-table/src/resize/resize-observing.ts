import { e } from '@virtuoso.dev/reactive-engine-core'

import { columnEntries$ } from '../columns/Column'
import {
  customScrollParent$,
  customScrollParentWrapper$,
  externalScrollerScrollTop$,
  externalScrollerViewportHeight$,
  offsetTopInExternalScroller$,
  scrollableFooterHeight$,
  scrollableHeaderHeight$,
  scrollerElement$,
  scrollHeight$,
  scrollTop$,
  scrollWidth$,
  stickyFooterHeight$,
  stickyHeaderHeight$,
  viewportHeight$,
  viewportWidth$,
} from '../scroll/dom'
import { createResizeObserverSignal } from './resize-observer-singleton'
import { ranges$ } from './sizes'

import type { SizeRange } from '../interfaces'

export const HEADER_ROLE = 'header'
export const STICKY_HEADER_ROLE = 'sticky-header'
export const FOOTER_ROLE = 'footer'
export const STICKY_FOOTER_ROLE = 'sticky-footer'
export const TABLE_BODY_ROLE = 'table-body'
export const WINDOW_SCROLL_WRAPPER_ROLE = 'window-scroll-wrapper'
export const ROW_ROLE = 'row'

export const dataTableStructureEntries$ = createResizeObserverSignal(() => true)

e.singletonSub(dataTableStructureEntries$, (entries) => {
  const { length } = entries

  const results: SizeRange[] = []
  const columnEntries: ResizeObserverEntry[] = []

  const scrollerElement = e.getValue(scrollerElement$)
  const customScrollParent = e.getValue(customScrollParent$)
  const customScrollParentWrapper = e.getValue(customScrollParentWrapper$)

  let pubPayload: Record<symbol, unknown> = {
    [scrollHeight$]: scrollerElement?.scrollHeight,
    [scrollWidth$]: scrollerElement?.scrollWidth,
  }

  for (let i = 0; i < length; i++) {
    const entry = entries[i]!
    const element = entry.target as HTMLDivElement
    const elementRole = element.dataset.tableElementRole

    if (elementRole === HEADER_ROLE) {
      pubPayload = {
        ...pubPayload,
        [scrollableHeaderHeight$]: entry.contentRect.height,
      }
      continue
    }
    if (elementRole === STICKY_HEADER_ROLE) {
      pubPayload = {
        ...pubPayload,
        [stickyHeaderHeight$]: entry.contentRect.height,
      }
      continue
    }
    if (elementRole === FOOTER_ROLE) {
      pubPayload = {
        ...pubPayload,
        [scrollableFooterHeight$]: entry.contentRect.height,
      }
      continue
    }
    if (elementRole === STICKY_FOOTER_ROLE) {
      pubPayload = {
        ...pubPayload,
        [stickyFooterHeight$]: entry.contentRect.height,
      }
      continue
    }
    if (element === scrollerElement) {
      pubPayload = {
        ...pubPayload,
        [scrollTop$]: element.scrollTop,
        [scrollHeight$]: element.scrollHeight,
        [scrollWidth$]: element.scrollWidth,
        [viewportHeight$]: entry.contentRect.height,
        [viewportWidth$]: element.clientWidth,
      }
      continue
    }

    if (elementRole === WINDOW_SCROLL_WRAPPER_ROLE) {
      const theElementWindow = element.ownerDocument.defaultView
      if (theElementWindow !== null) {
        pubPayload = {
          ...pubPayload,
          [scrollHeight$]: entry.contentRect.height,
          [externalScrollerScrollTop$]: theElementWindow.scrollY,
          [externalScrollerViewportHeight$]: theElementWindow.innerHeight,
          [offsetTopInExternalScroller$]: element.getBoundingClientRect().top + theElementWindow.scrollY,
          [viewportWidth$]: element.clientWidth,
        }
      }
      continue
    }

    if (element === customScrollParent) {
      const parent = customScrollParent
      const wrapper = customScrollParentWrapper
      if (parent && wrapper) {
        pubPayload = {
          ...pubPayload,
          [scrollHeight$]: wrapper.getBoundingClientRect().height,
          [externalScrollerScrollTop$]: parent.scrollTop,
          [externalScrollerViewportHeight$]: parent.clientHeight,
          [offsetTopInExternalScroller$]: wrapper.offsetTop,
          [viewportWidth$]: wrapper.clientWidth,
        }
      }
      continue
    }

    if (element.dataset.columnKey !== undefined) {
      columnEntries.push(entry)
    }

    if (elementRole === ROW_ROLE) {
      if (element.dataset.index === undefined) {
        continue
      }

      const index = Number.parseInt(element.dataset.index, 10)
      const knownSize = Number.parseFloat(element.dataset.knownSize ?? '')
      const size = entry.contentRect.height

      if (size === knownSize) {
        continue
      }

      const lastResult = results.at(-1)
      if (results.length === 0 || lastResult?.size !== size || lastResult.endIndex !== index - 1) {
        results.push({ endIndex: index, size: size, startIndex: index })
      } else {
        lastResult.endIndex++
      }
    }
  }

  if (columnEntries.length > 0) {
    pubPayload = {
      ...pubPayload,
      [columnEntries$]: columnEntries,
    }
  }

  if (results.length > 0) {
    pubPayload = {
      ...pubPayload,
      [ranges$]: results,
    }
  }

  e.pubIn(pubPayload)
})
