import * as u from '@virtuoso.dev/urx'
import { rangeComparator, tupleComparator } from './comparators'
import { domIOSystem } from './domIOSystem'
import { propsReadySystem } from './propsReadySystem'
import { scrollSeekSystem } from './scrollSeekSystem'
import { IndexLocation, normalizeIndexLocation } from './scrollToIndexSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { windowScrollerSystem } from './windowScrollerSystem'

export interface ElementDimensions {
  width: number
  height: number
}

export interface GridItem {
  index: number
}

export interface GridLayout {
  top: number
  bottom: number
}

export interface GridState extends GridLayout {
  items: GridItem[]
  offsetTop: number
  offsetBottom: number
  itemHeight: number
  itemWidth: number
}

const INITIAL_GRID_STATE: GridState = {
  items: [],
  offsetBottom: 0,
  offsetTop: 0,
  top: 0,
  bottom: 0,
  itemHeight: 0,
  itemWidth: 0,
}

const PROBE_GRID_STATE: GridState = {
  items: [{ index: 0 }],
  offsetBottom: 0,
  offsetTop: 0,
  top: 0,
  bottom: 0,
  itemHeight: 0,
  itemWidth: 0,
}

const { ceil, floor, min, max } = Math

function hackFloor(val: number) {
  return ceil(val) - val < 0.03 ? ceil(val) : floor(val)
}

