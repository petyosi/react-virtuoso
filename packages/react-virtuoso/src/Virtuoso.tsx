import React from 'react'

import { ScrollerProps } from '.'
import { GroupedVirtuosoHandle, GroupedVirtuosoProps, VirtuosoHandle, VirtuosoProps } from './component-interfaces/Virtuoso'
import useChangedListContentsSizes from './hooks/useChangedChildSizes'
import useIsomorphicLayoutEffect from './hooks/useIsomorphicLayoutEffect'
import useScrollTop from './hooks/useScrollTop'
import useSize from './hooks/useSize'
import useWindowViewportRectRef from './hooks/useWindowViewportRect'
import { Components, ComputeItemKey, GroupContent, GroupItemContent, ItemContent, ListRootProps } from './interfaces'
import { listSystem } from './listSystem'
import { systemToComponent } from './react-urx'
import * as u from './urx'
import { VirtuosoMockContext } from './utils/context'
import { correctItemSize } from './utils/correctItemSize'
import { positionStickyCssValue } from './utils/positionStickyCssValue'

export function identity<T>(value: T) {
  return value
}

const listComponentPropsSystem = /*#__PURE__*/ u.system(() => {
  const itemContent = u.statefulStream<GroupItemContent<any, any> | ItemContent<any, any>>((index: number) => `Item ${index}`)
  const context = u.statefulStream<unknown>(null)
  const groupContent = u.statefulStream<GroupContent<any>>((index: number) => `Group ${index}`)
  const components = u.statefulStream<Components<any>>({})
  const computeItemKey = u.statefulStream<ComputeItemKey<any, any>>(identity)
  const HeaderFooterTag = u.statefulStream('div')
  const scrollerRef = u.statefulStream<(ref: HTMLElement | null | Window) => void>(u.noop)

  const distinctProp = <K extends keyof Components<any>>(propName: K, defaultValue: 'div' | Components<any>[K] | null = null) => {
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
    FooterComponent: distinctProp('Footer'),
    GroupComponent: distinctProp('Group', 'div'),
    groupContent,
    HeaderComponent: distinctProp('Header'),
    HeaderFooterTag,
    ItemComponent: distinctProp('Item', 'div'),
    itemContent,
    ListComponent: distinctProp('List', 'div'),
    ScrollerComponent: distinctProp('Scroller', 'div'),
    scrollerRef,
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder'),
    TopItemListComponent: distinctProp('TopItemList'),
  }
})

const combinedSystem = /*#__PURE__*/ u.system(
  ([listSystem, propsSystem]) => {
    return { ...listSystem, ...propsSystem }
  },
  u.tup(listSystem, listComponentPropsSystem)
)

const DefaultScrollSeekPlaceholder = ({ height }: { height: number }) => <div style={{ height }}></div>

const GROUP_STYLE = { overflowAnchor: 'none', position: positionStickyCssValue(), zIndex: 1 } as const
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
    horizontalDirection,
    useEmitterValue('skipAnimationFrameInResizeObserver')
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
              display: 'inline-block',
              height: '100%',
              marginLeft: deviation !== 0 ? deviation : alignToBottom ? 'auto' : 0,
              paddingLeft: listState.offsetTop,
              paddingRight: listState.offsetBottom,
              whiteSpace: 'nowrap',
            }
          : {
              marginTop: deviation !== 0 ? deviation : alignToBottom ? 'auto' : 0,
              paddingBottom: listState.offsetBottom,
              paddingTop: listState.offsetTop,
            }),
        ...(initialItemFinalLocationReached ? {} : { visibility: 'hidden' }),
      }

  if (!showTopList && listState.totalCount === 0 && EmptyPlaceholder) {
    return <EmptyPlaceholder {...contextPropIfNotDomElement(EmptyPlaceholder, context)} />
  }

  return (
    <ListComponent
      {...contextPropIfNotDomElement(ListComponent, context)}
      data-testid={showTopList ? 'virtuoso-top-item-list' : 'virtuoso-item-list'}
      ref={callbackRef}
      style={containerStyle}
    >
      {(showTopList ? listState.topItems : listState.items).map((item) => {
        const index = item.originalIndex!
        const key = computeItemKey(index + listState.firstItemIndex, item.data, context)

        if (isSeeking) {
          return (
            <ScrollSeekPlaceholder
              {...contextPropIfNotDomElement(ScrollSeekPlaceholder, context)}
              height={item.size}
              index={item.index}
              key={key}
              type={item.type || 'item'}
              {...(item.type === 'group' ? {} : { groupIndex: item.groupIndex })}
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
              style={GROUP_STYLE}
            >
              {groupContent(item.index, context)}
            </GroupComponent>
          )
        } else {
          return (
            <ItemComponent
              {...contextPropIfNotDomElement(ItemComponent, context)}
              {...itemPropIfNotDomElement(ItemComponent, item.data)}
              data-index={index}
              data-item-group-index={item.groupIndex}
              data-item-index={item.index}
              data-known-size={item.size}
              key={key}
              style={horizontalDirection ? HORIZONTAL_ITEM_STYLE : ITEM_STYLE}
            >
              {hasGroups
                ? (itemContent as GroupItemContent<any, any>)(item.index, item.groupIndex!, item.data, context)
                : (itemContent as ItemContent<any, any>)(item.index, item.data, context)}
            </ItemComponent>
          )
        }
      })}
    </ListComponent>
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
  height: '100%',
  position: 'absolute',
  top: 0,
  width: '100%',
  ...(alignToBottom ? { display: 'flex', flexDirection: 'column' } : {}),
})

