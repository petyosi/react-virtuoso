import React from 'react'

import {
  GroupedTableVirtuosoHandle,
  GroupedTableVirtuosoProps,
  TableVirtuosoHandle,
  TableVirtuosoProps,
} from './component-interfaces/TableVirtuoso'
import useChangedListContentsSizes from './hooks/useChangedChildSizes'
import useSize from './hooks/useSize'
import useWindowViewportRectRef from './hooks/useWindowViewportRect'
import {
  ComputeItemKey,
  FixedFooterContent,
  FixedHeaderContent,
  GroupContent,
  GroupItemContent,
  ItemContent,
  TableComponents,
  TableRootProps,
} from './interfaces'
import { listSystem } from './listSystem'
import { systemToComponent } from './react-urx'
import * as u from './urx'
import { VirtuosoMockContext } from './utils/context'
import { correctItemSize } from './utils/correctItemSize'
import {
  buildScroller,
  buildWindowScroller,
  contextPropIfNotDomElement,
  identity,
  itemPropIfNotDomElement,
  viewportStyle,
} from './Virtuoso'
import { positionStickyCssValue } from './utils/positionStickyCssValue'

const tableComponentPropsSystem = /*#__PURE__*/ u.system(() => {
  const itemContent = u.statefulStream<ItemContent<any, unknown>>((index: number) => <td>Item ${index}</td>)
  const context = u.statefulStream<unknown>(null)
  const groupContent = u.statefulStream<GroupContent<unknown>>((index: number) => <td colSpan={1000}>Group {index}</td>)
  const fixedHeaderContent = u.statefulStream<FixedHeaderContent>(null)
  const fixedFooterContent = u.statefulStream<FixedFooterContent>(null)
  const components = u.statefulStream<TableComponents>({})
  const computeItemKey = u.statefulStream<ComputeItemKey<any, unknown>>(identity)
  const scrollerRef = u.statefulStream<(ref: HTMLElement | null | Window) => void>(u.noop)

  const distinctProp = <K extends keyof TableComponents>(
    propName: K,
    defaultValue: 'div' | 'table' | 'tbody' | 'tfoot' | 'thead' | 'tr' | null | TableComponents[K] = null
  ) => {
    return u.statefulStreamFromEmitter(
      u.pipe(
        components,
        u.map((components) => components[propName]),
        u.distinctUntilChanged()
      ),
      defaultValue
    )
  }

  return {
    components,
    computeItemKey,
    context,
    EmptyPlaceholder: distinctProp('EmptyPlaceholder'),
    FillerRow: distinctProp('FillerRow'),
    fixedFooterContent,
    fixedHeaderContent,
    itemContent,
    groupContent,
    ScrollerComponent: distinctProp('Scroller', 'div'),
    scrollerRef,
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder'),
    TableBodyComponent: distinctProp('TableBody', 'tbody'),
    TableComponent: distinctProp('Table', 'table'),
    TableFooterComponent: distinctProp('TableFoot', 'tfoot'),
    TableHeadComponent: distinctProp('TableHead', 'thead'),
    TableRowComponent: distinctProp('TableRow', 'tr'),
    GroupComponent: distinctProp('Group', 'tr'),
  }
})

const combinedSystem = /*#__PURE__*/ u.system(
  ([listSystem, propsSystem]) => {
    return { ...listSystem, ...propsSystem }
  },
  u.tup(listSystem, tableComponentPropsSystem)
)

const DefaultScrollSeekPlaceholder = ({ height }: { height: number }) => (
  <tr>
    <td style={{ height }}></td>
  </tr>
)

const DefaultFillerRow = ({ height }: { height: number }) => (
  <tr>
    <td style={{ border: 0, height: height, padding: 0 }}></td>
  </tr>
)

const ITEM_STYLE = { overflowAnchor: 'none' } as const
const STICKY_ITEM_STYLE = { position: positionStickyCssValue(), zIndex: 2, overflowAnchor: 'none' } as const