function buildItems(startIndex: number, endIndex: number) {
  return Array.from({ length: endIndex - startIndex + 1 }).map((_, i) => ({ index: i + startIndex } as GridItem))
}
export const gridSystem = u.system(
  ([
    { overscan, visibleRange, listBoundary },
    { scrollTop, viewportHeight, scrollBy, scrollTo, smoothScrollTargetReached },
    stateFlags,
    scrollSeek,
    { propsReady, didMount },
    { windowViewportRect, windowScrollTo, useWindowScroll, windowScrollTop },
  ]) => {
    const totalCount = u.statefulStream(0)
    const initialItemCount = u.statefulStream(0)
    const gridState = u.statefulStream(INITIAL_GRID_STATE)
    const viewportDimensions = u.statefulStream<ElementDimensions>({ height: 0, width: 0 })
    const itemDimensions = u.statefulStream<ElementDimensions>({ height: 0, width: 0 })
    const scrollToIndex = u.stream<IndexLocation>()

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialItemCount),
        u.filter(([, count]) => count !== 0),
        u.map(([, count]) => {
          return {
            items: buildItems(0, count - 1),
            top: 0,
            bottom: 0,
            offsetBottom: 0,
            offsetTop: 0,
            itemHeight: 0,
            itemWidth: 0,
          }
        })
      ),
      gridState
    )

    u.connect(
      u.pipe(
        u.combineLatest(
          u.duc(totalCount),
          visibleRange,
          u.duc(itemDimensions, (prev, next) => prev && prev.width === next.width && prev.height === next.height)
        ),
        u.withLatestFrom(viewportDimensions),
        u.map(([[totalCount, [startOffset, endOffset], item], viewport]) => {
          const { height: itemHeight, width: itemWidth } = item
          const { width: viewportWidth } = viewport

          if (totalCount === 0 || viewportWidth === 0) {
            return INITIAL_GRID_STATE
          }

          if (itemWidth === 0) {
            return PROBE_GRID_STATE
          }

          const perRow = hackFloor(viewportWidth / itemWidth)
          let startIndex = perRow * floor(startOffset / itemHeight)
          let endIndex = perRow * ceil(endOffset / itemHeight) - 1
          endIndex = min(totalCount - 1, endIndex)
          startIndex = min(endIndex, max(0, startIndex))

          const items = buildItems(startIndex, endIndex)
          const { top, bottom } = gridLayout(viewport, item, items)
          const totalHeight = ceil(totalCount / perRow) * itemHeight
          const offsetBottom = totalHeight - bottom

          return { items, offsetTop: top, offsetBottom, top, bottom, itemHeight, itemWidth } as GridState
        })
      ),
      gridState
    )

    u.connect(
      u.pipe(
        viewportDimensions,
        u.map(({ height }) => height)
      ),
      viewportHeight
    )

    u.connect(
      u.pipe(
        u.combineLatest(viewportDimensions, itemDimensions, gridState),
        u.map(([viewportDimensions, item, { items }]) => {
          const { top, bottom } = gridLayout(viewportDimensions, item, items)

          return [top, bottom] as [number, number]
        }),
        u.distinctUntilChanged(tupleComparator)
      ),
      listBoundary
    )

    u.connect(
      u.pipe(
        listBoundary,
        u.withLatestFrom(gridState),
        u.map(([[, bottom], { offsetBottom }]) => {
          return { bottom, offsetBottom }
        })
      ),
      stateFlags.listStateListener
    )

    const endReached = u.streamFromEmitter(
      u.pipe(
        u.duc(gridState),
        u.filter(({ items }) => items.length > 0),
        u.withLatestFrom(totalCount),
        u.filter(([{ items }, totalCount]) => items[items.length - 1].index === totalCount - 1),
        u.map(([, totalCount]) => totalCount - 1),
        u.distinctUntilChanged()
      )
    )

    const startReached = u.streamFromEmitter(
      u.pipe(
        u.duc(gridState),
        u.filter(({ items }) => {
          return items.length > 0 && items[0].index === 0
        }),
        u.mapTo(0),
        u.distinctUntilChanged()
      )
    )

    const rangeChanged = u.streamFromEmitter(
      u.pipe(
        u.duc(gridState),
        u.filter(({ items }) => items.length > 0),
        u.map(({ items }) => {
          return {
            startIndex: items[0].index,
            endIndex: items[items.length - 1].index,
          }
        }),
        u.distinctUntilChanged(rangeComparator)
      )
    )

    u.connect(rangeChanged, scrollSeek.scrollSeekRangeChanged)

    u.connect(
      u.pipe(
        scrollToIndex,
        u.withLatestFrom(viewportDimensions, itemDimensions, totalCount),
        u.map(([location, viewport, item, totalCount]) => {
          const normalLocation = normalizeIndexLocation(location)
          const { align, behavior, offset } = normalLocation
          let index = normalLocation.index

          index = Math.max(0, index, Math.min(totalCount - 1, index))

          let top = itemTop(viewport, item, index)

          if (align === 'end') {
            top = Math.round(top - viewport.height + item.height)
          } else if (align === 'center') {
            top = Math.round(top - viewport.height / 2 + item.height / 2)
          }

          if (offset) {
            top += offset
          }

          return { top, behavior }
        })
      ),
      scrollTo
    )

    const totalListHeight = u.statefulStreamFromEmitter(
      u.pipe(
        gridState,
        u.map((gridState) => {
          return gridState.offsetBottom + gridState.bottom
        })
      ),
      0
    )

    u.connect(
      u.pipe(
        windowViewportRect,
        u.map((viewportInfo) => ({ width: viewportInfo.visibleWidth, height: viewportInfo.visibleHeight }))
      ),
      viewportDimensions
    )

    return {
      // input
      totalCount,
      viewportDimensions,
      itemDimensions,
      scrollTop,
      overscan,
      scrollBy,
      scrollTo,
      scrollToIndex,
      smoothScrollTargetReached,
      windowViewportRect,
      windowScrollTo,
      useWindowScroll,
      windowScrollTop,
      initialItemCount,
      ...scrollSeek,

      // output
      gridState,
      totalListHeight,
      ...stateFlags,
      startReached,
      endReached,
      rangeChanged,
      propsReady,
    }
  },
  u.tup(sizeRangeSystem, domIOSystem, stateFlagsSystem, scrollSeekSystem, propsReadySystem, windowScrollerSystem)
)

function gridLayout(viewport: ElementDimensions, item: ElementDimensions, items: GridItem[]): GridLayout {
  const { height: itemHeight } = item
  if (itemHeight === undefined || items.length === 0) {
    return { top: 0, bottom: 0 }
  }

  const top = itemTop(viewport, item, items[0].index)
  const bottom = itemTop(viewport, item, items[items.length - 1].index) + itemHeight
  return { top, bottom }
}

function itemTop(viewport: ElementDimensions, item: ElementDimensions, index: number) {
  const perRow = itemsPerRow(viewport.width, item.width)
  return floor(index / perRow) * item.height
}

function itemsPerRow(viewportWidth: number, itemWidth: number) {
  return hackFloor(viewportWidth / itemWidth)
}
