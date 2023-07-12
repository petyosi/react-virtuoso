import * as u from './urx'
import { rangeComparator, tupleComparator } from './comparators'
import { domIOSystem } from './domIOSystem'
import { FlatIndexLocationWithAlign, GridIndexLocation, GridItem } from './interfaces'
import { propsReadySystem } from './propsReadySystem'
import { scrollSeekSystem } from './scrollSeekSystem'
import { normalizeIndexLocation } from './scrollToIndexSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { loggerSystem } from './loggerSystem'
import { windowScrollerSystem } from './windowScrollerSystem'
import { getInitialTopMostItemIndexNumber } from './initialTopMostItemIndexSystem'
import { skipFrames } from './utils/skipFrames'

export type Data = unknown[] | null

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

function buildProbeGridState<D = unknown>(items: GridItem<D>[]): GridState {
  return {
    ...PROBE_GRID_STATE,
    items: items,
  }
}

function buildItems<D>(startIndex: number, endIndex: number, data: D[] | null) {
  return Array.from({ length: endIndex - startIndex + 1 }).map((_, i) => {
    const dataItem = data === null ? null : data[i + startIndex]
    return { index: i + startIndex, data: dataItem } as GridItem<D>
  })
}

function gapComparator(prev: Gap, next: Gap) {
  return prev && prev.column === next.column && prev.row === next.row
}
function dimensionComparator(prev: ElementDimensions, next: ElementDimensions) {
  return prev && prev.width === next.width && prev.height === next.height
}

export interface GridStateSnapshot {
  viewport: ElementDimensions
  item: ElementDimensions
  gap: Gap
  scrollTop: number
}

