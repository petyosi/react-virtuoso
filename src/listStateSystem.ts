import * as u from '@virtuoso.dev/urx'
import { empty, find, findMaxKeyValue, Range, rangesWithin } from './AATree'
import { domIOSystem } from './domIOSystem'
import { groupedListSystem } from './groupedListSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { Item, ListItem, ListRange } from './interfaces'
import { propsReadySystem } from './propsReadySystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { Data, originalIndexFromItemIndex, SizeState, sizeSystem, hasGroups } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { rangeComparator, tupleComparator } from './comparators'

export type ListItems = ListItem<unknown>[]
export interface TopListState {
  items: ListItems
  listHeight: number
}

export interface ListState {
  items: ListItems
  topItems: ListItems
  topListHeight: number
  offsetTop: number
  offsetBottom: number
  top: number
  bottom: number
  totalCount: number
}

function probeItemSet(index: number, sizes: SizeState, data: Data) {
  if (hasGroups(sizes)) {
    const itemIndex = originalIndexFromItemIndex(index, sizes)
    const groupIndex = findMaxKeyValue(sizes.groupOffsetTree, itemIndex)[0]

    return [
      { index: groupIndex, size: 0, offset: 0 },
      { index: itemIndex, size: 0, offset: 0, data: data && data[0] },
    ]
  }
  return [{ index, size: 0, offset: 0, data: data && data[0] }]
}

const EMPTY_LIST_STATE: ListState = {
  items: [] as ListItems,
  topItems: [] as ListItems,
  offsetTop: 0,
  offsetBottom: 0,
  top: 0,
  bottom: 0,
  topListHeight: 0,
  totalCount: 0,
}

function transposeItems(items: Item<any>[], sizes: SizeState, firstItemIndex: number): ListItems {
  if (items.length === 0) {
    return []
  }

  if (!hasGroups(sizes)) {
    return items.map((item) => ({ ...item, index: item.index + firstItemIndex, originalIndex: item.index }))
  }

  const startIndex = items[0].index
  const endIndex = items[items.length - 1].index

  const transposedItems = [] as ListItems
  const groupRanges = rangesWithin(sizes.groupOffsetTree, startIndex, endIndex)
  let currentRange: Range<number> | undefined = undefined
  let currentGroupIndex = 0

  for (const item of items) {
    if (!currentRange || currentRange.end < item.index) {
      currentRange = groupRanges.shift()!
      currentGroupIndex = sizes.groupIndices.indexOf(currentRange.start)
    }

    let transposedItem: { type: 'group'; index: number } | { index: number; groupIndex: number }

    if (item.index === currentRange.start) {
      transposedItem = {
        type: 'group' as const,
        index: currentGroupIndex,
      }
    } else {
      transposedItem = {
        index: item.index - (currentGroupIndex + 1) + firstItemIndex,
        groupIndex: currentGroupIndex,
      }
    }

    transposedItems.push({
      ...transposedItem,
      size: item.size,
      offset: item.offset,
      originalIndex: item.index,
      data: item.data,
    })
  }

  return transposedItems
}

export function buildListState(
  items: Item<any>[],
  topItems: Item<any>[],
  totalCount: number,
  sizes: SizeState,
  firstItemIndex: number
): ListState {
  const { lastSize, lastOffset, lastIndex } = sizes
  let offsetTop = 0
  let bottom = 0

  if (items.length > 0) {
    offsetTop = items[0].offset
    const lastItem = items[items.length - 1]
    bottom = lastItem.offset + lastItem.size
  }

  const total = lastOffset + (totalCount - lastIndex) * lastSize
  const top = offsetTop
  const offsetBottom = total - bottom

  return {
    items: transposeItems(items, sizes, firstItemIndex),
    topItems: transposeItems(topItems, sizes, firstItemIndex),
    topListHeight: topItems.reduce((height, item) => item.size + height, 0),
    offsetTop,
    offsetBottom,
    top,
    bottom,
    totalCount,
  }
}

