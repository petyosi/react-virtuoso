import React from 'react'

import { useCellValue, useCellValues, useEngine } from '@virtuoso.dev/reactive-engine-react'

import { emptyPlaceholder$, loadingFooter$, loadingOverlay$, loadingPlaceholder$ } from '../core/components'
import { computeRowKey$ } from '../core/content'
import { context$, data$, groupIndices$ } from '../core/data'
import { loadingState$ } from '../core/loading'
import { presentation$ } from '../core/presentation'
import { ScrollbarOverlay } from '../layout/ScrollbarOverlay'
import { CustomScrollParentWrapper, ScrollableElement, WindowScrollElementWrapper } from '../layout/scroller-elements'
import { TableLayoutRoot } from '../layout/TableLayoutRoot'
import { VirtualizedTableContent } from '../layout/VirtualizedTableContent'
import { useResizeObserver } from '../resize/resize-observer-singleton'
import { FOOTER_ROLE, STICKY_HEADER_ROLE } from '../resize/resize-observing'
import {
  customScrollParent$,
  increaseViewportBy$,
  scrollTop$,
  visibleListHeight$,
  useWindowScroll$,
  scrollTo$,
  scrollTargetReached$,
  tableBodyForceBottomSpace$,
  scrollHeight$,
  scrollerElement$,
  minScrollTop$,
  cancelSmoothScroll$,
  viewportHeight$,
  externalScrollerViewportHeight$,
  stickyHeaderHeight$,
} from '../scroll/dom'
import { normalizeRowLocation } from '../scroll/scroll-to-row'
import { initialLocation$, pendingScrollToInitialLocation$, scrollIntoView$, scrollToRow$ } from '../scroll/state'
import { cardGeometry, cardWindow } from './geometry'
import { cardMeasurement$, cardRenderedData$, cardViewportRange$ } from './state'

import type { CardComponentProps, ContextAwareComponent, RowLocation, ScrollerProps } from '../interfaces'
import type { ScrollToParams } from '../scroll/dom'

const HEADER_STYLE: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 2 }
const OVERLAY_STYLE: React.CSSProperties = { position: 'absolute', top: 'var(--header-height)', left: 0, right: 0, pointerEvents: 'none' }

interface Props {
  scrollerProps: ScrollerProps
  Card?: React.ComponentType<CardComponentProps> | undefined
  CardHeader?: ContextAwareComponent<unknown> | undefined
  listClassName?: string | undefined
  itemClassName?: string | undefined
}

export function CardPresentation(props: Props) {
  const mode = useCellValue(presentation$)
  return mode === 'table' ? <VirtualizedTableContent {...props.scrollerProps} /> : <VirtualizedCards {...props} />
}