const Items = /*#__PURE__*/ React.memo(function VirtuosoItems({ showTopList = false }: { showTopList?: boolean }) {
  const listState = useEmitterValue('listState')
  const computeItemKey = useEmitterValue('computeItemKey')
  const firstItemIndex = useEmitterValue('firstItemIndex')
  const context = useEmitterValue('context')
  const isSeeking = useEmitterValue('isSeeking')
  const fixedHeaderHeight = useEmitterValue('fixedHeaderHeight')
  const hasGroups = useEmitterValue('groupIndices').length > 0

  const itemContent = useEmitterValue('itemContent')
  const groupContent = useEmitterValue('groupContent')

  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder') || DefaultScrollSeekPlaceholder
  const GroupComponent = useEmitterValue('GroupComponent')!
  const TableRowComponent = useEmitterValue('TableRowComponent')!

  const topItemOffsets = (showTopList ? listState.topItems : []).reduce<number[]>((acc, item, index) => {
    if (index === 0) {
      acc.push(item.size)
    } else {
      acc.push(acc[index - 1] + item.size)
    }
    return acc
  }, [])

  const items = (showTopList ? listState.topItems : listState.items).map((item) => {
    const index = item.originalIndex!
    const key = computeItemKey(index + firstItemIndex, item.data, context)
    const offsetTop = showTopList ? (index === 0 ? 0 : topItemOffsets[index - 1]) : 0

    if (isSeeking) {
      return (
        <ScrollSeekPlaceholder
          {...contextPropIfNotDomElement(ScrollSeekPlaceholder, context)}
          height={item.size}
          index={item.index}
          key={key}
          type={item.type || 'item'}
        />
      )
    }
    if (item.type === 'group') {
      return (
        <GroupComponent
          {...contextPropIfNotDomElement(GroupComponent, context)}
          data-index={index}
          data-item-index={item.index}
          data-known-size={item.size}
          key={key}
          style={{
            ...STICKY_ITEM_STYLE,
            top: fixedHeaderHeight,
          }}
        >
          {groupContent(item.index, context)}
        </GroupComponent>
      )
    }
    return (
      <TableRowComponent
        {...contextPropIfNotDomElement(TableRowComponent, context)}
        {...itemPropIfNotDomElement(TableRowComponent, item.data)}
        data-index={index}
        data-item-index={item.index}
        data-known-size={item.size}
        data-item-group-index={item.groupIndex}
        key={key}
        style={showTopList ? { ...STICKY_ITEM_STYLE, top: fixedHeaderHeight + offsetTop } : ITEM_STYLE}
      >
        {hasGroups
          ? (itemContent as GroupItemContent<any, any>)(item.index, item.groupIndex!, item.data, context)
          : (itemContent as ItemContent<any, any>)(item.index, item.data, context)}
      </TableRowComponent>
    )
  })

  return <>{items}</>
})

const TableBody = /*#__PURE__*/ React.memo(function TableVirtuosoBody() {
  const listState = useEmitterValue('listState')
  const showTopList = useEmitterValue('topItemsIndexes').length > 0
  const sizeRanges = usePublisher('sizeRanges')
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const customScrollParent = useEmitterValue('customScrollParent')
  const windowScrollContainerStateCallback = usePublisher('windowScrollContainerState')
  const _scrollContainerStateCallback = usePublisher('scrollContainerState')
  const scrollContainerStateCallback =
    customScrollParent || useWindowScroll ? windowScrollContainerStateCallback : _scrollContainerStateCallback
  const trackItemSizes = useEmitterValue('trackItemSizes')
  const itemSize = useEmitterValue('itemSize')
  const log = useEmitterValue('log')

  const { callbackRef, ref } = useChangedListContentsSizes(
    sizeRanges,
    itemSize,
    trackItemSizes,
    scrollContainerStateCallback,
    log,
    undefined,
    customScrollParent,
    false,
    useEmitterValue('skipAnimationFrameInResizeObserver')
  )

  const [deviation, setDeviation] = React.useState(0)
  useEmitter('deviation', (value) => {
    if (deviation !== value) {
      ref.current!.style.marginTop = `${value}px`
      setDeviation(value)
    }
  })
  const EmptyPlaceholder = useEmitterValue('EmptyPlaceholder')
  const FillerRow = useEmitterValue('FillerRow') || DefaultFillerRow
  const TableBodyComponent = useEmitterValue('TableBodyComponent')!
  const paddingTopAddition = useEmitterValue('paddingTopAddition')
  const statefulTotalCount = useEmitterValue('statefulTotalCount')
  const context = useEmitterValue('context')

  if (statefulTotalCount === 0 && EmptyPlaceholder) {
    return <EmptyPlaceholder {...contextPropIfNotDomElement(EmptyPlaceholder, context)} />
  }

  const topItemsSize = (showTopList ? listState.topItems : []).reduce((acc, item) => acc + item.size, 0)

  const paddingTop = listState.offsetTop + paddingTopAddition + deviation - topItemsSize
  const paddingBottom = listState.offsetBottom

  const paddingTopEl = paddingTop > 0 ? <FillerRow context={context} height={paddingTop} key="padding-top" /> : null

  const paddingBottomEl = paddingBottom > 0 ? <FillerRow context={context} height={paddingBottom} key="padding-bottom" /> : null

  return (
    <TableBodyComponent data-testid="virtuoso-item-list" ref={callbackRef} {...contextPropIfNotDomElement(TableBodyComponent, context)}>
      {paddingTopEl}
      {showTopList && <Items showTopList={true} />}
      <Items />
      {paddingBottomEl}
    </TableBodyComponent>
  )
})

