import { RefHandle, systemToComponent } from './react-urx'

import * as u from './urx'
import React from 'react'
import { gridSystem } from './gridSystem'
import useSize from './hooks/useSize'
import useWindowViewportRectRef from './hooks/useWindowViewportRect'
import { GridComponents, GridComputeItemKey, GridItemContent, GridRootProps } from './interfaces'
import { buildScroller, buildWindowScroller, contextPropIfNotDomElement, identity, viewportStyle } from './Virtuoso'
import { Log, LogLevel } from './loggerSystem'
import { VirtuosoGridHandle, VirtuosoGridProps } from './component-interfaces/VirtuosoGrid'
import { correctItemSize } from './utils/correctItemSize'
import { VirtuosoGridMockContext } from './utils/context'

const gridComponentPropsSystem = /*#__PURE__*/ u.system(() => {
  const itemContent = u.statefulStream<GridItemContent<any, any>>((index) => `Item ${index}`)
  const components = u.statefulStream<GridComponents>({})
  const context = u.statefulStream<unknown>(null)
  const itemClassName = u.statefulStream('virtuoso-grid-item')
  const listClassName = u.statefulStream('virtuoso-grid-list')
  const computeItemKey = u.statefulStream<GridComputeItemKey<any, any>>(identity)
  const headerFooterTag = u.statefulStream('div')
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
    context,
    itemContent,
    components,
    computeItemKey,
    itemClassName,
    listClassName,
    headerFooterTag,
    scrollerRef,
    FooterComponent: distinctProp('Footer'),
    HeaderComponent: distinctProp('Header'),
    ListComponent: distinctProp('List', 'div'),
    ItemComponent: distinctProp('Item', 'div'),
    ScrollerComponent: distinctProp('Scroller', 'div'),
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder', 'div'),
  }
})

const combinedSystem = /*#__PURE__*/ u.system(([gridSystem, gridComponentPropsSystem]) => {
  return { ...gridSystem, ...gridComponentPropsSystem }
}, u.tup(gridSystem, gridComponentPropsSystem))

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

  const listRef = useSize((el) => {
    const scrollHeight = el.parentElement!.parentElement!.scrollHeight
    scrollHeightCallback(scrollHeight)
    const firstItem = el.firstChild as HTMLElement
    if (firstItem) {
      const { width, height } = firstItem.getBoundingClientRect()
      itemDimensions({ width, height })
    }
    gridGap({
      row: resolveGapValue('row-gap', getComputedStyle(el).rowGap, log),
      column: resolveGapValue('column-gap', getComputedStyle(el).columnGap, log),
    })
  })

  if (stateRestoreInProgress) {
    return null
  }

  //   console.log('rendering items', gridState.items)

  return React.createElement(
    ListComponent,
    {
      ref: listRef,
      className: listClassName,
      ...contextPropIfNotDomElement(ListComponent, context),
      style: { paddingTop: gridState.offsetTop, paddingBottom: gridState.offsetBottom },
      'data-test-id': 'virtuoso-item-list',
    },
    gridState.items.map((item) => {
      const key = computeItemKey(item.index, item.data, context)
      return isSeeking
        ? React.createElement(ScrollSeekPlaceholder, {
            key,
            ...contextPropIfNotDomElement(ScrollSeekPlaceholder, context),
            index: item.index,
            height: gridState.itemHeight,
            width: gridState.itemWidth,
          })
        : React.createElement(
            ItemComponent,
            { ...contextPropIfNotDomElement(ItemComponent, context), className: itemClassName, 'data-index': item.index, key },
            itemContent(item.index, item.data, context)
          )
    })
  )
})

const Header: React.FC = React.memo(function VirtuosoHeader() {
  const Header = useEmitterValue('HeaderComponent')
  const headerHeight = usePublisher('headerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize((el) => headerHeight(correctItemSize(el, 'height')))
  const context = useEmitterValue('context')
  return Header
    ? React.createElement(headerFooterTag, { ref }, React.createElement(Header, contextPropIfNotDomElement(Header, context)))
    : null
})

const Footer: React.FC = React.memo(function VirtuosoGridFooter() {
  const Footer = useEmitterValue('FooterComponent')
  const footerHeight = usePublisher('footerHeight')
  const headerFooterTag = useEmitterValue('headerFooterTag')
  const ref = useSize((el) => footerHeight(correctItemSize(el, 'height')))
  const context = useEmitterValue('context')
  return Footer
    ? React.createElement(headerFooterTag, { ref }, React.createElement(Footer, contextPropIfNotDomElement(Footer, context)))
    : null
})

const Viewport: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const ctx = React.useContext(VirtuosoGridMockContext)
  const itemDimensions = usePublisher('itemDimensions')
  const viewportDimensions = usePublisher('viewportDimensions')

  const viewportRef = useSize((el) => {
    viewportDimensions(el.getBoundingClientRect())
  })

  React.useEffect(() => {
    if (ctx) {
      viewportDimensions({ height: ctx.viewportHeight, width: ctx.viewportWidth })
      itemDimensions({ height: ctx.itemHeight, width: ctx.itemWidth })
    }
  }, [ctx, viewportDimensions, itemDimensions])

  return (
    <div style={viewportStyle(false)} ref={viewportRef}>
      {children}
    </div>
  )
}

const WindowViewport: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const ctx = React.useContext(VirtuosoGridMockContext)
  const windowViewportRect = usePublisher('windowViewportRect')
  const itemDimensions = usePublisher('itemDimensions')
  const customScrollParent = useEmitterValue('customScrollParent')
  const viewportRef = useWindowViewportRectRef(windowViewportRect, customScrollParent)

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

  return (
    <TheScroller {...props}>
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
  usePublisher,
  useEmitterValue,
  useEmitter,
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
    },
  },
  GridRoot
)

export type GridHandle = RefHandle<typeof Grid>

const Scroller = /*#__PURE__*/ buildScroller({ usePublisher, useEmitterValue, useEmitter })
const WindowScroller = /*#__PURE__*/ buildWindowScroller({ usePublisher, useEmitterValue, useEmitter })

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
