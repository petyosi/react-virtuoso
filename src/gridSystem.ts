import {
  distinctUntilChanged,
  filter,
  duc,
  combineLatest,
  connect,
  map,
  pipe,
  statefulStream,
  system,
  tup,
  withLatestFrom,
  subscribe,
  streamFromEmitter,
  mapTo,
  stream,
} from '@virtuoso.dev/urx'
import { domIOSystem } from './domIOSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { IndexLocation, normalizeIndexLocation } from './scrollToIndexSystem'
import { scrollSeekSystem } from './scrollSeekSystem'

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
const hackFloor = (val: number) => (ceil(val) - val < 0.03 ? ceil(val) : floor(val))

void { subscribe, min, max, hackFloor }

function buildItems(startIndex: number, endIndex: number) {
  return Array.from({ length: endIndex - startIndex + 1 }).map((_, i) => ({ index: i + startIndex } as GridItem))
}
export const gridSystem = system(
  ([{ overscan, visibleRange, listBoundary }, { scrollTop, viewportHeight, scrollBy, scrollTo }, stateFlags, scrollSeek]) => {
    const totalCount = statefulStream(0)
    const initialItemCount = statefulStream(0)
    const gridState = statefulStream(INITIAL_GRID_STATE)
    const viewportDimensions = statefulStream<ElementDimensions>({ height: 0, width: 0 })
    const itemDimensions = statefulStream<ElementDimensions>({ height: 0, width: 0 })
    const scrollToIndex = stream<IndexLocation>()

    // subscribe(listBoundary, value => console.log(value))
    // subscribe(visibleRange, value => console.log(value))
    //
    connect(
      pipe(
        initialItemCount,
        filter(value => value !== 0),
        map(count => {
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

    connect(
      pipe(
        combineLatest(totalCount, visibleRange),
        withLatestFrom(viewportDimensions, itemDimensions),
        map(([[totalCount, [startOffset, endOffset]], viewport, item]) => {
          const { height: itemHeight, width: itemWidth } = item
          const { width: viewportWidth } = viewport

          if (totalCount === 0) {
            return INITIAL_GRID_STATE
          }

          if (itemWidth === 0) {
            return PROBE_GRID_STATE
          }

          const perRow = hackFloor(viewportWidth / itemWidth)
          let startIndex = perRow * floor(startOffset / itemHeight!)
          let endIndex = perRow * ceil(endOffset / itemHeight!) - 1
          endIndex = min(totalCount - 1, endIndex)
          startIndex = min(endIndex, max(0, startIndex))

          const items = buildItems(startIndex, endIndex)
          const { top, bottom } = gridLayout(viewport, item, items)
          const totalHeight = ceil(totalCount / perRow) * itemHeight!
          const offsetBottom = totalHeight - bottom

          return { items, offsetTop: top, offsetBottom, top, bottom, itemHeight, itemWidth } as GridState
        })
      ),
      gridState
    )

    connect(
      pipe(
        viewportDimensions,
        map(({ height }) => height)
      ),
      viewportHeight
    )

    connect(
      pipe(
        combineLatest(viewportDimensions, itemDimensions, gridState),
        map(([viewport, item, { items }]) => {
          const { top, bottom } = gridLayout(viewport, item, items)
          return [top, bottom]
        })
      ),
      listBoundary
    )

    connect(
      pipe(
        listBoundary,
        withLatestFrom(gridState),
        map(([[, bottom], { offsetBottom }]) => {
          return { bottom, offsetBottom }
        })
      ),
      stateFlags.listStateListener
    )

    const endReached = streamFromEmitter(
      pipe(
        duc(gridState),
        filter(({ items }) => items.length > 0),
        withLatestFrom(totalCount),
        filter(([{ items }, totalCount]) => items[items.length - 1].index === totalCount - 1),
        map(([, totalCount]) => totalCount - 1),
        distinctUntilChanged()
      )
    )

    const startReached = streamFromEmitter(
      pipe(
        duc(gridState),
        filter(({ items }) => {
          return items.length > 0 && items[0].index === 0
        }),
        mapTo(0)
      )
    )

    const rangeChanged = streamFromEmitter(
      pipe(
        duc(gridState),
        filter(({ items }) => items.length > 0),
        map(({ items }) => {
          return {
            startIndex: items[0].index,
            endIndex: items[items.length - 1].index,
          }
        }),
        distinctUntilChanged((prev, next) => {
          return prev && prev.startIndex === next.startIndex && prev.endIndex === next.endIndex
        })
      )
    )

    connect(rangeChanged, scrollSeek.scrollSeekRangeChanged)

    connect(
      pipe(
        scrollToIndex,
        withLatestFrom(viewportDimensions, itemDimensions, totalCount),
        map(([location, viewport, item, totalCount]) => {
          let { index, align, behavior } = normalizeIndexLocation(location)

          index = Math.max(0, index, Math.min(totalCount - 1, index))

          let top = itemTop(viewport, item, index)

          if (align === 'end') {
            top = Math.round(top - viewport.height + item.height)
          } else if (align === 'center') {
            top = Math.round(top - viewport.height / 2 + item.height / 2)
          }

          return { top, behavior }
        })
      ),
      scrollTo
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
      initialItemCount,
      ...scrollSeek,

      // output
      gridState,
      ...stateFlags,
      startReached,
      endReached,
      rangeChanged,
    }
  },
  tup(sizeRangeSystem, domIOSystem, stateFlagsSystem, scrollSeekSystem)
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
  return hackFloor(viewportWidth / itemWidth!)
}
