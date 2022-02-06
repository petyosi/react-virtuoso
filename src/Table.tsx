import { RefHandle, systemToComponent } from '@virtuoso.dev/react-urx'
import { map, pipe, statefulStream, system, tup, statefulStreamFromEmitter, distinctUntilChanged, noop, compose } from '@virtuoso.dev/urx'
import * as React from 'react'
import { createElement, FC } from 'react'
import useChangedListContentsSizes from './hooks/useChangedChildSizes'
import { ComputeItemKey, ItemContent, FixedHeaderContent, TableComponents, TableRootProps } from './interfaces'
import { listSystem } from './listSystem'
import { identity, buildScroller, buildWindowScroller, viewportStyle } from './List'
import useSize from './hooks/useSize'
import { correctItemSize } from './utils/correctItemSize'
import useWindowViewportRectRef from './hooks/useWindowViewportRect'

const tableComponentPropsSystem = system(() => {
  const itemContent = statefulStream<ItemContent<any>>((index: number) => <td>Item ${index}</td>)
  const fixedHeaderContent = statefulStream<FixedHeaderContent>(null)
  const components = statefulStream<TableComponents>({})
  const computeItemKey = statefulStream<ComputeItemKey<any>>(identity)
  const scrollerRef = statefulStream<(ref: HTMLElement | Window | null) => void>(noop)

  const distinctProp = <K extends keyof TableComponents>(
    propName: K,
    defaultValue: TableComponents[K] | null | 'thead' | 'table' | 'tbody' | 'tr' | 'div' = null
  ) => {
    return statefulStreamFromEmitter(
      pipe(
        components,
        map((components) => components[propName]),
        distinctUntilChanged()
      ),
      defaultValue
    )
  }

  return {
    itemContent,
    fixedHeaderContent,
    components,
    computeItemKey,
    scrollerRef,
    TableComponent: distinctProp('Table', 'table'),
    TableHeadComponent: distinctProp('TableHead', 'thead'),
    TableBodyComponent: distinctProp('TableBody', 'tbody'),
    TableRowComponent: distinctProp('TableRow', 'tr'),
    ScrollerComponent: distinctProp('Scroller', 'div'),
    EmptyPlaceholder: distinctProp('EmptyPlaceholder'),
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder'),
  }
})

const combinedSystem = system(([listSystem, propsSystem]) => {
  return { ...listSystem, ...propsSystem }
}, tup(listSystem, tableComponentPropsSystem))

const DefaultScrollSeekPlaceholder = ({ height }: { height: number }) => (
  <tr>
    <td style={{ height }}></td>
  </tr>
)

const FillerRow = ({ height }: { height: number }) => (
  <tr>
    <td style={{ height: height, padding: 0, border: 0 }}></td>
  </tr>
)

export const Items = React.memo(function VirtuosoItems() {
  const listState = useEmitterValue('listState')
  const deviation = useEmitterValue('deviation')
  const sizeRanges = usePublisher('sizeRanges')
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const windowScrollContainerStateCallback = usePublisher('windowScrollContainerState')
  const _scrollContainerStateCallback = usePublisher('scrollContainerState')
  const scrollContainerStateCallback = useWindowScroll ? windowScrollContainerStateCallback : _scrollContainerStateCallback
  const itemContent = useEmitterValue('itemContent')
  const trackItemSizes = useEmitterValue('trackItemSizes')
  const itemSize = useEmitterValue('itemSize')
  const log = useEmitterValue('log')

  const ref = useChangedListContentsSizes(sizeRanges, itemSize, trackItemSizes, scrollContainerStateCallback, log)
  const EmptyPlaceholder = useEmitterValue('EmptyPlaceholder')
  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder') || DefaultScrollSeekPlaceholder
  const TableBodyComponent = useEmitterValue('TableBodyComponent')!
  const TableRowComponent = useEmitterValue('TableRowComponent')!
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const paddingTopAddition = useEmitterValue('paddingTopAddition')
  const firstItemIndex = useEmitterValue('firstItemIndex')
  const statefulTotalCount = useEmitterValue('statefulTotalCount')

  if (statefulTotalCount === 0 && EmptyPlaceholder) {
    return createElement(EmptyPlaceholder)
  }

  const paddingTop = listState.offsetTop + paddingTopAddition + deviation
  const paddingBottom = listState.offsetBottom

  const paddingTopEl = paddingTop > 0 ? <FillerRow height={paddingTop} key="padding-top" /> : null

  const paddingBottomEl = paddingBottom > 0 ? <FillerRow height={paddingBottom} key="padding-bottom" /> : null

  const items = listState.items.map((item) => {
    const index = item.originalIndex!
    const key = computeItemKey(index + firstItemIndex, item.data)

    if (isSeeking) {
      return createElement(ScrollSeekPlaceholder, {
        key,
        index: item.index,
        height: item.size,
        type: item.type || 'item',
      })
    }
    return createElement(
      TableRowComponent,
      {
        key,
        'data-index': index,
        'data-known-size': item.size,
        'data-item-index': item.index,
        style: { overflowAnchor: 'none' },
      } as any,
      itemContent(item.index, item.data)
    )
  })

  return createElement(
    TableBodyComponent,
    { ref, 'data-test-id': 'virtuoso-item-list' },

    [paddingTopEl, ...items, paddingBottomEl]
  )
})

