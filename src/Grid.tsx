import { RefHandle, systemToComponent } from '@virtuoso.dev/react-urx'
import * as u from '@virtuoso.dev/urx'
import * as React from 'react'
import { createElement, FC } from 'react'
import { gridSystem } from './gridSystem'
import useSize from './hooks/useSize'
import { ComputeItemKey, GridComponents, GridItemContent, GridRootProps } from './interfaces'
import { addDeprecatedAlias, buildScroller, identity, viewportStyle } from './List'

const gridComponentPropsSystem = u.system(() => {
  const itemContent = u.statefulStream<GridItemContent>((index) => `Item ${index}`)
  const components = u.statefulStream<GridComponents>({})
  const itemClassName = u.statefulStream('virtuoso-grid-item')
  const listClassName = u.statefulStream('virtuoso-grid-list')
  const computeItemKey = u.statefulStream<ComputeItemKey>(identity)
  const scrollerRef = u.statefulStream<(ref: HTMLElement | null) => void>(u.noop)

  const distinctProp = <K extends keyof GridComponents>(propName: K, defaultValue: GridComponents[K] | null | 'div' = null) => {
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
    itemContent,
    components,
    computeItemKey,
    itemClassName,
    listClassName,
    scrollerRef,
    ListComponent: distinctProp('List', 'div'),
    ItemComponent: distinctProp('Item', 'div'),
    ScrollerComponent: distinctProp('Scroller', 'div'),
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder', 'div'),
  }
})

const combinedSystem = u.system(([gridSystem, gridComponentPropsSystem]) => {
  const deprecatedProps = {
    item: addDeprecatedAlias(gridComponentPropsSystem.itemContent, 'Rename the %citem%c prop to %citemContent.'),
    ItemContainer: u.stream<any>(),
    ScrollContainer: u.stream<any>(),
    ListContainer: u.stream<any>(),
    emptyComponent: u.stream<any>(),
    scrollSeek: u.stream<any>(),
  }

  function deprecateComponentProp(stream: u.Stream<any>, componentName: string, propName: string) {
    u.connect(
      u.pipe(
        stream,
        u.withLatestFrom(gridComponentPropsSystem.components),
        u.map(([comp, components]) => {
          console.warn(`react-virtuoso: ${propName} property is deprecated. Pass components.${componentName} instead.`)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          return { ...components, [componentName]: comp }
        })
      ),
      gridComponentPropsSystem.components
    )
  }

  u.subscribe(deprecatedProps.scrollSeek, ({ placeholder, ...config }) => {
    console.warn(
      `react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead.`
    )
    u.publish(gridComponentPropsSystem.components, {
      ...u.getValue(gridComponentPropsSystem.components),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ScrollSeekPlaceholder: placeholder,
    })
    u.publish(gridSystem.scrollSeekConfiguration, config)
  })

  deprecateComponentProp(deprecatedProps.ItemContainer, 'Item', 'ItemContainer')
  deprecateComponentProp(deprecatedProps.ListContainer, 'List', 'ListContainer')
  deprecateComponentProp(deprecatedProps.ScrollContainer, 'Scroller', 'ScrollContainer')

  return { ...gridSystem, ...gridComponentPropsSystem, ...deprecatedProps }
}, u.tup(gridSystem, gridComponentPropsSystem))

const GridItems: FC = React.memo(function GridItems() {
  const gridState = useEmitterValue('gridState')
  const listClassName = useEmitterValue('listClassName')
  const itemClassName = useEmitterValue('itemClassName')
  const itemContent = useEmitterValue('itemContent')
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const ItemComponent = useEmitterValue('ItemComponent')!
  const ListComponent = useEmitterValue('ListComponent')!
  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder')!

  const itemDimensions = usePublisher('itemDimensions')

  const listRef = useSize((el) => {
    const firstItem = el.firstChild as HTMLElement
    if (firstItem) {
      itemDimensions({
        width: firstItem.offsetWidth,
        height: firstItem.offsetHeight,
      })
    }
  })

  return createElement(
    ListComponent,
    { ref: listRef, className: listClassName, style: { paddingTop: gridState.offsetTop, paddingBottom: gridState.offsetBottom } },
    gridState.items.map((item) => {
      const key = computeItemKey(item.index)
      return isSeeking
        ? createElement(ScrollSeekPlaceholder, { key, style: { height: gridState.itemHeight, width: gridState.itemWidth } })
        : createElement(ItemComponent, { className: itemClassName, 'data-index': item.index, key }, itemContent(item.index))
    })
  )
})

const GridRoot: FC<GridRootProps> = React.memo(function GridRoot({ ...props }) {
  const viewportDimensions = usePublisher('viewportDimensions')

  const viewportRef = useSize((el) => {
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

const { Component: Grid, usePublisher, useEmitterValue, useEmitter } = systemToComponent(
  combinedSystem,
  {
    optional: {
      totalCount: 'totalCount',
      overscan: 'overscan',
      itemContent: 'itemContent',
      components: 'components',
      computeItemKey: 'computeItemKey',
      initialItemCount: 'initialItemCount',
      scrollSeekConfiguration: 'scrollSeekConfiguration',
      listClassName: 'listClassName',
      itemClassName: 'itemClassName',

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

export type foo<T> = T extends React.ForwardRefExoticComponent<React.RefAttributes<infer Handle>> ? Handle : never

export type GridHandle = RefHandle<typeof Grid>
export { Grid }

const Scroller = buildScroller({ usePublisher, useEmitterValue, useEmitter })
