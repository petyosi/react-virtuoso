import * as React from 'react'
import { Key, ComponentType, createElement, CSSProperties, FC, HTMLAttributes, ReactNode, Ref } from 'react'
import {
  withLatestFrom,
  pipe,
  stream,
  compose,
  system,
  prop,
  statefulStream,
  tup,
  subscribe,
  connect,
  Stream,
  map,
  publish,
  getValue,
} from '@virtuoso.dev/urx'
import { systemToComponent, RefHandle } from '@virtuoso.dev/react-urx'
import useChangedChildSizes from './hooks/useChangedChildSizes'
import useScrollTop from './hooks/useScrollTop'
import useSize from './hooks/useSize'
import { listSystem } from './listSystem'
import { ListState } from './listStateSystem'
import { positionStickyCssValue } from './utils/positionStickyCssValue'

export interface ItemContent {
  (index: number, data?: any): ReactNode
}

export interface GroupItemContent {
  (index: number, groupIndex: number, data?: any): ReactNode
}

export interface GroupContent {
  (index: number): ReactNode
}

export type HTMLProps = HTMLAttributes<HTMLDivElement>

interface ItemProps {
  'data-index': number
  'data-item-index': number
  'data-item-group-index'?: number
  'data-known-size': number
}

interface GroupProps {
  'data-index': number
  'data-item-index': number
  'data-known-size': number
}

export interface Components {
  /**
   * Set to render a component at the top of the list.
   *
   * The header remains above the top items and does not remain sticky.
   */
  Header?: ComponentType
  /**
   * Set to render a component at the bottom of the list.
   */
  Footer?: ComponentType
  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: ComponentType<ItemProps>
  /**
   * Set to customize the group item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Group?: ComponentType<GroupProps>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: ComponentType<HTMLProps & { ref: Ref<HTMLDivElement> }>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: ComponentType<{ ref: Ref<HTMLDivElement>; style: CSSProperties }>

  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: ComponentType

  /**
   * Set to render an item placeholder when the user scrolls fast.
   * See the `scrollSeek` property for more details.
   */
  ScrollSeekPlaceholder?: ComponentType<{ index: number; height: number }>
}

export interface ComputeItemKey {
  (index: number): Key
}

export function identity<T>(value: T) {
  return value
}

const listComponentPropsSystem = system(() => {
  const itemContent = statefulStream<any>((index: number) => `Item ${index}`)
  const groupContent = statefulStream<GroupContent>((index: number) => `Group ${index}`)
  const components = statefulStream<Components>({})
  const computeItemKey = statefulStream<ComputeItemKey>(identity)
  const headerFooterTag = statefulStream('div')
  return { itemContent, groupContent, components, computeItemKey, headerFooterTag }
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

export const Items = React.memo(({ showTopList = false }: { showTopList?: boolean }) => {
  const listState = useEmitterValue('listState')
  const sizeRanges = usePublisher('sizeRanges')
  const itemContent = useEmitterValue('itemContent')
  const groupContent = useEmitterValue('groupContent')
  const trackItemSizes = useEmitterValue('trackItemSizes')

  const ref = useChangedChildSizes(sizeRanges, trackItemSizes)
  const components = useEmitterValue('components')
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const { EmptyPlaceholder, ScrollSeekPlaceholder = DefaultScrollSeekPlaceholder, List = 'div' } = useEmitterValue('components')
  const hasGroups = useEmitterValue('groupIndices').length > 0

  const containerStyle: CSSProperties = showTopList
    ? {}
    : {
        paddingTop: (listState as ListState).offsetTop,
        paddingBottom: (listState as ListState).offsetBottom,
      }

  const itemElement = components.Item || 'div'
  const groupElement = components.Group || 'div'

  if (!showTopList && listState.items.length === 0 && EmptyPlaceholder) {
    return createElement(EmptyPlaceholder)
  }

  return createElement(
    List,
    { ref, style: containerStyle },
    (showTopList ? listState.topItems : listState.items).map(item => {
      const index = item.originalIndex!
      const key = computeItemKey(index)

      if (isSeeking) {
        return createElement(ScrollSeekPlaceholder, { key, index: item.index, height: item.size })
      }

      if (item.type === 'group') {
        return createElement(
          groupElement,
          {
            key,
            'data-index': index,
            'data-known-size': item.size,
            'data-item-index': item.index,
          } as any,
          groupContent(item.index)
        )
      } else {
        return createElement(
          itemElement,
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

const Header: FC = React.memo(() => {
  const components = useEmitterValue('components')
  const headerHeight = usePublisher('headerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize(el => headerHeight(el.offsetHeight))
  return components.Header ? createElement(headerFooterTag, { ref }, createElement(components.Header)) : null
})

const Footer: FC = React.memo(() => {
  const components = useEmitterValue('components')
  const footerHeight = usePublisher('footerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize(el => footerHeight(el.offsetHeight))
  return components.Footer ? createElement(headerFooterTag, { ref }, createElement(components.Footer)) : null
})

export interface Hooks {
  usePublisher: typeof usePublisher
  useEmitterValue: typeof useEmitterValue
  useEmitter: typeof useEmitter
}

export function buildScroller({ usePublisher, useEmitter, useEmitterValue }: Hooks) {
  const Scroller: FC<HTMLProps> = React.memo(({ style, children, ...props }) => {
    const scrollTopCallback = usePublisher('scrollTop')
    const scrollerElement = useEmitterValue('components').Scroller || 'div'
    const smoothScrollTargetReached = usePublisher('smoothScrollTargetReached')
    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(scrollTopCallback, smoothScrollTargetReached)

    useEmitter('scrollTo', scrollToCallback)
    useEmitter('scrollBy', scrollByCallback)
    return createElement(
      scrollerElement,
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

const ListRoot: FC<HTMLProps> = React.memo(({ ...props }) => {
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
      firstItemIndex: 'firstItemIndex',
      initialItemCount: 'initialItemCount',

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
