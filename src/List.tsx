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
import { createElement, CSSProperties, FC } from 'react'
import useIsomorphicLayoutEffect from './hooks/useIsomorphicLayoutEffect'
import useChangedListContentsSizes from './hooks/useChangedChildSizes'
import useScrollTop from './hooks/useScrollTop'
import useSize from './hooks/useSize'
import { Components, ComputeItemKey, GroupContent, GroupItemContent, ItemContent, ListRootProps } from './interfaces'
import { listSystem } from './listSystem'
import { positionStickyCssValue } from './utils/positionStickyCssValue'
import useWindowViewportRectRef from './hooks/useWindowViewportRect'
import { correctItemSize } from './utils/correctItemSize'

export function identity<T>(value: T) {
  return value
}

const listComponentPropsSystem = system(() => {
  const itemContent = statefulStream<ItemContent<any> | GroupItemContent<any>>((index: number) => `Item ${index}`)
  const groupContent = statefulStream<GroupContent>((index: number) => `Group ${index}`)
  const components = statefulStream<Components>({})
  const computeItemKey = statefulStream<ComputeItemKey<any>>(identity)
  const headerFooterTag = statefulStream('div')
  const scrollerRef = statefulStream<(ref: HTMLElement | Window | null) => void>(noop)

  const distinctProp = <K extends keyof Components>(propName: K, defaultValue: Components[K] | null | 'div' = null) => {
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

const GROUP_STYLE = { position: positionStickyCssValue(), zIndex: 1 }

export const Items = React.memo(function VirtuosoItems({ showTopList = false }: { showTopList?: boolean }) {
  const listState = useEmitterValue('listState')
  const deviation = useEmitterValue('deviation')
  const sizeRanges = usePublisher('sizeRanges')
  const scrollHeightCallback = usePublisher('scrollHeight')
  const itemContent = useEmitterValue('itemContent')
  const groupContent = useEmitterValue('groupContent')
  const trackItemSizes = useEmitterValue('trackItemSizes')
  const itemSize = useEmitterValue('itemSize')
  const log = useEmitterValue('log')

  const ref = useChangedListContentsSizes(sizeRanges, itemSize, trackItemSizes, showTopList ? noop : scrollHeightCallback, log)
  const EmptyPlaceholder = useEmitterValue('EmptyPlaceholder')
  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder') || DefaultScrollSeekPlaceholder
  const ListComponent = useEmitterValue('ListComponent')!
  const ItemComponent = useEmitterValue('ItemComponent')!
  const GroupComponent = useEmitterValue('GroupComponent')!
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const hasGroups = useEmitterValue('groupIndices').length > 0
  const paddingTopAddition = useEmitterValue('paddingTopAddition')
  const scrolledToInitialItem = useEmitterValue('scrolledToInitialItem')
  const firstItemIndex = useEmitterValue('firstItemIndex')

  // const calculatedHeight = listState.offsetBottom + listState.bottom
  const containerStyle: CSSProperties = showTopList
    ? {}
    : {
        boxSizing: 'border-box',
        paddingTop: listState.offsetTop + paddingTopAddition,
        paddingBottom: listState.offsetBottom,
        marginTop: deviation,
        // height: calculatedHeight,
      }

  if (!showTopList && listState.items.length === 0 && EmptyPlaceholder && scrolledToInitialItem) {
    return createElement(EmptyPlaceholder)
  }

  return createElement(
    ListComponent,
    { ref, style: containerStyle, 'data-test-id': showTopList ? 'virtuoso-top-item-list' : 'virtuoso-item-list' },
    (showTopList ? listState.topItems : listState.items).map((item) => {
      const index = item.originalIndex!
      const key = computeItemKey(index + firstItemIndex, item.data)

      if (isSeeking) {
        return createElement(ScrollSeekPlaceholder, { key, index: item.index, height: item.size })
      }

      if (item.type === 'group') {
        return createElement(
          GroupComponent,
          {
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
            key,
            'data-index': index,
            'data-known-size': item.size,
            'data-item-index': item.index,
            'data-item-group-index': item.groupIndex,
            style: { overflowAnchor: 'none' },
          } as any,
          hasGroups
            ? (itemContent as GroupItemContent<any>)(item.index, item.groupIndex!, item.data)
            : (itemContent as ItemContent<any>)(item.index, item.data)
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

const Header: FC = React.memo(function VirtuosoHeader() {
  const Header = useEmitterValue('HeaderComponent')
  const headerHeight = usePublisher('headerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize((el) => headerHeight(correctItemSize(el, 'height')))
  return Header ? createElement(headerFooterTag, { ref }, createElement(Header)) : null
})

const Footer: FC = React.memo(function VirtuosoFooter() {
  const Footer = useEmitterValue('FooterComponent')
  const footerHeight = usePublisher('footerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize((el) => footerHeight(correctItemSize(el, 'height')))
  return Footer ? createElement(headerFooterTag, { ref }, createElement(Footer)) : null
})

export interface Hooks {
  usePublisher: typeof usePublisher
  useEmitterValue: typeof useEmitterValue
  useEmitter: typeof useEmitter
}

export function buildScroller({ usePublisher, useEmitter, useEmitterValue }: Hooks) {
  const Scroller: Components['Scroller'] = React.memo(function VirtuosoScroller({ style, children, ...props }) {
    const scrollTopCallback = usePublisher('scrollTop')
    const scrollHeightCallback = usePublisher('scrollHeight')
    const ScrollerComponent = useEmitterValue('ScrollerComponent')!
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const scrollerRefCallback = useEmitterValue('scrollerRef')

    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(
      scrollTopCallback,
      smoothScrollTargetReached,
      ScrollerComponent,
      scrollerRefCallback,
      scrollHeightCallback
    )

    useEmitter('scrollTo', scrollToCallback)
    useEmitter('scrollBy', scrollByCallback)
    return createElement(
      ScrollerComponent,
      {
        ref: scrollerRef as React.MutableRefObject<HTMLDivElement | null>,
        style: { ...scrollerStyle, ...style },
        tabIndex: 0,
        ...props,
      },
      children
    )
  })
  return Scroller
}

export function buildWindowScroller({ usePublisher, useEmitter, useEmitterValue }: Hooks) {
  const Scroller: Components['Scroller'] = React.memo(function VirtuosoWindowScroller({ style, children, ...props }) {
    const scrollTopCallback = usePublisher('windowScrollTop')
    const scrollHeightCallback = usePublisher('scrollHeight')
    const ScrollerComponent = useEmitterValue('ScrollerComponent')!
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const totalListHeight = useEmitterValue('totalListHeight')
    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(
      scrollTopCallback,
      smoothScrollTargetReached,
      ScrollerComponent,
      noop,
      scrollHeightCallback
    )

    useIsomorphicLayoutEffect(() => {
      scrollerRef.current = window
      return () => {
        scrollerRef.current = null
      }
    }, [scrollerRef])

    useEmitter('windowScrollTo', scrollToCallback)
    useEmitter('scrollBy', scrollByCallback)
    return createElement(
      ScrollerComponent,
      {
        style: { position: 'relative', ...style, ...(totalListHeight !== 0 ? { height: totalListHeight } : {}) },
        ...props,
      },
      children
    )
  })
  return Scroller
}

const Viewport: FC = ({ children }) => {
  const viewportHeight = usePublisher('viewportHeight')
  const viewportRef = useSize(compose(viewportHeight, (el) => correctItemSize(el, 'height')))

  return (
    <div style={viewportStyle} ref={viewportRef}>
      {children}
    </div>
  )
}

const WindowViewport: FC = ({ children }) => {
  const windowViewportRect = usePublisher('windowViewportRect')
  const viewportRef = useWindowViewportRectRef(windowViewportRect)

  return (
    <div ref={viewportRef} style={viewportStyle}>
      {children}
    </div>
  )
}

const TopItemListContainer: FC = ({ children }) => {
  const TopItemList = useEmitterValue('TopItemListComponent')
  const headerHeight = useEmitterValue('headerHeight')
  const style = { ...topItemListStyle, marginTop: `${headerHeight}px` }
  return createElement(TopItemList || 'div', { style }, children)
}

const ListRoot: FC<ListRootProps> = React.memo(function VirtuosoRoot(props) {
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const showTopList = useEmitterValue('topItemsIndexes').length > 0
  const TheScroller = useWindowScroll ? WindowScroller : Scroller
  const TheViewport = useWindowScroll ? WindowViewport : Viewport
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

export const { Component: List, usePublisher, useEmitterValue, useEmitter } = systemToComponent(
  combinedSystem,
  {
    required: {},
    optional: {
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