const Viewport: React.FC<React.PropsWithChildren> = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext)
  const viewportHeight = usePublisher('viewportHeight')
  const fixedItemHeight = usePublisher('fixedItemHeight')
  const viewportRef = useSize(
    React.useMemo(() => u.compose(viewportHeight, (el) => correctItemSize(el, 'height')), [viewportHeight]),
    true,
    useEmitterValue('skipAnimationFrameInResizeObserver')
  )

  React.useEffect(() => {
    if (ctx) {
      viewportHeight(ctx.viewportHeight)
      fixedItemHeight(ctx.itemHeight)
    }
  }, [ctx, viewportHeight, fixedItemHeight])

  return (
    <div data-viewport-type="element" ref={viewportRef} style={viewportStyle(false)}>
      {children}
    </div>
  )
}

const WindowViewport: React.FC<React.PropsWithChildren> = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext)
  const windowViewportRect = usePublisher('windowViewportRect')
  const fixedItemHeight = usePublisher('fixedItemHeight')
  const customScrollParent = useEmitterValue('customScrollParent')
  const viewportRef = useWindowViewportRectRef(
    windowViewportRect,
    customScrollParent,
    useEmitterValue('skipAnimationFrameInResizeObserver')
  )

  React.useEffect(() => {
    if (ctx) {
      fixedItemHeight(ctx.itemHeight)
      windowViewportRect({ offsetTop: 0, visibleHeight: ctx.viewportHeight, visibleWidth: 100 })
    }
  }, [ctx, windowViewportRect, fixedItemHeight])

  return (
    <div data-viewport-type="window" ref={viewportRef} style={viewportStyle(false)}>
      {children}
    </div>
  )
}

const TableRoot: React.FC<TableRootProps> = /*#__PURE__*/ React.memo(function TableVirtuosoRoot(props) {
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const customScrollParent = useEmitterValue('customScrollParent')
  const fixedHeaderHeight = usePublisher('fixedHeaderHeight')
  const fixedFooterHeight = usePublisher('fixedFooterHeight')
  const fixedHeaderContent = useEmitterValue('fixedHeaderContent')
  const fixedFooterContent = useEmitterValue('fixedFooterContent')
  const context = useEmitterValue('context')
  const theadRef = useSize(
    React.useMemo(() => u.compose(fixedHeaderHeight, (el) => correctItemSize(el, 'height')), [fixedHeaderHeight]),
    true,
    useEmitterValue('skipAnimationFrameInResizeObserver')
  )
  const tfootRef = useSize(
    React.useMemo(() => u.compose(fixedFooterHeight, (el) => correctItemSize(el, 'height')), [fixedFooterHeight]),
    true,
    useEmitterValue('skipAnimationFrameInResizeObserver')
  )
  const TheScroller = customScrollParent || useWindowScroll ? WindowScroller : Scroller
  const TheViewport = customScrollParent || useWindowScroll ? WindowViewport : Viewport
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
  const TheTable = useEmitterValue('TableComponent') as any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
  const TheTHead = useEmitterValue('TableHeadComponent') as any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
  const TheTFoot = useEmitterValue('TableFooterComponent') as any

  const theHead = fixedHeaderContent ? (
    <TheTHead
      key="TableHead"
      ref={theadRef}
      style={{ position: 'sticky', top: 0, zIndex: 2 }}
      {...contextPropIfNotDomElement(TheTHead, context)}
    >
      {fixedHeaderContent()}
    </TheTHead>
  ) : null
  const theFoot = fixedFooterContent ? (
    <TheTFoot
      key="TableFoot"
      ref={tfootRef}
      style={{ bottom: 0, position: 'sticky', zIndex: 1 }}
      {...contextPropIfNotDomElement(TheTFoot, context)}
    >
      {fixedFooterContent()}
    </TheTFoot>
  ) : null

  return (
    <TheScroller {...props} {...contextPropIfNotDomElement(TheScroller, context)}>
      <TheViewport>
        <TheTable style={{ borderSpacing: 0, overflowAnchor: 'none' }} {...contextPropIfNotDomElement(TheTable, context)}>
          {theHead}
          <TableBody key="TableBody" />
          {theFoot}
        </TheTable>
      </TheViewport>
    </TheScroller>
  )
})