export const gridSystem = /*#__PURE__*/ u.system(
  ([
    { overscan, visibleRange, listBoundary },
    { scrollTop, viewportHeight, scrollBy, scrollTo, smoothScrollTargetReached, scrollContainerState, footerHeight, headerHeight },
    stateFlags,
    scrollSeek,
    { propsReady, didMount },
    { windowViewportRect, useWindowScroll, customScrollParent, windowScrollContainerState, windowScrollTo },
    log,
  ]) => {
    const totalCount = u.statefulStream(0)
    const initialItemCount = u.statefulStream(0)
    const gridState = u.statefulStream(INITIAL_GRID_STATE)
    const viewportDimensions = u.statefulStream<ElementDimensions>({ height: 0, width: 0 })
    const itemDimensions = u.statefulStream<ElementDimensions>({ height: 0, width: 0 })
    const scrollToIndex = u.stream<GridIndexLocation>()
    const scrollHeight = u.stream<number>()
    const deviation = u.statefulStream(0)
    const data = u.statefulStream<Data>(null)
    const gap = u.statefulStream<Gap>({ row: 0, column: 0 })
    const stateChanged = u.stream<GridStateSnapshot>()
    const restoreStateFrom = u.stream<GridStateSnapshot | undefined | null>()
    const stateRestoreInProgress = u.statefulStream(false)
    const initialTopMostItemIndex = u.statefulStream<GridIndexLocation>(0)
    const scrolledToInitialItem = u.statefulStream(true)
    const scrollScheduled = u.statefulStream(false)

    u.subscribe(
      u.pipe(
        didMount,
        u.withLatestFrom(initialTopMostItemIndex),
        u.filter(([_, location]) => !!location)
      ),
      () => {
        // console.log('block rendering')
        u.publish(scrolledToInitialItem, false)
        // topmost item index takes precedence over initial item count
        u.publish(initialItemCount, 0)
      }
    )

    u.subscribe(
      u.pipe(
        u.combineLatest(didMount, scrolledToInitialItem, itemDimensions, viewportDimensions, initialTopMostItemIndex, scrollScheduled),
        u.filter(([didMount, scrolledToInitialItem, itemDimensions, viewportDimensions, , scrollScheduled]) => {
          return didMount && !scrolledToInitialItem && itemDimensions.height !== 0 && viewportDimensions.height !== 0 && !scrollScheduled
        })
      ),
      ([, , , , initialTopMostItemIndex]) => {
        u.publish(scrollScheduled, true)

        skipFrames(1, () => {
          u.publish(scrollToIndex, initialTopMostItemIndex)
        })

        u.handleNext(u.pipe(scrollTop), () => {
          // this refreshes the sizeRangeSystem start/endOffset
          u.publish(listBoundary, [0, 0])
          // console.log('resume rendering')
          u.publish(scrolledToInitialItem, true)
        })
      }
    )

    // state snapshot takes precedence over initial item count
    u.connect(
      u.pipe(
        restoreStateFrom,
        u.filter((value) => value !== undefined && value !== null && value.scrollTop > 0),
        u.mapTo(0)
      ),
      initialItemCount
    )

    u.subscribe(
      u.pipe(
        didMount,
        u.withLatestFrom(restoreStateFrom),
        u.filter(([, snapshot]) => snapshot !== undefined && snapshot !== null)
      ),
      ([, snapshot]) => {
        if (!snapshot) {
          return
        }
        u.publish(viewportDimensions, snapshot.viewport), u.publish(itemDimensions, snapshot?.item)
        u.publish(gap, snapshot.gap)
        if (snapshot.scrollTop > 0) {
          u.publish(stateRestoreInProgress, true)
          u.handleNext(u.pipe(scrollTop, u.skip(1)), (_value) => {
            u.publish(stateRestoreInProgress, false)
          })
          u.publish(scrollTo, { top: snapshot.scrollTop })
        }
      }
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
        u.combineLatest(
          u.duc(viewportDimensions, dimensionComparator),
          u.duc(itemDimensions, dimensionComparator),
          u.duc(gap, (prev, next) => prev && prev.column === next.column && prev.row === next.row),
          u.duc(scrollTop)
        ),
        u.map(([viewport, item, gap, scrollTop]) => ({
          viewport,
          item,
          gap,
          scrollTop,
        }))
      ),
      stateChanged
    )

    u.connect(
      u.pipe(
        u.combineLatest(
          u.duc(totalCount),
          visibleRange,
          u.duc(gap, gapComparator),
          u.duc(itemDimensions, dimensionComparator),
          u.duc(viewportDimensions, dimensionComparator),
          u.duc(data),
          u.duc(initialItemCount),
          u.duc(stateRestoreInProgress),
          u.duc(scrolledToInitialItem),
          u.duc(initialTopMostItemIndex)
        ),
        u.filter(([, , , , , , , stateRestoreInProgress]) => {
          return !stateRestoreInProgress
        }),
        u.map(
          ([
            totalCount,
            [startOffset, endOffset],
            gap,
            item,
            viewport,
            data,
            initialItemCount,
            ,
            scrolledToInitialItem,
            initialTopMostItemIndex,
          ]) => {
            const { row: rowGap, column: columnGap } = gap
            const { height: itemHeight, width: itemWidth } = item
            const { width: viewportWidth } = viewport

            // don't wipeout the already rendered state if there's an initial item count
            if (initialItemCount === 0 && (totalCount === 0 || viewportWidth === 0)) {
              return INITIAL_GRID_STATE
            }

            if (itemWidth === 0) {
              const startIndex = getInitialTopMostItemIndexNumber(initialTopMostItemIndex, totalCount)
              // if the initial item count is set, we don't render the items from the initial item count.
              const endIndex = startIndex === 0 ? Math.max(initialItemCount - 1, 0) : startIndex
              return buildProbeGridState(buildItems(startIndex, endIndex, data))
            }

            const perRow = itemsPerRow(viewportWidth, itemWidth, columnGap)

            let startIndex!: number
            let endIndex!: number

            // render empty items until the scroller reaches the initial item
            if (!scrolledToInitialItem) {
              startIndex = 0
              endIndex = -1
            }
            // we know the dimensions from a restored state, but the offsets are not calculated yet
            else if (startOffset === 0 && endOffset === 0 && initialItemCount > 0) {
              startIndex = 0
              endIndex = initialItemCount - 1
            } else {
              startIndex = perRow * floor((startOffset + rowGap) / (itemHeight + rowGap))
              endIndex = perRow * ceil((endOffset + rowGap) / (itemHeight + rowGap)) - 1
              endIndex = min(totalCount - 1, max(endIndex, perRow - 1))
              startIndex = min(endIndex, max(0, startIndex))
            }

            const items = buildItems(startIndex, endIndex, data)
            const { top, bottom } = gridLayout(viewport, gap, item, items)
            const rowCount = ceil(totalCount / perRow)
            const totalHeight = rowCount * itemHeight + (rowCount - 1) * rowGap
            const offsetBottom = totalHeight - bottom

            return { items, offsetTop: top, offsetBottom, top, bottom, itemHeight, itemWidth } as GridState
          }
        )
      ),
      gridState
    )

    u.connect(
      u.pipe(
        data,
        u.filter((data) => data !== null),
        u.map((data) => data!.length)
      ),
      totalCount
    )

    u.connect(
      u.pipe(
        u.combineLatest(viewportDimensions, itemDimensions, gridState, gap),
        u.filter(([viewportDimensions, itemDimensions, { items }]) => {
          return items.length > 0 && itemDimensions.height !== 0 && viewportDimensions.height !== 0
        }),
        u.map(([viewportDimensions, itemDimensions, { items }, gap]) => {
          const { top, bottom } = gridLayout(viewportDimensions, gap, itemDimensions, items)

          return [top, bottom] as [number, number]
        }),
        u.distinctUntilChanged(tupleComparator)
      ),
      listBoundary
    )

    const hasScrolled = u.statefulStream(false)

    u.connect(
      u.pipe(
        scrollTop,
        u.withLatestFrom(hasScrolled),
        u.map(([scrollTop, hasScrolled]) => {
          return hasScrolled || scrollTop !== 0
        })
      ),
      hasScrolled
    )

    const endReached = u.streamFromEmitter(
      u.pipe(
        u.duc(gridState),
        u.filter(({ items }) => items.length > 0),
        u.withLatestFrom(totalCount, hasScrolled),
        u.filter(([{ items }, totalCount, hasScrolled]) => hasScrolled && items[items.length - 1].index === totalCount - 1),
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
        u.withLatestFrom(stateRestoreInProgress),
        u.filter(([{ items }, stateRestoreInProgress]) => items.length > 0 && !stateRestoreInProgress),
        u.map(([{ items }]) => {
          return {
            startIndex: items[0].index,
            endIndex: items[items.length - 1].index,
          }
        }),
        u.distinctUntilChanged(rangeComparator),
        u.throttleTime(0)
      )
    )

    u.connect(rangeChanged, scrollSeek.scrollSeekRangeChanged)

    u.connect(
      u.pipe(
        scrollToIndex,
        u.withLatestFrom(viewportDimensions, itemDimensions, totalCount, gap),
        u.map(([location, viewportDimensions, itemDimensions, totalCount, gap]) => {
          const normalLocation = normalizeIndexLocation(location) as FlatIndexLocationWithAlign
          const { align, behavior, offset } = normalLocation
          let index = normalLocation.index
          if (index === 'LAST') {
            index = totalCount - 1
          }

          index = max(0, index, min(totalCount - 1, index))

          let top = itemTop(viewportDimensions, gap, itemDimensions, index)

          if (align === 'end') {
            top = round(top - viewportDimensions.height + itemDimensions.height)
          } else if (align === 'center') {
            top = round(top - viewportDimensions.height / 2 + itemDimensions.height / 2)
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
      restoreStateFrom,
      ...scrollSeek,
      initialTopMostItemIndex,

      // output
      gridState,
      totalListHeight,
      ...stateFlags,
      startReached,
      endReached,
      rangeChanged,
      stateChanged,
      propsReady,
      stateRestoreInProgress,
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

export function itemsPerRow(viewportWidth: number, itemWidth: number, gap: number) {
  return max(1, floor((viewportWidth + gap) / (floor(itemWidth) + gap)))
}
