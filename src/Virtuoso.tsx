import { systemToComponent } from './react-urx'
import * as u from './urx'
import React from 'react'
import useIsomorphicLayoutEffect from './hooks/useIsomorphicLayoutEffect'
import useChangedListContentsSizes from './hooks/useChangedChildSizes'
import useScrollTop from './hooks/useScrollTop'
import useSize from './hooks/useSize'
import { Components, ComputeItemKey, GroupContent, GroupItemContent, ItemContent, ListRootProps } from './interfaces'
import { listSystem } from './listSystem'
import { positionStickyCssValue } from './utils/positionStickyCssValue'
import useWindowViewportRectRef from './hooks/useWindowViewportRect'
import { correctItemSize } from './utils/correctItemSize'
import { VirtuosoMockContext } from './utils/context'
import { ScrollerProps } from '.'
import { GroupedVirtuosoHandle, GroupedVirtuosoProps, VirtuosoHandle, VirtuosoProps } from './component-interfaces/Virtuoso'

export function identity<T>(value: T) {
  return value
}

const listComponentPropsSystem = /*#__PURE__*/ u.system(() => {
  const itemContent = u.statefulStream<ItemContent<any, any> | GroupItemContent<any, any>>((index: number) => `Item ${index}`)
  const context = u.statefulStream<unknown>(null)
  const groupContent = u.statefulStream<GroupContent<any>>((index: number) => `Group ${index}`)
  const components = u.statefulStream<Components<any>>({})
  const computeItemKey = u.statefulStream<ComputeItemKey<any, any>>(identity)
  const headerFooterTag = u.statefulStream('div')
  const scrollerRef = u.statefulStream<(ref: HTMLElement | Window | null) => void>(u.noop)

  const distinctProp = <K extends keyof Components<any>>(propName: K, defaultValue: Components<any>[K] | null | 'div' = null) => {
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
    context,
    itemContent,
    groupContent,
    components,
    computeItemKey,
    headerFooterTag,
    scrollerRef,
    FooterComponent: distinctProp('Footer'),
    HeaderComponent: distinctProp('Header'),
    TopItemListComponent: distinctProp('TopItemList'),
    ListComponent: distinctProp('List', 'div'),
    ItemComponent: distinctProp('Item', 'div'),
    GroupComponent: distinctProp('Group', 'div'),
    ScrollerComponent: distinctProp('Scroller', 'div'),
    EmptyPlaceholder: distinctProp('EmptyPlaceholder'),
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder'),
  }
})

const combinedSystem = /*#__PURE__*/ u.system(([listSystem, propsSystem]) => {
  return { ...listSystem, ...propsSystem }
}, u.tup(listSystem, listComponentPropsSystem))

const DefaultScrollSeekPlaceholder = ({ height }: { height: number }) => <div style={{ height }}></div>

const GROUP_STYLE = { position: positionStickyCssValue(), zIndex: 1, overflowAnchor: 'none' } as const
const ITEM_STYLE = { overflowAnchor: 'none' } as const
const HORIZONTAL_ITEM_STYLE = { ...ITEM_STYLE, display: 'inline-block', height: '100%' } as const