function VirtualizedCards({ scrollerProps: { style, ...htmlProps }, Card, CardHeader, listClassName, itemClassName }: Props) {
  const engine = useEngine()
  const [data, groups, context, computeKey, measurement, top, height, overscan, customParent, windowScroll, loading, forceBottom] =
    useCellValues(
      data$,
      groupIndices$,
      context$,
      computeRowKey$,
      cardMeasurement$,
      scrollTop$,
      visibleListHeight$,
      increaseViewportBy$,
      customScrollParent$,
      useWindowScroll$,
      loadingState$,
      tableBodyForceBottomSpace$
    )
  const [Empty, Loading, Overlay, Footer] = useCellValues(emptyPlaceholder$, loadingPlaceholder$, loadingOverlay$, loadingFooter$)
  const [viewportHeight, externalViewportHeight, headerHeight] = useCellValues(
    viewportHeight$,
    externalScrollerViewportHeight$,
    stickyHeaderHeight$
  )
  const commandViewport = Math.max(0, (customParent || windowScroll ? externalViewportHeight : viewportHeight) - headerHeight)
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const headerRef = useResizeObserver()
  const footerRef = useResizeObserver()
  const bodyObserverRef = useResizeObserver()
  const pending = React.useRef<RowLocation | null>(engine.getValue(initialLocation$))
  const doneRef = React.useRef<(() => void) | undefined>(undefined)
  const [scrollRequest, setScrollRequest] = React.useState<ScrollToParams | null>(null)
  const count = data?.length ?? 0
  const error = Card ? (groups.length ? 'Card mode requires ungrouped model data.' : null) : 'Card mode requires components.Card.'
  const geometry = cardGeometry(measurement, count)
  const window = cardWindow(measurement, error ? 0 : count, top, height, overscan)
  const visible = data?.slice(window.start, window.end) ?? []
  const listStyle = React.useMemo<React.CSSProperties>(
    () => ({
      boxSizing: 'content-box',
      overflowAnchor: 'none',
      paddingTop: window.paddingTop,
      paddingBottom: window.paddingBottom + forceBottom,
    }),
    [window.paddingTop, window.paddingBottom, forceBottom]
  )

  const measure = React.useCallback(() => {
    const list = listRef.current
    if (!list?.isConnected || engine.getValue(presentation$) !== 'card') {
      return
    }
    const first = list.firstElementChild
    const rect = first?.getBoundingClientRect()
    const css = getComputedStyle(list)
    const next = {
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
      containerWidth: list.getBoundingClientRect().width,
      columnGap: Number.parseFloat(css.columnGap) || 0,
      rowGap: Number.parseFloat(css.rowGap) || 0,
      // Resolved grid tracks avoid inferring column counts from individually rounded track widths.
      gridColumns:
        css.display === 'grid' || css.display === 'inline-grid'
          ? css.gridTemplateColumns
              .replace(/\[[^\]]*\]/g, '')
              .split(/\s+/)
              .filter((track) => track.endsWith('px')).length
          : 0,
    }
    const current = engine.getValue(cardMeasurement$)
    if (Object.keys(next).some((key) => next[key as keyof typeof next] !== current[key as keyof typeof next])) {
      engine.pub(cardMeasurement$, next)
    }
    const scroller = engine.getValue(scrollerElement$)
    if (scroller && !engine.getValue(useWindowScroll$) && !engine.getValue(customScrollParent$)) {
      engine.pub(scrollHeight$, scroller.scrollHeight)
    }
  }, [engine])

  React.useLayoutEffect(measure)
  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) {
      return
    }
    let active = true
    const observer = new ResizeObserver(() => {
      if (active) {
        measure()
      }
    })
    observer.observe(list)
    if (list.firstElementChild) {
      observer.observe(list.firstElementChild)
    }
    return () => {
      active = false
      observer.disconnect()
    }
  }, [measure, window.start, count, error, data])

  React.useLayoutEffect(() => {
    engine.pub(
      cardViewportRange$,
      geometry.ready && height > 0 && !error && window.end > window.start ? { startIndex: window.start, endIndex: window.end - 1 } : null
    )
    engine.pub(cardRenderedData$, geometry.ready && height > 0 && !error ? (data?.slice(window.start, window.end) ?? []) : [])
  }, [engine, geometry.ready, height, error, data, window.start, window.end])

  React.useLayoutEffect(() => {
    const scroll = (location: RowLocation, onlyIfOutside = false) => {
      const current = cardGeometry(engine.getValue(cardMeasurement$), engine.getValue(data$)?.length ?? 0)
      if (!geometry.ready || commandViewport <= 0 || !current.ready || error || count === 0) {
        pending.current = location
        return
      }
      const normalized = normalizeRowLocation(location, count - 1)
      const itemTop = Math.floor(normalized.index / current.columns) * current.stride
      const viewport = commandViewport
      const currentTop = engine.getValue(scrollTop$)
      const currentlyVisibleHeight = engine.getValue(visibleListHeight$)
      if (
        onlyIfOutside &&
        currentlyVisibleHeight > 0 &&
        itemTop >= currentTop &&
        itemTop + current.height <= currentTop + currentlyVisibleHeight
      ) {
        if (typeof location !== 'number') {
          location.done?.()
        }
        return
      }
      let align = normalized.align
      if (onlyIfOutside && (typeof location === 'number' || location.align === undefined)) {
        align = itemTop < currentTop ? 'start-no-overflow' : 'end'
      }
      const target =
        itemTop +
        normalized.offset -
        (align === 'end' ? viewport - current.height : align === 'center' ? (viewport - current.height) / 2 : 0)
      doneRef.current = typeof location === 'number' ? undefined : location.done
      pending.current = null
      engine.pub(pendingScrollToInitialLocation$, null)
      engine.pub(cancelSmoothScroll$)
      // Commit any extra end space before the scroller clamps the target.
      engine.pub(minScrollTop$, align === 'start' ? Math.max(0, target) : 0)
      setScrollRequest({
        top: Math.max(0, target),
        ...(align === 'start-no-overflow' ? {} : { align }),
        behavior: normalized.behavior,
      })
    }
    const unsub = engine.sub(scrollToRow$, (location) => scroll(location))
    const unsubInto = engine.sub(scrollIntoView$, (location) => scroll(location, true))
    const unsubDone = engine.sub(scrollTargetReached$, () => {
      const done = doneRef.current
      doneRef.current = undefined
      done?.()
    })
    if (pending.current !== null) {
      scroll(pending.current)
    }
    return () => {
      unsub()
      unsubInto()
      unsubDone()
    }
  }, [engine, count, geometry.ready, commandViewport, error])

  React.useLayoutEffect(() => {
    if (scrollRequest) {
      engine.pub(scrollTo$, scrollRequest)
    }
  }, [engine, scrollRequest])

  const listCallback = React.useCallback(
    (element: HTMLDivElement | null) => {
      listRef.current = element
      bodyObserverRef(element)
    },
    [bodyObserverRef]
  )
  const ScrollRoot = customParent ? CustomScrollParentWrapper : windowScroll ? WindowScrollElementWrapper : ScrollableElement
  const external = Boolean(customParent) || windowScroll
  return (
    <TableLayoutRoot ready={geometry.ready && !error} style={style} {...(external ? htmlProps : {})}>
      <ScrollRoot tableBodyRef={listRef} {...(external ? {} : htmlProps)}>
        <div ref={headerRef} data-table-element-role={STICKY_HEADER_ROLE} style={HEADER_STYLE}>
          {CardHeader && <CardHeader context={context} />}
        </div>
        {error ? (
          <div role="alert">{error}</div>
        ) : (
          <>
            {Loading && loading.initial.status !== 'idle' && <Loading context={context} loadingState={loading} />}
            {count === 0 && loading.initial.status === 'idle' && Empty && <Empty context={context} />}
            <div
              ref={listCallback}
              className={listClassName}
              data-table-element-role="card-list"
              aria-busy={loading.refresh.status === 'loading' || undefined}
              style={listStyle}
            >
              {Card &&
                visible.map((item, offset) => {
                  const index = window.start + offset
                  return (
                    <div
                      key={computeKey({ data: item, index, context })}
                      data-table-element-role="card"
                      data-index={index}
                      className={itemClassName}
                    >
                      <Card data={item} index={index} context={context} />
                    </div>
                  )
                })}
            </div>
            <div ref={footerRef} data-table-element-role={FOOTER_ROLE}>
              {Footer && loading.end.status !== 'idle' && <Footer context={context} loadingState={loading} />}
            </div>
          </>
        )}
      </ScrollRoot>
      {Overlay && loading.refresh.status !== 'idle' && (
        <div style={OVERLAY_STYLE}>
          <Overlay context={context} loadingState={loading} />
        </div>
      )}
      {!external && <ScrollbarOverlay />}
    </TableLayoutRoot>
  )
}