const topItemListStyle: React.CSSProperties = {
  position: positionStickyCssValue(),
  top: 0,
  width: '100%',
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-assignment
  const HeaderFooterTag = useEmitterValue('HeaderFooterTag') as any
  const ref = useSize(
    React.useMemo(
      () => (el) => {
        headerHeight(correctItemSize(el, 'height'))
      },
      [headerHeight]
    ),
    true,
    useEmitterValue('skipAnimationFrameInResizeObserver')
  )
  const context = useEmitterValue('context')
  return Header ? (
    <HeaderFooterTag ref={ref}>
      <Header {...contextPropIfNotDomElement(Header, context)} />
    </HeaderFooterTag>
  ) : null
})

const Footer: React.FC = /*#__PURE__*/ React.memo(function VirtuosoFooter() {
  const Footer = useEmitterValue('FooterComponent')
  const footerHeight = usePublisher('footerHeight')
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-assignment
  const HeaderFooterTag = useEmitterValue('HeaderFooterTag') as any
  const ref = useSize(
    React.useMemo(
      () => (el) => {
        footerHeight(correctItemSize(el, 'height'))
      },
      [footerHeight]
    ),
    true,
    useEmitterValue('skipAnimationFrameInResizeObserver')
  )
  const context = useEmitterValue('context')
  return Footer ? (
    <HeaderFooterTag ref={ref}>
      <Footer {...contextPropIfNotDomElement(Footer, context)} />
    </HeaderFooterTag>
  ) : null
})

interface Hooks {
  useEmitter: typeof useEmitter
  useEmitterValue: typeof useEmitterValue
  usePublisher: typeof usePublisher
}