const Items = /*#__PURE__*/ React.memo(function VirtuosoItems({ showTopList = false }: { showTopList?: boolean }) {
  const listState = useEmitterValue('listState')

  const sizeRanges = usePublisher('sizeRanges')
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const customScrollParent = useEmitterValue('customScrollParent')
  const windowScrollContainerStateCallback = usePublisher('windowScrollContainerState')
  const _scrollContainerStateCallback = usePublisher('scrollContainerState')
  const scrollContainerStateCallback =
    customScrollParent || useWindowScroll ? windowScrollContainerStateCallback : _scrollContainerStateCallback
  const itemContent = useEmitterValue('itemContent')
  const context = useEmitterValue('context')
  const groupContent = useEmitterValue('groupContent')
  const trackItemSizes = useEmitterValue('trackItemSizes')
  const itemSize = useEmitterValue('itemSize')
  const log = useEmitterValue('log')
  const listGap = usePublisher('gap')
  const horizontalDirection = useEmitterValue('horizontalDirection')

  const { callbackRef } = useChangedListContentsSizes(
    sizeRanges,
    itemSize,
    trackItemSizes,
    showTopList ? u.noop : scrollContainerStateCallback,
    log,
    listGap,
    customScrollParent,
    horizontalDirection
  )

  const [deviation, setDeviation] = React.useState(0)
  useEmitter('deviation', (value) => {
    if (deviation !== value) {
      // ref.current!.style.marginTop = `${value}px`
      setDeviation(value)
    }
  })

  const EmptyPlaceholder = useEmitterValue('EmptyPlaceholder')
  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder') || DefaultScrollSeekPlaceholder
  const ListComponent = useEmitterValue('ListComponent')!
  const ItemComponent = useEmitterValue('ItemComponent')!
  const GroupComponent = useEmitterValue('GroupComponent')!
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const hasGroups = useEmitterValue('groupIndices').length > 0
  const alignToBottom = useEmitterValue('alignToBottom')
  const initialItemFinalLocationReached = useEmitterValue('initialItemFinalLocationReached')

  const containerStyle: React.CSSProperties = showTopList
    ? {}
    : {
        boxSizing: 'border-box',
        ...(horizontalDirection
          ? {
              whiteSpace: 'nowrap',
              display: 'inline-block',
              height: '100%',
              paddingLeft: listState.offsetTop,
              paddingRight: listState.offsetBottom,
              marginLeft: deviation !== 0 ? deviation : alignToBottom ? 'auto' : 0,
            }
          : {
              marginTop: deviation !== 0 ? deviation : alignToBottom ? 'auto' : 0,
              paddingTop: listState.offsetTop,
              paddingBottom: listState.offsetBottom,
            }),
        ...(initialItemFinalLocationReached ? {} : { visibility: 'hidden' }),
      }

  if (!showTopList && listState.totalCount === 0 && EmptyPlaceholder) {
    return React.createElement(EmptyPlaceholder, contextPropIfNotDomElement(EmptyPlaceholder, context))
  }

  return React.createElement(
    ListComponent,
    {
      ...contextPropIfNotDomElement(ListComponent, context),
      ref: callbackRef,
      style: containerStyle,
      'data-testid': showTopList ? 'virtuoso-top-item-list' : 'virtuoso-item-list',
    },
    (showTopList ? listState.topItems : listState.items).map((item) => {
      const index = item.originalIndex!
      const key = computeItemKey(index + listState.firstItemIndex, item.data, context)

      if (isSeeking) {
        return React.createElement(ScrollSeekPlaceholder, {
          ...contextPropIfNotDomElement(ScrollSeekPlaceholder, context),
          key,
          index: item.index,
          height: item.size,
          type: item.type || 'item',
          ...(item.type === 'group' ? {} : { groupIndex: item.groupIndex }),
        })
      }

      if (item.type === 'group') {
        return React.createElement(
          GroupComponent,
          {
            ...contextPropIfNotDomElement(GroupComponent, context),
            key,
            'data-index': index,
            'data-known-size': item.size,
            'data-item-index': item.index,
            style: GROUP_STYLE,
          },
          groupContent(item.index, context)
        )
      } else {
        return React.createElement(
          ItemComponent,
          {
            ...contextPropIfNotDomElement(ItemComponent, context),
            ...itemPropIfNotDomElement(ItemComponent, item.data),
            key,
            'data-index': index,
            'data-known-size': item.size,
            'data-item-index': item.index,
            'data-item-group-index': item.groupIndex,
            style: horizontalDirection ? HORIZONTAL_ITEM_STYLE : ITEM_STYLE,
          },
          hasGroups
            ? (itemContent as GroupItemContent<any, any>)(item.index, item.groupIndex!, item.data, context)
            : (itemContent as ItemContent<any, any>)(item.index, item.data, context)
        )
      }
    })
  )
})

export const scrollerStyle: React.CSSProperties = {
  height: '100%',
  outline: 'none',
  overflowY: 'auto',
  position: 'relative',
  WebkitOverflowScrolling: 'touch',
}

const horizontalScrollerStyle: React.CSSProperties = {
  outline: 'none',
  overflowX: 'auto',
  position: 'relative',
}

export const viewportStyle: (alignToBottom: boolean) => React.CSSProperties = (alignToBottom) => ({
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  ...(alignToBottom ? { display: 'flex', flexDirection: 'column' } : {}),
})

const topItemListStyle: React.CSSProperties = {
  width: '100%',
  position: positionStickyCssValue(),
  top: 0,
  zIndex: 1,
}

export function contextPropIfNotDomElement(element: unknown, context: unknown) {
  if (typeof element === 'string') {
    return undefined
  }
  return { context }
}

export function itemPropIfNotDomElement(element: unknown, item: unknown) {
  return { item: typeof element === 'string' ? undefined : item }
}

