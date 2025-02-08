import React from 'react'

import { VirtuosoGridHandle, VirtuosoGridProps } from './component-interfaces/VirtuosoGrid'
import { gridSystem } from './gridSystem'
import useIsomorphicLayoutEffect from './hooks/useIsomorphicLayoutEffect'
import useSize from './hooks/useSize'
import useWindowViewportRectRef from './hooks/useWindowViewportRect'
import { GridComponents, GridComputeItemKey, GridItemContent, GridRootProps } from './interfaces'
import { Log, LogLevel } from './loggerSystem'
import { RefHandle, systemToComponent } from './react-urx'
import * as u from './urx'
import { VirtuosoGridMockContext } from './utils/context'
import { correctItemSize } from './utils/correctItemSize'
import { buildScroller, buildWindowScroller, contextPropIfNotDomElement, identity, viewportStyle } from './Virtuoso'

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

const GridItems: React.FC = /*#__PURE__*/ React.memo(function GridItems() {
  const gridState = useEmitterValue('gridState')
  const listClassName = useEmitterValue('listClassName')
  const itemClassName = useEmitterValue('itemClassName')
  const itemContent = useEmitterValue('itemContent')
  const computeItemKey = useEmitterValue('computeItemKey')
  const isSeeking = useEmitterValue('isSeeking')
  const scrollHeightCallback = usePublisher('scrollHeight')
  const ItemComponent = useEmitterValue('ItemComponent')!
  const ListComponent = useEmitterValue('ListComponent')!
  const ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder')!
  const context = useEmitterValue('context')
  const itemDimensions = usePublisher('itemDimensions')
  const gridGap = usePublisher('gap')
  const log = useEmitterValue('log')
  const stateRestoreInProgress = useEmitterValue('stateRestoreInProgress')
  const reportReadyState = usePublisher('reportReadyState')

  const listRef = useSize(
    React.useMemo(
      () => (el) => {
        const scrollHeight = el.parentElement!.parentElement!.scrollHeight
        scrollHeightCallback(scrollHeight)
        const firstItem = el.firstChild as HTMLElement
        if (firstItem) {
          const { height, width } = firstItem.getBoundingClientRect()
          itemDimensions({ height, width })
        }
        gridGap({
          column: resolveGapValue('column-gap', getComputedStyle(el).columnGap, log),
          row: resolveGapValue('row-gap', getComputedStyle(el).rowGap, log),
        })
      },
      [scrollHeightCallback, itemDimensions, gridGap, log]
    ),
    true,
    false
  )

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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-assignment
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
  return Header ? (
    <HeaderFooterTag ref={ref}>
      <Header {...contextPropIfNotDomElement(Header, context)} />
    </HeaderFooterTag>
  ) : null
})

const Footer: React.FC = React.memo(function VirtuosoGridFooter() {
  const Footer = useEmitterValue('FooterComponent')
  const footerHeight = usePublisher('footerHeight')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
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
  return Footer ? (
    <HeaderFooterTag ref={ref}>
      <Footer {...contextPropIfNotDomElement(Footer, context)} />
    </HeaderFooterTag>
  ) : null
})

const Viewport: React.FC<React.PropsWithChildren> = ({ children }) => {
  const ctx = React.useContext(VirtuosoGridMockContext)
  const itemDimensions = usePublisher('itemDimensions')
  const viewportDimensions = usePublisher('viewportDimensions')

  const viewportRef = useSize(
    React.useMemo(
      () => (el: HTMLElement) => {
        viewportDimensions(el.getBoundingClientRect())
      },
      [viewportDimensions]
    ),
    true,
    false
  )

  React.useEffect(() => {
    if (ctx) {
      viewportDimensions({ height: ctx.viewportHeight, width: ctx.viewportWidth })
      itemDimensions({ height: ctx.itemHeight, width: ctx.itemWidth })
    }
  }, [ctx, viewportDimensions, itemDimensions])

  return (
    <div ref={viewportRef} style={viewportStyle(false)}>
      {children}
    </div>
  )
}