export const listStateSystem = u.system(
  ([
    { statefulScrollTop, headerHeight },
    { sizes, totalCount, data, firstItemIndex },
    groupedListSystem,
    { visibleRange, listBoundary, topListHeight: rangeTopListHeight },
    { scrolledToInitialItem, initialTopMostItemIndex },
    { topListHeight },
    stateFlags,
    { didMount },
  ]) => {
    const topItemsIndexes = u.statefulStream<Array<number>>([])
    const itemsRendered = u.stream<ListItems>()

    u.connect(groupedListSystem.topItemsIndexes, topItemsIndexes)

    const listState = u.statefulStreamFromEmitter(
      u.pipe(
        u.combineLatest(
          didMount,
          u.duc(visibleRange),
          u.duc(totalCount),
          u.duc(sizes),
          u.duc(initialTopMostItemIndex),
          scrolledToInitialItem,
          u.duc(topItemsIndexes),
          u.duc(firstItemIndex),
          data
        ),
        u.filter(([mount]) => mount),
        u.map(
          ([
            ,
            [startOffset, endOffset],
            totalCount,
            sizes,
            initialTopMostItemIndex,
            scrolledToInitialItem,
            topItemsIndexes,
            firstItemIndex,
            data,
          ]) => {
            const sizesValue = sizes
            const { sizeTree, offsetTree } = sizesValue

            if (totalCount === 0 || (startOffset === 0 && endOffset === 0)) {
              return EMPTY_LIST_STATE
            }

            if (empty(sizeTree)) {
              return buildListState(probeItemSet(initialTopMostItemIndex, sizesValue, data), [], totalCount, sizesValue, firstItemIndex)
            }

            const topItems = [] as Item<any>[]

            if (topItemsIndexes.length > 0) {
              const startIndex = topItemsIndexes[0]
              const endIndex = topItemsIndexes[topItemsIndexes.length - 1]
              let offset = 0
              for (const range of rangesWithin(sizeTree, startIndex, endIndex)) {
                const size = range.value
                const rangeStartIndex = Math.max(range.start, startIndex)
                const rangeEndIndex = Math.min(range.end, endIndex)
                for (let i = rangeStartIndex; i <= rangeEndIndex; i++) {
                  topItems.push({ index: i, size, offset: offset, data: data && data[i] })
                  offset += size
                }
              }
            }

            // If the list hasn't scrolled to the initial item because the initial item was set,
            // render empty list.
            //
            // This is a condition to be evaluated past the probe check, do not merge
            // with the totalCount check above
            if (!scrolledToInitialItem) {
              return buildListState([], topItems, totalCount, sizesValue, firstItemIndex)
            }

            // pull a fresh top group, avoids a bug where
            // scrolling up too fast causes stack overflow
            if (hasGroups(sizesValue)) {
              const scrollTop = Math.max(u.getValue(statefulScrollTop) - u.getValue(headerHeight), 0)
              topItemsIndexes = [findMaxKeyValue(sizesValue.groupOffsetTree, scrollTop, 'v')[0]]
            }

            const minStartIndex = topItemsIndexes.length > 0 ? topItemsIndexes[topItemsIndexes.length - 1] + 1 : 0
            const startIndex = Math.max(minStartIndex, findMaxKeyValue(offsetTree, startOffset, 'v')[0]!)
            const endIndex = findMaxKeyValue(offsetTree, endOffset, 'v')[0]!
            const maxIndex = totalCount - 1

            const items = u.tap([] as Item<any>[], (result) => {
              for (const range of rangesWithin(offsetTree, startIndex, endIndex)) {
                let offset = range.value
                let rangeStartIndex = range.start
                const size = find(sizeTree, rangeStartIndex)!

                if (range.value < startOffset) {
                  rangeStartIndex += Math.floor((startOffset - range.value) / size)
                  offset += (rangeStartIndex - range.start) * size
                }

                if (rangeStartIndex < minStartIndex) {
                  offset += (minStartIndex - rangeStartIndex) * size
                  rangeStartIndex = minStartIndex
                }

                const endIndex = Math.min(range.end, maxIndex)

                for (let i = rangeStartIndex; i <= endIndex; i++) {
                  if (offset >= endOffset) {
                    break
                  }

                  result.push({ index: i, size, offset: offset, data: data && data[i] })
                  offset += size
                }
              }
            })

            return buildListState(items, topItems, totalCount, sizesValue, firstItemIndex)
          }
        ),
        u.distinctUntilChanged()
      ),
      EMPTY_LIST_STATE
    )

    u.connect(
      u.pipe(
        data,
        u.filter((data) => data !== undefined),
        u.map((data) => data!.length)
      ),
      totalCount
    )

    u.connect(u.pipe(listState, u.map(u.prop('topListHeight'))), topListHeight)
    u.connect(topListHeight, rangeTopListHeight)
    u.connect(listState, stateFlags.listStateListener)

    u.connect(
      u.pipe(
        listState,
        u.map((state) => [state.top, state.bottom])
      ),
      listBoundary
    )

    u.connect(
      u.pipe(
        listState,
        u.map((state) => state.items)
      ),
      itemsRendered
    )

    const endReached = u.streamFromEmitter(
      u.pipe(
        listState,
        u.filter(({ items }) => items.length > 0),
        u.withLatestFrom(totalCount, data),
        u.filter(([{ items }, totalCount]) => items[items.length - 1].originalIndex === totalCount - 1),
        u.map(([, totalCount, data]) => [totalCount - 1, data] as [number, unknown[]]),
        u.distinctUntilChanged(tupleComparator),
        u.map(([count]) => count as number)
      )
    )

    const startReached = u.streamFromEmitter(
      u.pipe(
        listState,
        u.throttleTime(200),
        u.filter(({ items, topItems }) => {
          return items.length > 0 && items[0].originalIndex === topItems.length
        }),
        u.map(({ items }) => items[0].index),
        u.distinctUntilChanged()
      )
    )

    const rangeChanged = u.streamFromEmitter(
      u.pipe(
        listState,
        u.filter(({ items }) => items.length > 0),
        u.map(({ items }) => {
          return {
            startIndex: items[0].index,
            endIndex: items[items.length - 1].index,
          } as ListRange
        }),
        u.distinctUntilChanged(rangeComparator)
      )
    )

    return { listState, topItemsIndexes, endReached, startReached, rangeChanged, itemsRendered, ...stateFlags }
  },
  u.tup(
    domIOSystem,
    sizeSystem,
    groupedListSystem,
    sizeRangeSystem,
    initialTopMostItemIndexSystem,
    scrollToIndexSystem,
    stateFlagsSystem,
    propsReadySystem
  ),
  { singleton: true }
)