const Header: React.FC = /*#__PURE__*/ React.memo(function VirtuosoHeader() {
  const Header = useEmitterValue('HeaderComponent')
  const headerHeight = usePublisher('headerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize(React.useMemo(() => (el) => headerHeight(correctItemSize(el, 'height')), [headerHeight]))
  const context = useEmitterValue('context')
  return Header
    ? React.createElement(headerFooterTag, { ref }, React.createElement(Header, contextPropIfNotDomElement(Header, context)))
    : null
})

const Footer: React.FC = /*#__PURE__*/ React.memo(function VirtuosoFooter() {
  const Footer = useEmitterValue('FooterComponent')
  const footerHeight = usePublisher('footerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize(React.useMemo(() => (el) => footerHeight(correctItemSize(el, 'height')), [footerHeight]))
  const context = useEmitterValue('context')
  return Footer
    ? React.createElement(headerFooterTag, { ref }, React.createElement(Footer, contextPropIfNotDomElement(Footer, context)))
    : null
})

interface Hooks {
  usePublisher: typeof usePublisher
  useEmitterValue: typeof useEmitterValue
  useEmitter: typeof useEmitter
}

export function buildScroller({ usePublisher, useEmitter, useEmitterValue }: Hooks) {
  const Scroller: React.ComponentType<ScrollerProps> = React.memo(function VirtuosoScroller({ style, children, ...props }) {
    const scrollContainerStateCallback = usePublisher('scrollContainerState')
    const ScrollerComponent = useEmitterValue('ScrollerComponent')!
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const scrollerRefCallback = useEmitterValue('scrollerRef')
    const context = useEmitterValue('context')
    const horizontalDirection = useEmitterValue('horizontalDirection') || false

    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(
      scrollContainerStateCallback,
      smoothScrollTargetReached,
      ScrollerComponent,
      scrollerRefCallback,
      undefined,
      horizontalDirection
    )

    useEmitter('scrollTo', scrollToCallback)
    useEmitter('scrollBy', scrollByCallback)
    const defaultStyle = horizontalDirection ? horizontalScrollerStyle : scrollerStyle
    return React.createElement(
      ScrollerComponent,
      {
        ref: scrollerRef as React.MutableRefObject<HTMLDivElement | null>,
        style: { ...defaultStyle, ...style },
        'data-testid': 'virtuoso-scroller',
        'data-virtuoso-scroller': true,
        tabIndex: 0,
        ...props,
        ...contextPropIfNotDomElement(ScrollerComponent, context),
      },
      children
    )
  })
  return Scroller
}

export function buildWindowScroller({ usePublisher, useEmitter, useEmitterValue }: Hooks) {
  const Scroller: Components['Scroller'] = React.memo(function VirtuosoWindowScroller({ style, children, ...props }) {
    const scrollContainerStateCallback = usePublisher('windowScrollContainerState')
    const ScrollerComponent = useEmitterValue('ScrollerComponent')!
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const totalListHeight = useEmitterValue('totalListHeight')
    const deviation = useEmitterValue('deviation')
    const customScrollParent = useEmitterValue('customScrollParent')
    const context = useEmitterValue('context')
    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(
      scrollContainerStateCallback,
      smoothScrollTargetReached,
      ScrollerComponent,
      u.noop,
      customScrollParent
    )

    useIsomorphicLayoutEffect(() => {
      scrollerRef.current = customScrollParent ? customScrollParent : window
      return () => {
        scrollerRef.current = null
      }
    }, [scrollerRef, customScrollParent])

    useEmitter('windowScrollTo', scrollToCallback)
    useEmitter('scrollBy', scrollByCallback)
    return React.createElement(
      ScrollerComponent,
      {
        style: { position: 'relative', ...style, ...(totalListHeight !== 0 ? { height: totalListHeight + deviation } : {}) },
        'data-virtuoso-scroller': true,
        ...props,
        ...contextPropIfNotDomElement(ScrollerComponent, context),
      },
      children
    )
  })
  return Scroller
}

const Viewport: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext)
  const viewportHeight = usePublisher('viewportHeight')
  const fixedItemHeight = usePublisher('fixedItemHeight')
  const alignToBottom = useEmitterValue('alignToBottom')

  const horizontalDirection = useEmitterValue('horizontalDirection')
  const viewportSizeCallbackMemo = React.useMemo(
    () => u.compose(viewportHeight, (el: HTMLElement) => correctItemSize(el, horizontalDirection ? 'width' : 'height')),
    [viewportHeight, horizontalDirection]
  )
  const viewportRef = useSize(viewportSizeCallbackMemo)

  React.useEffect(() => {
    if (ctx) {
      viewportHeight(ctx.viewportHeight)
      fixedItemHeight(ctx.itemHeight)
    }
  }, [ctx, viewportHeight, fixedItemHeight])

  return (
    <div style={viewportStyle(alignToBottom)} ref={viewportRef} data-viewport-type="element">
      {children}
    </div>
  )
}