const WindowViewport: React.FC<React.PropsWithChildren> = ({ children }) => {
  const ctx = React.useContext(VirtuosoGridMockContext)
  const windowViewportRect = usePublisher('windowViewportRect')
  const itemDimensions = usePublisher('itemDimensions')
  const customScrollParent = useEmitterValue('customScrollParent')
  const viewportRef = useWindowViewportRectRef(windowViewportRect, customScrollParent, false)

  React.useEffect(() => {
    if (ctx) {
      itemDimensions({ height: ctx.itemHeight, width: ctx.itemWidth })
      windowViewportRect({ offsetTop: 0, visibleHeight: ctx.viewportHeight, visibleWidth: ctx.viewportWidth })
    }
  }, [ctx, windowViewportRect, itemDimensions])

  return (
    <div ref={viewportRef} style={viewportStyle(false)}>
      {children}
    </div>
  )
}

const GridRoot: React.FC<GridRootProps> = /*#__PURE__*/ React.memo(function GridRoot({ ...props }) {
  const useWindowScroll = useEmitterValue('useWindowScroll')
  const customScrollParent = useEmitterValue('customScrollParent')
  const TheScroller = customScrollParent || useWindowScroll ? WindowScroller : Scroller
  const TheViewport = customScrollParent || useWindowScroll ? WindowViewport : Viewport
  const context = useEmitterValue('context')

  return (
    <TheScroller {...props} {...contextPropIfNotDomElement(TheScroller, context)}>
      <TheViewport>
        <Header />
        <GridItems />
        <Footer />
      </TheViewport>
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
    events: {
      atBottomStateChange: 'atBottomStateChange',
      atTopStateChange: 'atTopStateChange',
      endReached: 'endReached',
      isScrolling: 'isScrolling',
      rangeChanged: 'rangeChanged',
      readyStateChanged: 'readyStateChanged',
      startReached: 'startReached',
      stateChanged: 'stateChanged',
    },
    methods: {
      scrollBy: 'scrollBy',
      scrollTo: 'scrollTo',
      scrollToIndex: 'scrollToIndex',
    },
    optional: {
      components: 'components',
      computeItemKey: 'computeItemKey',
      context: 'context',
      customScrollParent: 'customScrollParent',
      data: 'data',
      headerFooterTag: 'headerFooterTag',
      increaseViewportBy: 'increaseViewportBy',
      initialItemCount: 'initialItemCount',
      initialTopMostItemIndex: 'initialTopMostItemIndex',
      itemClassName: 'itemClassName',
      itemContent: 'itemContent',
      listClassName: 'listClassName',
      logLevel: 'logLevel',
      overscan: 'overscan',
      restoreStateFrom: 'restoreStateFrom',
      scrollerRef: 'scrollerRef',
      scrollSeekConfiguration: 'scrollSeekConfiguration',
      totalCount: 'totalCount',
      useWindowScroll: 'useWindowScroll',
    },
  },
  GridRoot
)

export type GridHandle = RefHandle<typeof Grid>

const Scroller = /*#__PURE__*/ buildScroller({ useEmitter, useEmitterValue, usePublisher })
const WindowScroller = /*#__PURE__*/ buildWindowScroller({ useEmitter, useEmitterValue, usePublisher })

function resolveGapValue(property: string, value: string | undefined, log: Log) {
  if (value !== 'normal' && !value?.endsWith('px')) {
    log(`${property} was not resolved to pixel value correctly`, value, LogLevel.WARN)
  }
  if (value === 'normal') {
    return 0
  }
  return parseInt(value ?? '0', 10)
}

export const VirtuosoGrid = Grid as <ItemData = any, Context = any>(
  props: VirtuosoGridProps<ItemData, Context> & { ref?: React.Ref<VirtuosoGridHandle> }
) => React.ReactElement