export function buildScroller({ useEmitter, useEmitterValue, usePublisher }: Hooks) {
  const Scroller: React.ComponentType<ScrollerProps> = React.memo(function VirtuosoScroller({ children, style, ...props }) {
    const scrollContainerStateCallback = usePublisher('scrollContainerState')
    const ScrollerComponent = useEmitterValue('ScrollerComponent')!
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const scrollerRefCallback = useEmitterValue('scrollerRef')
    const context = useEmitterValue('context')
    const horizontalDirection = useEmitterValue('horizontalDirection') || false

    const { scrollByCallback, scrollerRef, scrollToCallback } = useScrollTop(
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
    return (
      <ScrollerComponent
        data-testid="virtuoso-scroller"
        data-virtuoso-scroller={true}
        ref={scrollerRef as React.MutableRefObject<HTMLDivElement | null>}
        style={{ ...defaultStyle, ...style }}
        tabIndex={0}
        {...props}
        {...contextPropIfNotDomElement(ScrollerComponent, context)}
      >
        {children}
      </ScrollerComponent>
    )
  })
  return Scroller
}

export function buildWindowScroller({ useEmitter, useEmitterValue, usePublisher }: Hooks) {
  const Scroller: Components['Scroller'] = React.memo(function VirtuosoWindowScroller({ children, style, ...props }) {
    const scrollContainerStateCallback = usePublisher('windowScrollContainerState')
    const ScrollerComponent = useEmitterValue('ScrollerComponent')!
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const totalListHeight = useEmitterValue('totalListHeight')
    const deviation = useEmitterValue('deviation')
    const customScrollParent = useEmitterValue('customScrollParent')
    const context = useEmitterValue('context')
    const { scrollByCallback, scrollerRef, scrollToCallback } = useScrollTop(
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
    return (
      <ScrollerComponent
        data-virtuoso-scroller={true}
        style={{ position: 'relative', ...style, ...(totalListHeight !== 0 ? { height: totalListHeight + deviation } : {}) }}
        {...props}
        {...contextPropIfNotDomElement(ScrollerComponent, context)}
      >
        {children}
      </ScrollerComponent>
    )
  })
  return Scroller
}

const Viewport: React.FC<React.PropsWithChildren> = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext)
  const viewportHeight = usePublisher('viewportHeight')
  const fixedItemHeight = usePublisher('fixedItemHeight')
  const alignToBottom = useEmitterValue('alignToBottom')

  const horizontalDirection = useEmitterValue('horizontalDirection')
  const viewportSizeCallbackMemo = React.useMemo(
    () => u.compose(viewportHeight, (el: HTMLElement) => correctItemSize(el, horizontalDirection ? 'width' : 'height')),
    [viewportHeight, horizontalDirection]
  )
  const viewportRef = useSize(viewportSizeCallbackMemo, true, useEmitterValue('skipAnimationFrameInResizeObserver'))

  React.useEffect(() => {
    if (ctx) {
      viewportHeight(ctx.viewportHeight)
      fixedItemHeight(ctx.itemHeight)
    }
  }, [ctx, viewportHeight, fixedItemHeight])

  return (
    <div data-viewport-type="element" ref={viewportRef} style={viewportStyle(alignToBottom)}>
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
  const alignToBottom = useEmitterValue('alignToBottom')

  React.useEffect(() => {
    if (ctx) {
      fixedItemHeight(ctx.itemHeight)
      windowViewportRect({ offsetTop: 0, visibleHeight: ctx.viewportHeight, visibleWidth: 100 })
    }
  }, [ctx, windowViewportRect, fixedItemHeight])

  return (
    <div data-viewport-type="window" ref={viewportRef} style={viewportStyle(alignToBottom)}>
      {children}
    </div>
  )
}

const TopItemListContainer: React.FC<React.PropsWithChildren> = ({ children }) => {
  const TopItemList = useEmitterValue('TopItemListComponent') || 'div'
  const headerHeight = useEmitterValue('headerHeight')
  const style = { ...topItemListStyle, marginTop: `${headerHeight}px` }
  const context = useEmitterValue('context')
  return (
    <TopItemList style={style} {...contextPropIfNotDomElement(TopItemList, context)}>
      {children}
    </TopItemList>
  )
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
  useEmitter,
  useEmitterValue,
  usePublisher,
} = /*#__PURE__*/ systemToComponent(
  combinedSystem,
  {
    events: {
      atBottomStateChange: 'atBottomStateChange',
      atTopStateChange: 'atTopStateChange',
      endReached: 'endReached',
      groupIndices: 'groupIndices',
      isScrolling: 'isScrolling',
      itemsRendered: 'itemsRendered',
      rangeChanged: 'rangeChanged',
      startReached: 'startReached',
      totalListHeightChanged: 'totalListHeightChanged',
    },
    methods: {
      autoscrollToBottom: 'autoscrollToBottom',
      getState: 'getState',
      scrollBy: 'scrollBy',
      scrollIntoView: 'scrollIntoView',
      scrollTo: 'scrollTo',
      scrollToIndex: 'scrollToIndex',
    },
    optional: {
      alignToBottom: 'alignToBottom',
      atBottomThreshold: 'atBottomThreshold',
      atTopThreshold: 'atTopThreshold',
      components: 'components',
      computeItemKey: 'computeItemKey',
      context: 'context',
      customScrollParent: 'customScrollParent',
      data: 'data',
      defaultItemHeight: 'defaultItemHeight',
      firstItemIndex: 'firstItemIndex',
      fixedItemHeight: 'fixedItemHeight',
      followOutput: 'followOutput',
      groupContent: 'groupContent',
      groupCounts: 'groupCounts',
      headerFooterTag: 'HeaderFooterTag',
      horizontalDirection: 'horizontalDirection',
      increaseViewportBy: 'increaseViewportBy',
      initialItemCount: 'initialItemCount',
      initialScrollTop: 'initialScrollTop',
      initialTopMostItemIndex: 'initialTopMostItemIndex',
      itemContent: 'itemContent',
      itemSize: 'itemSize',
      logLevel: 'logLevel',
      overscan: 'overscan',
      restoreStateFrom: 'restoreStateFrom',
      scrollerRef: 'scrollerRef',
      scrollSeekConfiguration: 'scrollSeekConfiguration',
      skipAnimationFrameInResizeObserver: 'skipAnimationFrameInResizeObserver',
      topItemCount: 'topItemCount',
      totalCount: 'totalCount',
      useWindowScroll: 'useWindowScroll',
    },
    required: {},
  },
  ListRoot
)

const Scroller = /*#__PURE__*/ buildScroller({ useEmitter, useEmitterValue, usePublisher })
const WindowScroller = /*#__PURE__*/ buildWindowScroller({ useEmitter, useEmitterValue, usePublisher })

export const Virtuoso = List as <ItemData = any, Context = any>(
  props: VirtuosoProps<ItemData, Context> & { ref?: React.Ref<VirtuosoHandle> }
) => React.ReactElement

export const GroupedVirtuoso = List as <ItemData = any, Context = any>(
  props: GroupedVirtuosoProps<ItemData, Context> & { ref?: React.Ref<GroupedVirtuosoHandle> }
) => React.ReactElement
