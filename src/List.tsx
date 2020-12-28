import { RefHandle, systemToComponent } from '@virtuoso.dev/react-urx'
import {
  compose,
  connect,
  getValue,
  map,
  pipe,
  prop,
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
} from '@virtuoso.dev/urx'
import * as React from 'react'
import { createElement, CSSProperties, FC } from 'react'
import useChangedChildSizes from './hooks/useChangedChildSizes'
import useScrollTop from './hooks/useScrollTop'
import useSize from './hooks/useSize'
import { Components, ComputeItemKey, GroupContent, HTMLProps } from './interfaces'
import { ListState } from './listStateSystem'
import { listSystem } from './listSystem'
import { positionStickyCssValue } from './utils/positionStickyCssValue'

export function identity<T>(value: T) {
  return value
}

const listComponentPropsSystem = system(() => {
  const itemContent = statefulStream<any>((index: number) => `Item ${index}`)
  const groupContent = statefulStream<GroupContent>((index: number) => `Group ${index}`)
  const components = statefulStream<Components>({})
  const computeItemKey = statefulStream<ComputeItemKey>(identity)
  const headerFooterTag = statefulStream('div')

  const distinctProp = <K extends keyof Components>(propName: K, defaultValue: Components[K] | null | 'div' = null) => {
    return statefulStreamFromEmitter(
      pipe(
        components,
        map(components => components[propName] as Components[K]),
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
    FooterComponent: distinctProp('Footer'),
    HeaderComponent: distinctProp('Header'),
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
  const itemContent = useEmitterValue('itemContent')
  const groupContent = useEmitterValue('groupContent')
  const trackItemSizes = useEmitterValue('trackItemSizes')

  const ref = useChangedChildSizes(sizeRanges, trackItemSizes)
  const EmptyPlaceholder = useEmitterValue('EmptyPlaceholder')
  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder') || DefaultScrollSeekPlaceholder
  const ListComponent = useEmitterValue('ListComponent')!
  const ItemComponent = useEmitterValue('ItemComponent')!
  const GroupComponent = useEmitterValue('GroupComponent')!
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const hasGroups = useEmitterValue('groupIndices').length > 0
  const paddingTopAddition = useEmitterValue('paddingTopAddition')

  const containerStyle: CSSProperties = showTopList
    ? {}
    : {
        paddingTop: (listState as ListState).offsetTop + paddingTopAddition,
        paddingBottom: (listState as ListState).offsetBottom,
        marginTop: deviation,
      }

  if (!showTopList && listState.items.length === 0 && EmptyPlaceholder) {
    return createElement(EmptyPlaceholder)
  }

  return createElement(
    ListComponent,
    { ref, style: containerStyle },
    (showTopList ? listState.topItems : listState.items).map(item => {
      const index = item.originalIndex!
      const key = computeItemKey(index)

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
          } as any,
          itemContent.apply(null, (hasGroups ? [item.index, item.groupIndex, item.data] : [item.index, item.data]) as any)
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
  const ref = useSize(el => headerHeight(el.offsetHeight))
  return Header ? createElement(headerFooterTag, { ref }, createElement(Header)) : null
})

const Footer: FC = React.memo(function VirtuosoFooter() {
  const Footer = useEmitterValue('FooterComponent')
  const footerHeight = usePublisher('footerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize(el => footerHeight(el.offsetHeight))
  return Footer ? createElement(headerFooterTag, { ref }, createElement(Footer)) : null
})

export interface Hooks {
  usePublisher: typeof usePublisher
  useEmitterValue: typeof useEmitterValue
  useEmitter: typeof useEmitter
}

export function buildScroller({ usePublisher, useEmitter, useEmitterValue }: Hooks) {
  const Scroller: FC<HTMLProps> = React.memo(function VirtuosoScroller({ style, children, ...props }) {
    const scrollTopCallback = usePublisher('scrollTop')
    const ScrollerComponent = useEmitterValue('ScrollerComponent')!
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(
      scrollTopCallback,
      smoothScrollTargetReached,
      ScrollerComponent
    )

    useEmitter('scrollTo', scrollToCallback)
    useEmitter('scrollBy', scrollByCallback)
    return createElement(
      ScrollerComponent,
      {
        ref: scrollerRef,
        style: { ...scrollerStyle, ...style },
        tabIndex: 0,
        ...props,
      },
      children
    )
  })
  return Scroller
}

const ListRoot: FC<HTMLProps> = React.memo(function VirtuosoRoot({ ...props }) {
  const viewportHeight = usePublisher('viewportHeight')
  const viewportRef = useSize(compose(viewportHeight, prop('offsetHeight')))
  const headerHeight = useEmitterValue('headerHeight')

  return (
    <Scroller {...props}>
      <div style={viewportStyle} ref={viewportRef}>
        <Header />
        <Items />
        <Footer />
      </div>
      <div style={{ ...topItemListStyle, marginTop: `${headerHeight}px` }}>
        <Items showTopList={true} />
      </div>
    </Scroller>
  )
})

export type ListHandle = RefHandle<typeof List>

export const { Component: List, usePublisher, useEmitterValue, useEmitter } = systemToComponent(
  combinedSystem,
  {
    required: {},
    optional: {
      firstItemIndex: 'firstItemIndex',
      itemContent: 'itemContent',
      groupContent: 'groupContent',
      overscan: 'overscan',
      totalCount: 'totalCount',
      topItemCount: 'topItemCount',
      initialTopMostItemIndex: 'initialTopMostItemIndex',
      components: 'components',
      groupCounts: 'groupCounts',
      computeItemKey: 'computeItemKey',
      defaultItemHeight: 'defaultItemHeight',
      fixedItemHeight: 'fixedItemHeight',
      scrollSeekConfiguration: 'scrollSeekConfiguration',
      followOutput: 'followOutput',
      headerFooterTag: 'headerFooterTag',
      data: 'data',
      initialItemCount: 'initialItemCount',
      initialScrollTop: 'initialScrollTop',
      alignToBottom: 'alignToBottom',

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
