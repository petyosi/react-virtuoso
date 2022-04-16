import { RefHandle, systemToComponent } from '@virtuoso.dev/react-urx'
import {
  compose,
  connect,
  getValue,
  map,
  pipe,
  publish,
  statefulStream,
  stream,
  Stream,
  subscribe,
  system,
  tup,
  withLatestFrom,
  statefulStreamFromEmitter,
  distinctUntilChanged,
  noop,
} from '@virtuoso.dev/urx'
import * as React from 'react'
import { ComponentType, createElement, CSSProperties, FC, PropsWithChildren } from 'react'
import useIsomorphicLayoutEffect from './hooks/useIsomorphicLayoutEffect'
import useChangedListContentsSizes from './hooks/useChangedChildSizes'
import useScrollTop from './hooks/useScrollTop'
import useSize from './hooks/useSize'
import { Components, ComputeItemKey, GroupContent, GroupItemContent, ItemContent, ListRootProps } from './interfaces'
import { listSystem } from './listSystem'
import { positionStickyCssValue } from './utils/positionStickyCssValue'
import useWindowViewportRectRef from './hooks/useWindowViewportRect'
import { correctItemSize } from './utils/correctItemSize'
import { ScrollerProps } from '.'

export function identity<T>(value: T) {
  return value
}