const {
  Component: Table,
  useEmitter,
  useEmitterValue,
  usePublisher,
} = /*#__PURE__*/ systemToComponent(
  combinedSystem,
  {
    required: {},
    optional: {
      restoreStateFrom: 'restoreStateFrom',
      context: 'context',
      followOutput: 'followOutput',
      firstItemIndex: 'firstItemIndex',
      itemContent: 'itemContent',
      groupContent: 'groupContent',
      fixedHeaderContent: 'fixedHeaderContent',
      fixedFooterContent: 'fixedFooterContent',
      overscan: 'overscan',
      increaseViewportBy: 'increaseViewportBy',
      minOverscanItemCount: 'minOverscanItemCount',
      totalCount: 'totalCount',
      topItemCount: 'topItemCount',
      initialTopMostItemIndex: 'initialTopMostItemIndex',
      components: 'components',
      groupCounts: 'groupCounts',
      atBottomThreshold: 'atBottomThreshold',
      atTopThreshold: 'atTopThreshold',
      computeItemKey: 'computeItemKey',
      defaultItemHeight: 'defaultItemHeight',
      fixedGroupHeight: 'fixedGroupHeight', // Must be set above 'fixedItemHeight'
      fixedItemHeight: 'fixedItemHeight',
      itemSize: 'itemSize',
      scrollSeekConfiguration: 'scrollSeekConfiguration',
      data: 'data',
      initialItemCount: 'initialItemCount',
      initialScrollTop: 'initialScrollTop',
      alignToBottom: 'alignToBottom',
      useWindowScroll: 'useWindowScroll',
      customScrollParent: 'customScrollParent',
      scrollerRef: 'scrollerRef',
      logLevel: 'logLevel',
    },
    methods: {
      scrollToIndex: 'scrollToIndex',
      scrollIntoView: 'scrollIntoView',
      scrollTo: 'scrollTo',
      scrollBy: 'scrollBy',
      getState: 'getState',
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

const Scroller = /*#__PURE__*/ buildScroller({ useEmitter, useEmitterValue, usePublisher })
const WindowScroller = /*#__PURE__*/ buildWindowScroller({ useEmitter, useEmitterValue, usePublisher })

/**
 * A virtualized table component for efficiently rendering large tabular datasets.
 * Renders semantic HTML table markup with support for fixed headers and footers.
 *
 * @typeParam ItemData - The type of data items in the table
 * @typeParam Context - The type of additional context passed to callbacks
 *
 * @param props - {@link TableVirtuosoProps}
 *
 * @function
 * @group TableVirtuoso
 *
 * @example
 * ```tsx
 * <TableVirtuoso
 *   totalCount={1000}
 *   fixedHeaderContent={() => (
 *     <tr>
 *       <th>Name</th>
 *       <th>Description</th>
 *     </tr>
 *   )}
 *   itemContent={(index) => (
 *     <>
 *       <td>Item {index}</td>
 *       <td>Description {index}</td>
 *     </>
 *   )}
 * />
 * ```
 *
 * @see {@link TableVirtuosoProps} for available props
 * @see {@link TableVirtuosoHandle} for imperative methods
 * @see {@link TableComponents} for customizing table elements
 */
export const TableVirtuoso = Table as <ItemData = any, Context = any>(
  props: TableVirtuosoProps<ItemData, Context> & { ref?: React.Ref<TableVirtuosoHandle> }
) => React.ReactElement

/**
 * A virtualized table component for rendering grouped tabular data with sticky group headers.
 * Combines TableVirtuoso functionality with group support for hierarchical data.
 *
 * @typeParam ItemData - The type of data items in the table
 * @typeParam Context - The type of additional context passed to callbacks
 *
 * @param props - {@link GroupedTableVirtuosoProps}
 *
 * @function
 * @group GroupedTableVirtuoso
 *
 * @example
 * ```tsx
 * <GroupedTableVirtuoso
 *   groupCounts={[10, 20, 15]}
 *   groupContent={(index) => (
 *     <td colSpan={2}>Group {index}</td>
 *   )}
 *   itemContent={(index, groupIndex) => (
 *     <>
 *       <td>Item {index}</td>
 *       <td>Group {groupIndex}</td>
 *     </>
 *   )}
 * />
 * ```
 *
 * @see {@link GroupedTableVirtuosoProps} for available props
 * @see {@link GroupedTableVirtuosoHandle} for imperative methods
 */
export const GroupedTableVirtuoso = Table as <ItemData = any, Context = any>(
  props: GroupedTableVirtuosoProps<ItemData, Context> & { ref?: React.Ref<GroupedTableVirtuosoHandle> }
) => React.ReactElement
