import * as u from '@virtuoso.dev/urx'
import { rangeComparator, tupleComparator } from './comparators'
import { domIOSystem } from './domIOSystem'
import { FlatIndexLocationWithAlign, GridItem } from './interfaces'
import { propsReadySystem } from './propsReadySystem'
import { scrollSeekSystem } from './scrollSeekSystem'
import { IndexLocation, normalizeIndexLocation } from './scrollToIndexSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { loggerSystem } from './loggerSystem'
import { windowScrollerSystem } from './windowScrollerSystem'

export type Data = unknown[] | undefined

export interface Gap {
  row: number
  column: number
}

export interface ElementDimensions {
  width: number
  height: number
}

export interface GridLayout {
  top: number
  bottom: number
}

export interface GridState extends GridLayout {
  items: GridItem<unknown>[]
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

const { round, ceil, floor, min, max } = Math

function buildItems<D>(startIndex: number, endIndex: number, data: D[] | undefined) {
  return Array.from({ length: endIndex - startIndex + 1 }).map(
    (_, i) => ({ index: i + startIndex, data: data?.[i + startIndex] } as GridItem<D>)
  )
}

function gapComparator(prev: Gap, next: Gap) {
  return prev && prev.column === next.column && prev.row === next.row
}
export const gridSystem = u.system(
  ([
    { overscan, visibleRange, listBoundary },
    { scrollTop, viewportHeight, scrollBy, scrollTo, smoothScrollTargetReached, scrollContainerState, footerHeight, headerHeight },
    stateFlags,
    scrollSeek,
    { propsReady, didMount },
    { windowViewportRect, windowScrollTo, useWindowScroll, customScrollParent, windowScrollContainerState },
    log,
  ]) => {
    const totalCount = u.statefulStream(0)
    const initialItemCount = u.statefulStream(0)
    const gridState = u.statefulStream(INITIAL_GRID_STATE)
    const viewportDimensions = u.statefulStream<ElementDimensions>({ height: 0, width: 0 })
    const itemDimensions = u.statefulStream<ElementDimensions>({ height: 0, width: 0 })
    const scrollToIndex = u.stream<IndexLocation>()
    const scrollHeight = u.stream<number>()
    const deviation = u.statefulStream(0)
    const data = u.statefulStream<Data>(undefined)
    const gap = u.statefulStream<Gap>({ row: 0, column: 0 })

    u.connect(
      u.pipe(
        u.combineLatest(didMount, initialItemCount, data),
        u.filter(([, count]) => count !== 0),
        u.map(([, count, data]) => {
          return {
            items: buildItems(0, count - 1, data),
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
          u.duc(gap, gapComparator),
          u.duc(itemDimensions, (prev, next) => prev && prev.width === next.width && prev.height === next.height),
          data
        ),
        u.withLatestFrom(viewportDimensions),
        u.map(([[totalCount, [startOffset, endOffset], gap, item, data], viewport]) => {
          const { row: rowGap, column: columnGap } = gap
          const { height: itemHeight, width: itemWidth } = item
          const { width: viewportWidth } = viewport

          if (totalCount === 0 || viewportWidth === 0) {
            return INITIAL_GRID_STATE
          }

          if (itemWidth === 0) {
            return PROBE_GRID_STATE
          }

          const perRow = itemsPerRow(viewportWidth, itemWidth, columnGap)

          let startIndex = perRow * floor((startOffset + rowGap) / (itemHeight + rowGap))
          let endIndex = perRow * ceil((endOffset + rowGap) / (itemHeight + rowGap)) - 1
          endIndex = max(0, min(totalCount - 1, endIndex))
          startIndex = min(endIndex, max(0, startIndex))

          const items = buildItems(startIndex, endIndex, data)
          const { top, bottom } = gridLayout(viewport, gap, item, items)
          const rowCount = ceil(totalCount / perRow)
          const totalHeight = rowCount * itemHeight + (rowCount - 1) * rowGap
          const offsetBottom = totalHeight - bottom

          return { items, offsetTop: top, offsetBottom, top, bottom, itemHeight, itemWidth } as GridState
        })
      ),
      gridState
    )

    u.connect(
      u.pipe(
        data,
        u.filter((data) => data !== undefined),
        u.map((data) => data!.length)
      ),
      totalCount
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
        u.combineLatest(viewportDimensions, itemDimensions, gridState, gap),
        u.map(([viewportDimensions, item, { items }, gap]) => {
          const { top, bottom } = gridLayout(viewportDimensions, gap, item, items)

          return [top, bottom] as [number, number]
        }),
        u.distinctUntilChanged(tupleComparator)
      ),
      listBoundary
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
        u.withLatestFrom(viewportDimensions, itemDimensions, totalCount, gap),
        u.map(([location, viewport, item, totalCount, gap]) => {
          const normalLocation = normalizeIndexLocation(location) as FlatIndexLocationWithAlign
          const { align, behavior, offset } = normalLocation
          let index = normalLocation.index
          if (index === 'LAST') {
            index = totalCount - 1
          }

          index = max(0, index, min(totalCount - 1, index))

          let top = itemTop(viewport, gap, item, index)

          if (align === 'end') {
            top = round(top - viewport.height + item.height)
          } else if (align === 'center') {
            top = round(top - viewport.height / 2 + item.height / 2)
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
      data,
      totalCount,
      viewportDimensions,
      itemDimensions,
      scrollTop,
      scrollHeight,
      overscan,
      scrollBy,
      scrollTo,
      scrollToIndex,
      smoothScrollTargetReached,
      windowViewportRect,
      windowScrollTo,
      useWindowScroll,
      customScrollParent,
      windowScrollContainerState,
      deviation,
      scrollContainerState,
      footerHeight,
      headerHeight,
      initialItemCount,
      gap,
      ...scrollSeek,

      // output
      gridState,
      totalListHeight,
      ...stateFlags,
      startReached,
      endReached,
      rangeChanged,
      propsReady,
      ...log,
    }
  },
  u.tup(sizeRangeSystem, domIOSystem, stateFlagsSystem, scrollSeekSystem, propsReadySystem, windowScrollerSystem, loggerSystem)
)

function gridLayout<D>(viewport: ElementDimensions, gap: Gap, item: ElementDimensions, items: GridItem<D>[]): GridLayout {
  const { height: itemHeight } = item
  if (itemHeight === undefined || items.length === 0) {
    return { top: 0, bottom: 0 }
  }

  const top = itemTop(viewport, gap, item, items[0].index)
  const bottom = itemTop(viewport, gap, item, items[items.length - 1].index) + itemHeight
  return { top, bottom }
}

function itemTop(viewport: ElementDimensions, gap: Gap, item: ElementDimensions, index: number) {
  const perRow = itemsPerRow(viewport.width, item.width, gap.column)
  const rowCount = floor(index / perRow)
  const top = rowCount * item.height + max(0, rowCount - 1) * gap.row
  return top > 0 ? top + gap.row : top
}

function itemsPerRow(viewportWidth: number, itemWidth: number, gap: number) {
  return max(1, floor((viewportWidth + gap) / (itemWidth + gap)))
}
