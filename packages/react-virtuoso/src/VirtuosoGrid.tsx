import React from 'react'

import { gridSystem } from './gridSystem'
import useGridMeasurement from './hooks/useGridMeasurement'
import useIsomorphicLayoutEffect from './hooks/useIsomorphicLayoutEffect'
import useSize from './hooks/useSize'
import { systemToComponent } from './react-urx'
import * as u from './urx'
import { VirtuosoGridMockContext } from './utils/context'
import { correctItemSize } from './utils/correctItemSize'
import { buildScroller, buildWindowScroller, contextPropIfNotDomElement, identity, viewportStyle, windowViewportStyle } from './Virtuoso'

import type { VirtuosoGridHandle, VirtuosoGridProps } from './component-interfaces/VirtuosoGrid'
import type { GridComponents, GridComputeItemKey, GridItemContent, GridRootProps } from './interfaces'

const gridComponentPropsSystem = /*#__PURE__*/ u.system(() => {
  const itemContent = u.statefulStream<GridItemContent<any, any>>((index) => `Item ${index}`)
  const components = u.statefulStream<GridComponents>({})
  const context = u.statefulStream<unknown>(null)
  const itemClassName = u.statefulStream('virtuoso-grid-item')
  const listClassName = u.statefulStream('virtuoso-grid-list')
  const computeItemKey = u.statefulStream<GridComputeItemKey<any, any>>(identity)
  const headerFooterTag = u.statefulStream('div')
  const scrollerRef = u.statefulStream<(ref: HTMLElement | null) => void>(u.noop)

  const distinctProp = <K extends keyof GridComponents>(propName: K, defaultValue: 'div' | GridComponents[K] | null = null) => {
    return u.statefulStreamFromEmitter(
      u.pipe(
        components,
        u.map((components) => components[propName]),
        u.distinctUntilChanged()
      ),
      defaultValue
    )
  }

  const readyStateChanged = u.statefulStream(false)

  const reportReadyState = u.statefulStream(false)
  u.connect(u.duc(reportReadyState), readyStateChanged)

  return {
    components,
    computeItemKey,
    context,
    FooterComponent: distinctProp('Footer'),
    HeaderComponent: distinctProp('Header'),
    headerFooterTag,
    itemClassName,
    ItemComponent: distinctProp('Item', 'div'),
    itemContent,
    listClassName,
    ListComponent: distinctProp('List', 'div'),
    readyStateChanged,
    reportReadyState,
    ScrollerComponent: distinctProp('Scroller', 'div'),
    scrollerRef,
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder', 'div'),
  }
})

const combinedSystem = /*#__PURE__*/ u.system(
  ([gridSystem, gridComponentPropsSystem]) => {
    return { ...gridSystem, ...gridComponentPropsSystem }
  },
  u.tup(gridSystem, gridComponentPropsSystem)
)

const GridListRefContext = React.createContext<{ listRef: React.RefCallback<HTMLElement>; observeItem: () => void }>({
  listRef: u.noop,
  observeItem: u.noop,
})

const GridItems: React.FC = /*#__PURE__*/ React.memo(function GridItems() {
  const gridState = useEmitterValue('gridState')
  const listClassName = useEmitterValue('listClassName')
  const itemClassName = useEmitterValue('itemClassName')
  const itemContent = useEmitterValue('itemContent')
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const ItemComponent = useEmitterValue('ItemComponent')!
  const ListComponent = useEmitterValue('ListComponent')!
  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder')!
  const context = useEmitterValue('context')
  const stateRestoreInProgress = useEmitterValue('stateRestoreInProgress')
  const reportReadyState = usePublisher('reportReadyState')
  const { listRef, observeItem } = React.useContext(GridListRefContext)
  useIsomorphicLayoutEffect(observeItem)

  useIsomorphicLayoutEffect(() => {
    if (gridState.itemHeight > 0 && gridState.itemWidth > 0) {
      reportReadyState(true)
    }
  }, [gridState])

  if (stateRestoreInProgress) {
    return null
  }

  return (
    <ListComponent
      className={listClassName}
      ref={listRef}
      {...contextPropIfNotDomElement(ListComponent, context)}
      data-testid="virtuoso-item-list"
      style={{ paddingBottom: gridState.offsetBottom, paddingTop: gridState.offsetTop }}
    >
      {gridState.items.map((item) => {
        const key = computeItemKey(item.index, item.data, context)
        return isSeeking ? (
          <ScrollSeekPlaceholder
            key={key}
            {...contextPropIfNotDomElement(ScrollSeekPlaceholder, context)}
            height={gridState.itemHeight}
            index={item.index}
            width={gridState.itemWidth}
          />
        ) : (
          <ItemComponent
            {...contextPropIfNotDomElement(ItemComponent, context)}
            className={itemClassName}
            data-index={item.index}
            key={key}
          >
            {itemContent(item.index, item.data, context)}
          </ItemComponent>
        )
      })}
    </ListComponent>
  )
})

const Header: React.FC = React.memo(function VirtuosoHeader() {
  const Header = useEmitterValue('HeaderComponent')
  const headerHeight = usePublisher('headerHeight')
  const HeaderFooterTag = useEmitterValue('headerFooterTag') as any
  const ref = useSize(
    React.useMemo(
      () => (el) => {
        headerHeight(correctItemSize(el, 'height'))
      },
      [headerHeight]
    ),
    true,
    false
  )
  const context = useEmitterValue('context')
  return Header !== null && Header !== undefined ? (
    <HeaderFooterTag ref={ref}>
      <Header {...contextPropIfNotDomElement(Header, context)} />
    </HeaderFooterTag>
  ) : null
})