const WindowViewport: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext)
  const windowViewportRect = usePublisher('windowViewportRect')
  const fixedItemHeight = usePublisher('fixedItemHeight')
  const customScrollParent = useEmitterValue('customScrollParent')
  const viewportRef = useWindowViewportRectRef(windowViewportRect, customScrollParent)
  const alignToBottom = useEmitterValue('alignToBottom')

  React.useEffect(() => {
    if (ctx) {
      fixedItemHeight(ctx.itemHeight)
      windowViewportRect({ offsetTop: 0, visibleHeight: ctx.viewportHeight, visibleWidth: 100 })
    }
  }, [ctx, windowViewportRect, fixedItemHeight])

  return (
    <div ref={viewportRef} style={viewportStyle(alignToBottom)} data-viewport-type="window">
      {children}
    </div>
  )
}

const TopItemListContainer: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const TopItemList = useEmitterValue('TopItemListComponent') || 'div'
  const headerHeight = useEmitterValue('headerHeight')
  const style = { ...topItemListStyle, marginTop: `${headerHeight}px` }
  const context = useEmitterValue('context')
  return React.createElement(TopItemList, { style, ...contextPropIfNotDomElement(TopItemList, context) }, children)
}

const ListRoot: React.FC<ListRootProps> = /*#__PURE__*/ React.memo(function VirtuosoRoot(props) {
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const showTopList = useEmitterValue('topItemsIndexes').length > 0
  const customScrollParent = useEmitterValue('customScrollParent')
  const TheScroller = customScrollParent || useWindowScroll ? WindowScroller : Scroller
  const TheViewport = customScrollParent || useWindowScroll ? WindowViewport : Viewport
  return (
    <TheScroller {...props}>
      {showTopList && (
        <TopItemListContainer>
          <Items showTopList={true} />
        </TopItemListContainer>
      )}
      <TheViewport>
        <Header />
        <Items />
        <Footer />
      </TheViewport>
    </TheScroller>
  )
})

export const {
  Component: List,
  usePublisher,
  useEmitterValue,
  useEmitter,
} = /*#__PURE__*/ systemToComponent(
  combinedSystem,
  {
    required: {},
    optional: {
      restoreStateFrom: 'restoreStateFrom',
      context: 'context',
      followOutput: 'followOutput',
      itemContent: 'itemContent',
      groupContent: 'groupContent',
      overscan: 'overscan',
      increaseViewportBy: 'increaseViewportBy',
      totalCount: 'totalCount',
      groupCounts: 'groupCounts',
      topItemCount: 'topItemCount',
      firstItemIndex: 'firstItemIndex',
      initialTopMostItemIndex: 'initialTopMostItemIndex',
      components: 'components',
      atBottomThreshold: 'atBottomThreshold',
      atTopThreshold: 'atTopThreshold',
      computeItemKey: 'computeItemKey',
      defaultItemHeight: 'defaultItemHeight',
      fixedItemHeight: 'fixedItemHeight',
      itemSize: 'itemSize',
      scrollSeekConfiguration: 'scrollSeekConfiguration',
      headerFooterTag: 'headerFooterTag',
      data: 'data',
      initialItemCount: 'initialItemCount',
      initialScrollTop: 'initialScrollTop',
      alignToBottom: 'alignToBottom',
      useWindowScroll: 'useWindowScroll',
      customScrollParent: 'customScrollParent',
      scrollerRef: 'scrollerRef',
      logLevel: 'logLevel',
      horizontalDirection: 'horizontalDirection',
    },
    methods: {
      scrollToIndex: 'scrollToIndex',
      scrollIntoView: 'scrollIntoView',
      scrollTo: 'scrollTo',
      scrollBy: 'scrollBy',
      autoscrollToBottom: 'autoscrollToBottom',
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
  ListRoot
)

const Scroller = /*#__PURE__*/ buildScroller({ usePublisher, useEmitterValue, useEmitter })
const WindowScroller = /*#__PURE__*/ buildWindowScroller({ usePublisher, useEmitterValue, useEmitter })

export const Virtuoso = List as <ItemData = any, Context = any>(
  props: VirtuosoProps<ItemData, Context> & { ref?: React.Ref<VirtuosoHandle> }
) => React.ReactElement

export const GroupedVirtuoso = List as <ItemData = any, Context = any>(
  props: GroupedVirtuosoProps<ItemData, Context> & { ref?: React.Ref<GroupedVirtuosoHandle> }
) => React.ReactElement
