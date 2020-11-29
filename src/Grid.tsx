import { RefHandle, systemToComponent } from '@virtuoso.dev/react-urx'
import {
  map,
  statefulStream,
  subscribe,
  getValue,
  publish,
  system,
  tup,
  stream,
  Stream,
  connect,
  pipe,
  withLatestFrom,
} from '@virtuoso.dev/urx'
import * as React from 'react'
import { createElement, ComponentType, CSSProperties, FC, ReactNode, Ref } from 'react'
import { gridSystem } from './gridSystem'
import useSize from './hooks/useSize'
import { buildScroller, ComputeItemKey, HTMLProps, identity, viewportStyle, addDeprecatedAlias } from './List'

export interface GridComponents {
  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: ComponentType

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: ComponentType<HTMLProps & { ref: Ref<HTMLDivElement> }>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: ComponentType<{ style: CSSProperties }>

  /**
   * Set to render an item placeholder when the user scrolls fast.
   * See the `scrollSeekConfiguration` property for more details.
   */
  ScrollSeekPlaceholder?: ComponentType<{ index: number; height: number }>
}

export interface GridItemContent {
  (index: number): ReactNode
}

const DefaultScrollSeekPlaceholder = ({ style }: { style: CSSProperties }) => <div style={style}></div>

const gridComponentPropsSystem = system(() => {
  const itemContent = statefulStream<GridItemContent>(index => `Item ${index}`)
  const components = statefulStream<GridComponents>({})
  const itemClassName = statefulStream('virtuoso-grid-item')
  const listClassName = statefulStream('virtuoso-grid-list')
  const computeItemKey = statefulStream<ComputeItemKey>(identity)

  return { itemContent, components, computeItemKey, itemClassName, listClassName }
})

const combinedSystem = system(([gridSystem, gridComponentPropsSystem]) => {
  const deprecatedProps = {
    item: addDeprecatedAlias(gridComponentPropsSystem.itemContent, 'Rename the %citem%c prop to %citemContent.'),
    ItemContainer: stream<any>(),
    ScrollContainer: stream<any>(),
    ListContainer: stream<any>(),
    emptyComponent: stream<any>(),
    scrollSeek: stream<any>(),
  }

  function deprecateComponentProp(stream: Stream<any>, componentName: string, propName: string) {
    connect(
      pipe(
        stream,
        withLatestFrom(gridComponentPropsSystem.components),
        map(([comp, components]) => {
          console.warn(`react-virtuoso: ${propName} property is deprecated. Pass components.${componentName} instead.`)
          return { ...components, [componentName]: comp }
        })
      ),
      gridComponentPropsSystem.components
    )
  }

  subscribe(deprecatedProps.scrollSeek, ({ placeholder, ...config }) => {
    console.warn(
      `react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead.`
    )
    publish(gridComponentPropsSystem.components, { ...getValue(gridComponentPropsSystem.components), ScrollSeekPlaceholder: placeholder })
    publish(gridSystem.scrollSeekConfiguration, config)
  })

  deprecateComponentProp(deprecatedProps.ItemContainer, 'Item', 'ItemContainer')
  deprecateComponentProp(deprecatedProps.ListContainer, 'List', 'ListContainer')
  deprecateComponentProp(deprecatedProps.ScrollContainer, 'Scroller', 'ScrollContainer')

  return { ...gridSystem, ...gridComponentPropsSystem, ...deprecatedProps }
}, tup(gridSystem, gridComponentPropsSystem))

const GridItems: FC = React.memo(function GridItems() {
  const gridState = useEmitterValue('gridState')
  const listClassName = useEmitterValue('listClassName')
  const itemClassName = useEmitterValue('itemClassName')
  const itemContent = useEmitterValue('itemContent')
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const { Item = 'div', List = 'div', ScrollSeekPlaceholder = DefaultScrollSeekPlaceholder } = useEmitterValue('components')

  const itemDimensions = usePublisher('itemDimensions')

  const listRef = useSize(el => {
    const firstItem = el.firstChild as HTMLElement
    if (firstItem) {
      itemDimensions({
        width: firstItem.offsetWidth,
        height: firstItem.offsetHeight,
      })
    }
  })

  return createElement(
    List,
    { ref: listRef, className: listClassName, style: { paddingTop: gridState.offsetTop, paddingBottom: gridState.offsetBottom } },
    gridState.items.map(item => {
      const key = computeItemKey(item.index)
      return isSeeking
        ? createElement(ScrollSeekPlaceholder, { key, style: { height: gridState.itemHeight, width: gridState.itemWidth } })
        : createElement(Item, { className: itemClassName, 'data-index': item.index, key }, itemContent(item.index))
    })
  )
})

const GridRoot: FC<HTMLProps> = React.memo(function GridRoot({ ...props }) {
  const viewportDimensions = usePublisher('viewportDimensions')

  const viewportRef = useSize(el => {
    viewportDimensions({
      width: el.offsetWidth,
      height: el.offsetHeight,
    })
  })

  return (
    <Scroller {...props}>
      <div style={viewportStyle} ref={viewportRef}>
        <GridItems />
      </div>
    </Scroller>
  )
})

export type GridHandle = RefHandle<typeof Grid>

const { Component: Grid, usePublisher, useEmitterValue, useEmitter } = systemToComponent(
  combinedSystem,
  {
    required: {
      totalCount: 'totalCount',
    },
    optional: {
      overscan: 'overscan',
      itemContent: 'itemContent',
      components: 'components',
      computeItemKey: 'computeItemKey',
      initialItemCount: 'initialItemCount',
      scrollSeekConfiguration: 'scrollSeekConfiguration',

      // deprecated
      item: 'item',
      ItemContainer: 'ItemContainer',
      ScrollContainer: 'ScrollContainer',
      ListContainer: 'ListContainer',
      scrollSeek: 'scrollSeek',
    },
    methods: {
      scrollTo: 'scrollTo',
      scrollBy: 'scrollBy',
      scrollToIndex: 'scrollToIndex',
    },
    events: {
      isScrolling: 'isScrolling',
      endReached: 'endReached',
      startReached: 'startReached',
      rangeChanged: 'rangeChanged',
      atBottomStateChange: 'atBottomStateChange',
      atTopStateChange: 'atTopStateChange',
    },
  },
  GridRoot
)

export { Grid }

const Scroller = buildScroller({ usePublisher, useEmitterValue, useEmitter })