const Footer: React.FC = React.memo(function VirtuosoGridFooter() {
  const Footer = useEmitterValue('FooterComponent')
  const footerHeight = usePublisher('footerHeight')
  const HeaderFooterTag = useEmitterValue('headerFooterTag') as any
  const ref = useSize(
    React.useMemo(
      () => (el) => {
        footerHeight(correctItemSize(el, 'height'))
      },
      [footerHeight]
    ),
    true,
    false
  )
  const context = useEmitterValue('context')
  return Footer !== null && Footer !== undefined ? (
    <HeaderFooterTag ref={ref}>
      <Footer {...contextPropIfNotDomElement(Footer, context)} />
    </HeaderFooterTag>
  ) : null
})

const GridViewport: React.FC<React.PropsWithChildren> = ({ children }) => {
  const ctx = React.useContext(VirtuosoGridMockContext)
  const gridMeasurement = usePublisher('gridMeasurement')
  const windowViewportRect = usePublisher('windowViewportRect')
  const customScrollParent = useEmitterValue('customScrollParent')
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const stateRestoreInProgress = useEmitterValue('stateRestoreInProgress')
  const { listRef, viewportRef, observeItem } = useGridMeasurement({
    customScrollParent,
    enabled: !ctx && !stateRestoreInProgress,
    log: useEmitterValue('log'),
    onMeasurement: gridMeasurement,
    onScrollHeight: usePublisher('scrollHeight'),
    onWindowViewport: windowViewportRect,
    skipAnimationFrame: useEmitterValue('skipAnimationFrameInResizeObserver'),
    useWindowScroll,
  })

  const listContext = React.useMemo(() => ({ listRef, observeItem }), [listRef, observeItem])

  React.useEffect(() => {
    if (ctx) {
      gridMeasurement({
        viewport: { height: ctx.viewportHeight, width: ctx.viewportWidth },
        item: { height: ctx.itemHeight, width: ctx.itemWidth },
        gap: { column: 0, row: 0 },
      })
      if (useWindowScroll || customScrollParent) {
        windowViewportRect({ listHeight: 0, offsetTop: 0, visibleHeight: ctx.viewportHeight, visibleWidth: ctx.viewportWidth })
      }
    }
  }, [ctx, gridMeasurement, windowViewportRect, useWindowScroll, customScrollParent])

  return (
    <div
      ref={viewportRef}
      style={customScrollParent || useWindowScroll ? windowViewportStyle(false, useWindowScroll) : viewportStyle(false)}
    >
      <GridListRefContext.Provider value={listContext}>{children}</GridListRefContext.Provider>
    </div>
  )
}

const GridRoot: React.FC<GridRootProps> = /*#__PURE__*/ React.memo(function GridRoot({ ...props }) {
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const customScrollParent = useEmitterValue('customScrollParent')
  const TheScroller = customScrollParent || useWindowScroll ? WindowScroller : Scroller
  const context = useEmitterValue('context')

  return (
    <TheScroller {...props} {...contextPropIfNotDomElement(TheScroller, context)}>
      <GridViewport>
        <Header />
        <GridItems />
        <Footer />
      </GridViewport>
    </TheScroller>
  )
})

const {
  Component: Grid,
  useEmitter,
  useEmitterValue,
  usePublisher,
} = /*#__PURE__*/ systemToComponent(
  combinedSystem,
  {
    optional: {
      context: 'context',
      totalCount: 'totalCount',
      overscan: 'overscan',
      itemContent: 'itemContent',
      components: 'components',
      computeItemKey: 'computeItemKey',
      data: 'data',
      initialItemCount: 'initialItemCount',
      scrollSeekConfiguration: 'scrollSeekConfiguration',
      headerFooterTag: 'headerFooterTag',
      listClassName: 'listClassName',
      itemClassName: 'itemClassName',
      useWindowScroll: 'useWindowScroll',
      customScrollParent: 'customScrollParent',
      scrollerRef: 'scrollerRef',
      logLevel: 'logLevel',
      restoreStateFrom: 'restoreStateFrom',
      initialTopMostItemIndex: 'initialTopMostItemIndex',
      increaseViewportBy: 'increaseViewportBy',
      skipAnimationFrameInResizeObserver: 'skipAnimationFrameInResizeObserver',
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
      stateChanged: 'stateChanged',
      readyStateChanged: 'readyStateChanged',
    },
  },
  GridRoot
)

const Scroller = /*#__PURE__*/ buildScroller({ useEmitter, useEmitterValue, usePublisher })
const WindowScroller = /*#__PURE__*/ buildWindowScroller({ useEmitter, useEmitterValue, usePublisher })

/**
 * A virtualized grid component for efficiently rendering large datasets in a grid/masonry layout.
 * Automatically calculates visible items based on container and item dimensions.
 *
 * @typeParam ItemData - The type of data items in the grid
 * @typeParam Context - The type of additional context passed to callbacks
 *
 * @param props - {@link VirtuosoGridProps}
 *
 * @function
 * @group VirtuosoGrid
 *
 * @example
 * ```tsx
 * <VirtuosoGrid
 *   totalCount={1000}
 *   itemContent={(index) => <div className="grid-item">Item {index}</div>}
 *   listClassName="grid-container"
 * />
 * ```
 *
 * @see {@link VirtuosoGridProps} for available props
 * @see {@link VirtuosoGridHandle} for imperative methods
 * @see {@link GridComponents} for customizing grid elements
 */
export const VirtuosoGrid = Grid as unknown as <ItemData = any, Context = any>(
  props: VirtuosoGridProps<ItemData, Context> & { ref?: React.Ref<VirtuosoGridHandle> }
) => React.ReactElement