export interface Hooks {
  usePublisher: typeof usePublisher
  useEmitterValue: typeof useEmitterValue
  useEmitter: typeof useEmitter
}

const Viewport: FC = ({ children }) => {
  const viewportHeight = usePublisher('viewportHeight')
  const viewportRef = useSize(compose(viewportHeight, (el) => correctItemSize(el, 'height')))

  return (
    <div style={viewportStyle} ref={viewportRef} data-viewport-type="element">
      {children}
    </div>
  )
}

const WindowViewport: FC = ({ children }) => {
  const windowViewportRect = usePublisher('windowViewportRect')
  const viewportRef = useWindowViewportRectRef(windowViewportRect)

  return (
    <div ref={viewportRef} style={viewportStyle} data-viewport-type="window">
      {children}
    </div>
  )
}

const TableRoot: FC<TableRootProps> = React.memo(function TableVirtuosoRoot(props) {
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const fixedHeaderHeight = usePublisher('fixedHeaderHeight')
  const fixedHeaderContent = useEmitterValue('fixedHeaderContent')
  const theadRef = useSize(compose(fixedHeaderHeight, (el) => correctItemSize(el, 'height')))
  const TheScroller = useWindowScroll ? WindowScroller : Scroller
  const TheViewport = useWindowScroll ? WindowViewport : Viewport
  const TheTable = useEmitterValue('TableComponent')
  const TheTHead = useEmitterValue('TableHeadComponent')

  const theHead = fixedHeaderContent
    ? React.createElement(
        TheTHead!,
        { key: 'TableHead', style: { zIndex: 1, position: 'sticky', top: 0 }, ref: theadRef } as any,
        fixedHeaderContent()
      )
    : null

  return (
    <TheScroller {...props}>
      <TheViewport>
        {React.createElement(TheTable!, { style: { borderSpacing: 0 } } as any, [theHead, <Items key="TableBody" />])}
      </TheViewport>
    </TheScroller>
  )
})

export type TableHandle = RefHandle<typeof Table>

export const { Component: Table, usePublisher, useEmitterValue, useEmitter } = systemToComponent(
  combinedSystem,
  {
    required: {},
    optional: {
      followOutput: 'followOutput',
      firstItemIndex: 'firstItemIndex',
      itemContent: 'itemContent',
      fixedHeaderContent: 'fixedHeaderContent',
      overscan: 'overscan',
      increaseViewportBy: 'increaseViewportBy',
      totalCount: 'totalCount',
      topItemCount: 'topItemCount',
      initialTopMostItemIndex: 'initialTopMostItemIndex',
      components: 'components',
      groupCounts: 'groupCounts',
      atBottomThreshold: 'atBottomThreshold',
      computeItemKey: 'computeItemKey',
      defaultItemHeight: 'defaultItemHeight',
      fixedItemHeight: 'fixedItemHeight',
      itemSize: 'itemSize',
      scrollSeekConfiguration: 'scrollSeekConfiguration',
      data: 'data',
      initialItemCount: 'initialItemCount',
      initialScrollTop: 'initialScrollTop',
      alignToBottom: 'alignToBottom',
      useWindowScroll: 'useWindowScroll',
      scrollerRef: 'scrollerRef',
      logLevel: 'logLevel',
    },
    methods: {
      scrollToIndex: 'scrollToIndex',
      scrollIntoView: 'scrollIntoView',
      scrollTo: 'scrollTo',
      scrollBy: 'scrollBy',
    },
    events: {
      isScrolling: 'isScrolling',
      endReached: 'endReached',
      startReached: 'startReached',
      rangeChanged: 'rangeChanged',
      atBottomStateChange: 'atBottomStateChange',
      atTopStateChange: 'atTopStateChange',
      totalListHeightChanged: 'totalListHeightChanged',
      itemsRendered: 'itemsRendered',
      groupIndices: 'groupIndices',
    },
  },
  TableRoot
)

const Scroller = buildScroller({ usePublisher, useEmitterValue, useEmitter })
const WindowScroller = buildWindowScroller({ usePublisher, useEmitterValue, useEmitter })