const listComponentPropsSystem = system(() => {
  const itemContent = statefulStream<ItemContent<any, any> | GroupItemContent<any, any>>((index: number) => `Item ${index}`)
  const context = statefulStream<unknown>(null)
  const groupContent = statefulStream<GroupContent>((index: number) => `Group ${index}`)
  const components = statefulStream<Components<any>>({})
  const computeItemKey = statefulStream<ComputeItemKey<any, any>>(identity)
  const headerFooterTag = statefulStream('div')
  const scrollerRef = statefulStream<(ref: HTMLElement | Window | null) => void>(noop)

  const distinctProp = <K extends keyof Components<any>>(propName: K, defaultValue: Components<any>[K] | null | 'div' = null) => {
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

export function addDeprecatedAlias<T>(prop: Stream<T>, message: string) {
  const alias = stream<T>()
  subscribe(alias, () =>
    console.warn(`react-virtuoso: You are using a deprecated property. ${message}`, 'color: red;', 'color: inherit;', 'color: blue;')
  )
  connect(alias, prop)
  return alias
}

const combinedSystem = system(([listSystem, propsSystem]) => {
  const deprecatedProps = {
    item: addDeprecatedAlias(propsSystem.itemContent, 'Rename the %citem%c prop to %citemContent.'),
    group: addDeprecatedAlias(propsSystem.groupContent, 'Rename the %cgroup%c prop to %cgroupContent.'),
    topItems: addDeprecatedAlias(listSystem.topItemCount, 'Rename the %ctopItems%c prop to %ctopItemCount.'),
    itemHeight: addDeprecatedAlias(listSystem.fixedItemHeight, 'Rename the %citemHeight%c prop to %cfixedItemHeight.'),
    scrollingStateChange: addDeprecatedAlias(listSystem.isScrolling, 'Rename the %cscrollingStateChange%c prop to %cisScrolling.'),
    adjustForPrependedItems: stream<any>(),
    maxHeightCacheSize: stream<any>(),
    footer: stream<any>(),
    header: stream<any>(),
    HeaderContainer: stream<any>(),
    FooterContainer: stream<any>(),
    ItemContainer: stream<any>(),
    ScrollContainer: stream<any>(),
    GroupContainer: stream<any>(),
    ListContainer: stream<any>(),
    emptyComponent: stream<any>(),
    scrollSeek: stream<any>(),
  }

  subscribe(deprecatedProps.adjustForPrependedItems, () => {
    console.warn(
      `react-virtuoso: adjustForPrependedItems is no longer supported. Use the firstItemIndex property instead - https://virtuoso.dev/prepend-items.`,
      'color: red;',
      'color: inherit;',
      'color: blue;'
    )
  })

  subscribe(deprecatedProps.maxHeightCacheSize, () => {
    console.warn(`react-virtuoso: maxHeightCacheSize is no longer necessary. Setting it has no effect - remove it from your code.`)
  })

  subscribe(deprecatedProps.HeaderContainer, () => {
    console.warn(
      `react-virtuoso: HeaderContainer is deprecated. Use headerFooterTag if you want to change the wrapper of the header component and pass components.Header to change its contents.`
    )
  })

  subscribe(deprecatedProps.FooterContainer, () => {
    console.warn(
      `react-virtuoso: FooterContainer is deprecated. Use headerFooterTag if you want to change the wrapper of the footer component and pass components.Footer to change its contents.`
    )
  })

  function deprecateComponentProp(stream: Stream<any>, componentName: string, propName: string) {
    connect(
      pipe(
        stream,
        withLatestFrom(propsSystem.components),
        map(([comp, components]) => {
          console.warn(`react-virtuoso: ${propName} property is deprecated. Pass components.${componentName} instead.`)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          return { ...components, [componentName]: comp }
        })
      ),
      propsSystem.components
    )
  }

  subscribe(deprecatedProps.scrollSeek, ({ placeholder, ...config }) => {
    console.warn(
      `react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead.`
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    publish(propsSystem.components, { ...getValue(propsSystem.components), ScrollSeekPlaceholder: placeholder })
    publish(listSystem.scrollSeekConfiguration, config)
  })

  deprecateComponentProp(deprecatedProps.footer, 'Footer', 'footer')
  deprecateComponentProp(deprecatedProps.header, 'Header', 'header')
  deprecateComponentProp(deprecatedProps.ItemContainer, 'Item', 'ItemContainer')
  deprecateComponentProp(deprecatedProps.ListContainer, 'List', 'ListContainer')
  deprecateComponentProp(deprecatedProps.ScrollContainer, 'Scroller', 'ScrollContainer')
  deprecateComponentProp(deprecatedProps.emptyComponent, 'EmptyPlaceholder', 'emptyComponent')
  deprecateComponentProp(deprecatedProps.GroupContainer, 'Group', 'GroupContainer')

  return { ...listSystem, ...propsSystem, ...deprecatedProps }
}, tup(listSystem, listComponentPropsSystem))

const DefaultScrollSeekPlaceholder = ({ height }: { height: number }) => <div style={{ height }}></div>

const GROUP_STYLE = { position: positionStickyCssValue(), zIndex: 1, overflowAnchor: 'none' }
const ITEM_STYLE = { overflowAnchor: 'none' }

export const Items = React.memo(function VirtuosoItems({ showTopList = false }: { showTopList?: boolean }) {
  const listState = useEmitterValue('listState')
  const deviation = useEmitterValue('deviation')
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

  const ref = useChangedListContentsSizes(
    sizeRanges,
    itemSize,
    trackItemSizes,
    showTopList ? noop : scrollContainerStateCallback,
    log,
    customScrollParent
  )
  const EmptyPlaceholder = useEmitterValue('EmptyPlaceholder')
  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder') || DefaultScrollSeekPlaceholder
  const ListComponent = useEmitterValue('ListComponent')!
  const ItemComponent = useEmitterValue('ItemComponent')!
  const GroupComponent = useEmitterValue('GroupComponent')!
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const hasGroups = useEmitterValue('groupIndices').length > 0
  const paddingTopAddition = useEmitterValue('paddingTopAddition')
  const firstItemIndex = useEmitterValue('firstItemIndex')
  const statefulTotalCount = useEmitterValue('statefulTotalCount')

  const containerStyle: CSSProperties = showTopList
    ? {}
    : {
        boxSizing: 'border-box',
        paddingTop: listState.offsetTop + paddingTopAddition,
        paddingBottom: listState.offsetBottom,
        marginTop: deviation,
      }

  if (!showTopList && statefulTotalCount === 0 && EmptyPlaceholder) {
    return createElement(EmptyPlaceholder, contextPropIfNotDomElement(EmptyPlaceholder, context))
  }

  return createElement(
    ListComponent,
    {
      ...contextPropIfNotDomElement(ListComponent, context),
      ref,
      style: containerStyle,
      'data-test-id': showTopList ? 'virtuoso-top-item-list' : 'virtuoso-item-list',
    },
    (showTopList ? listState.topItems : listState.items).map((item) => {
      const index = item.originalIndex!
      const key = computeItemKey(index + firstItemIndex, item.data, context)

      if (isSeeking) {
        return createElement(ScrollSeekPlaceholder, {
          ...contextPropIfNotDomElement(ScrollSeekPlaceholder, context),
          key,
          index: item.index,
          height: item.size,
          type: item.type || 'item',
          ...(item.type === 'group' ? {} : { groupIndex: item.groupIndex }),
        })
      }

      if (item.type === 'group') {
        return createElement(
          GroupComponent,
          {
            ...contextPropIfNotDomElement(GroupComponent, context),
            key,
            'data-index': index,
            'data-known-size': item.size,
            'data-item-index': item.index,
            style: GROUP_STYLE,
          } as any,
          groupContent(item.index)
        )
      } else {
        return createElement(
          ItemComponent,
          {
            ...contextPropIfNotDomElement(ItemComponent, context),
            key,
            'data-index': index,
            'data-known-size': item.size,
            'data-item-index': item.index,
            'data-item-group-index': item.groupIndex,
            style: ITEM_STYLE,
          } as any,
          hasGroups
            ? (itemContent as GroupItemContent<any, any>)(item.index, item.groupIndex!, item.data, context)
            : (itemContent as ItemContent<any, any>)(item.index, item.data, context)
        )
      }
    })
  )
})

export const scrollerStyle: CSSProperties = {
  height: '100%',
  outline: 'none',
  overflowY: 'auto',
  position: 'relative',
  WebkitOverflowScrolling: 'touch',
}

export const viewportStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
}

const topItemListStyle: CSSProperties = {
  width: '100%',
  position: positionStickyCssValue(),
  top: 0,
}

export function contextPropIfNotDomElement(element: unknown, context: unknown) {
  if (typeof element === 'string') {
    return undefined
  }
  return { context }
}

const Header: FC = React.memo(function VirtuosoHeader() {
  const Header = useEmitterValue('HeaderComponent')
  const headerHeight = usePublisher('headerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize((el) => headerHeight(correctItemSize(el, 'height')))
  const context = useEmitterValue('context')
  return Header ? createElement(headerFooterTag, { ref }, createElement(Header, contextPropIfNotDomElement(Header, context))) : null
})

const Footer: FC = React.memo(function VirtuosoFooter() {
  const Footer = useEmitterValue('FooterComponent')
  const footerHeight = usePublisher('footerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize((el) => footerHeight(correctItemSize(el, 'height')))
  const context = useEmitterValue('context')
  return Footer ? createElement(headerFooterTag, { ref }, createElement(Footer, contextPropIfNotDomElement(Footer, context))) : null
})

export interface Hooks {
  usePublisher: typeof usePublisher
  useEmitterValue: typeof useEmitterValue
  useEmitter: typeof useEmitter
}

export function buildScroller({ usePublisher, useEmitter, useEmitterValue }: Hooks) {
  const Scroller: ComponentType<ScrollerProps> = React.memo(function VirtuosoScroller({ style, children, ...props }) {
    const scrollContainerStateCallback = usePublisher('scrollContainerState')
    const ScrollerComponent = useEmitterValue('ScrollerComponent')!
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const scrollerRefCallback = useEmitterValue('scrollerRef')
    const context = useEmitterValue('context')

    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(
      scrollContainerStateCallback,
      smoothScrollTargetReached,
      ScrollerComponent,
      scrollerRefCallback
    )

    useEmitter('scrollTo', scrollToCallback)
    useEmitter('scrollBy', scrollByCallback)
    return createElement(
      ScrollerComponent,
      {
        ref: scrollerRef as React.MutableRefObject<HTMLDivElement | null>,
        style: { ...scrollerStyle, ...style },
        'data-test-id': 'virtuoso-scroller',
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
      noop,
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
    return createElement(
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

const Viewport: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const viewportHeight = usePublisher('viewportHeight')
  const viewportRef = useSize(compose(viewportHeight, (el) => correctItemSize(el, 'height')))

  return (
    <div style={viewportStyle} ref={viewportRef} data-viewport-type="element">
      {children}
    </div>
  )
}

const WindowViewport: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const windowViewportRect = usePublisher('windowViewportRect')
  const customScrollParent = useEmitterValue('customScrollParent')
  const viewportRef = useWindowViewportRectRef(windowViewportRect, customScrollParent)

  return (
    <div ref={viewportRef} style={viewportStyle} data-viewport-type="window">
      {children}
    </div>
  )
}

const TopItemListContainer: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const TopItemList = useEmitterValue('TopItemListComponent')
  const headerHeight = useEmitterValue('headerHeight')
  const style = { ...topItemListStyle, marginTop: `${headerHeight}px` }
  const context = useEmitterValue('context')
  return createElement(TopItemList || 'div', { style, context }, children)
}

const ListRoot: FC<ListRootProps> = React.memo(function VirtuosoRoot(props) {
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const showTopList = useEmitterValue('topItemsIndexes').length > 0
  const customScrollParent = useEmitterValue('customScrollParent')
  const TheScroller = customScrollParent || useWindowScroll ? WindowScroller : Scroller
  const TheViewport = customScrollParent || useWindowScroll ? WindowViewport : Viewport
  return (
    <TheScroller {...props}>
      <TheViewport>
        <Header />
        <Items />
        <Footer />
      </TheViewport>
      {showTopList && (
        <TopItemListContainer>
          <Items showTopList={true} />
        </TopItemListContainer>
      )}
    </TheScroller>
  )
})

export type ListHandle = RefHandle<typeof List>

export const {
  Component: List,
  usePublisher,
  useEmitterValue,
  useEmitter,
} = systemToComponent(
  combinedSystem,
  {
    required: {},
    optional: {
      context: 'context',
      followOutput: 'followOutput',
      firstItemIndex: 'firstItemIndex',
      itemContent: 'itemContent',
      groupContent: 'groupContent',
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
      headerFooterTag: 'headerFooterTag',
      data: 'data',
      initialItemCount: 'initialItemCount',
      initialScrollTop: 'initialScrollTop',
      alignToBottom: 'alignToBottom',
      useWindowScroll: 'useWindowScroll',
      customScrollParent: 'customScrollParent',
      scrollerRef: 'scrollerRef',
      logLevel: 'logLevel',

      // deprecated
      item: 'item',
      group: 'group',
      topItems: 'topItems',
      itemHeight: 'itemHeight',
      scrollingStateChange: 'scrollingStateChange',
      maxHeightCacheSize: 'maxHeightCacheSize',
      footer: 'footer',
      header: 'header',
      ItemContainer: 'ItemContainer',
      ScrollContainer: 'ScrollContainer',
      ListContainer: 'ListContainer',
      GroupContainer: 'GroupContainer',
      emptyComponent: 'emptyComponent',
      HeaderContainer: 'HeaderContainer',
      FooterContainer: 'FooterContainer',
      scrollSeek: 'scrollSeek',
    },
    methods: {
      scrollToIndex: 'scrollToIndex',
      scrollIntoView: 'scrollIntoView',
      scrollTo: 'scrollTo',
      scrollBy: 'scrollBy',
      adjustForPrependedItems: 'adjustForPrependedItems',
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

const Scroller = buildScroller({ usePublisher, useEmitterValue, useEmitter })
const WindowScroller = buildWindowScroller({ usePublisher, useEmitterValue, useEmitter })
