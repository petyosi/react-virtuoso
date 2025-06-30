import { empty, findMaxKeyValue, Range, rangesWithin } from './AATree'
import { rangeComparator, tupleComparator } from './comparators'
import { groupedListSystem } from './groupedListSystem'
import { getInitialTopMostItemIndexNumber, initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { FlatIndexLocationWithAlign, Item, ListItem, ListRange } from './interfaces'
import { propsReadySystem } from './propsReadySystem'
import { recalcSystem } from './recalcSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { Data, hasGroups, originalIndexFromItemIndex, rangesWithinOffsets, SizeState, sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import * as u from './urx'

export type ListItems = ListItem<unknown>[]
export interface ListState {
  bottom: number
  firstItemIndex: number
  items: ListItems
  offsetBottom: number
  offsetTop: number
  top: number
  topItems: ListItems
  topListHeight: number
  totalCount: number
}

export interface TopListState {
  items: ListItems
  listHeight: number
}

function probeItemSet(index: number, sizes: SizeState, data: Data) {
  if (hasGroups(sizes)) {
    const itemIndex = originalIndexFromItemIndex(index, sizes)
    const groupIndex = findMaxKeyValue(sizes.groupOffsetTree, itemIndex)[0]

    return [
      { index: groupIndex, offset: 0, size: 0 },
      { data: data?.[0], index: itemIndex, offset: 0, size: 0 },
    ]
  }
  return [{ data: data?.[0], index, offset: 0, size: 0 }]
}

const EMPTY_LIST_STATE: ListState = {
  bottom: 0,
  firstItemIndex: 0,
  items: [] as ListItems,
  offsetBottom: 0,
  offsetTop: 0,
  top: 0,
  topItems: [] as ListItems,
  topListHeight: 0,
  totalCount: 0,
}

export function buildListState(
  items: Item<any>[],
  topItems: Item<any>[],
  totalCount: number,
  gap: number,
  sizes: SizeState,
  firstItemIndex: number
): ListState {
  const { lastIndex, lastOffset, lastSize } = sizes
  let offsetTop = 0
  let bottom = 0

  if (items.length > 0) {
    offsetTop = items[0].offset
    const lastItem = items[items.length - 1]
    bottom = lastItem.offset + lastItem.size
  }

  const itemCount = totalCount - lastIndex
  const total = lastOffset + itemCount * lastSize + (itemCount - 1) * gap
  const top = offsetTop
  const offsetBottom = total - bottom

  return {
    bottom,
    firstItemIndex,
    items: transposeItems(items, sizes, firstItemIndex),
    offsetBottom,
    offsetTop,
    top,
    topItems: transposeItems(topItems, sizes, firstItemIndex),
    topListHeight: topItems.reduce((height, item) => item.size + height, 0),
    totalCount,
  }
}

export function buildListStateFromItemCount(
  itemCount: number,
  initialTopMostItemIndex: FlatIndexLocationWithAlign | number,
  sizes: SizeState,
  firstItemIndex: number,
  gap: number,
  data: readonly unknown[]
) {
  let includedGroupsCount = 0
  if (sizes.groupIndices.length > 0) {
    for (const index of sizes.groupIndices) {
      if (index - includedGroupsCount >= itemCount) {
        break
      }
      includedGroupsCount++
    }
  }

  const adjustedCount = itemCount + includedGroupsCount
  const initialTopMostItemIndexNumber = getInitialTopMostItemIndexNumber(initialTopMostItemIndex, adjustedCount)

  const items = Array.from({ length: adjustedCount }).map((_, index) => ({
    data: data[index + initialTopMostItemIndexNumber],
    index: index + initialTopMostItemIndexNumber,
    offset: 0,
    size: 0,
  }))
  return buildListState(items, [], adjustedCount, gap, sizes, firstItemIndex)
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

    let transposedItem: { groupIndex: number; index: number } | { index: number; type: 'group' }

    if (item.index === currentRange.start) {
      transposedItem = {
        index: currentGroupIndex,
        type: 'group' as const,
      }
    } else {
      transposedItem = {
        groupIndex: currentGroupIndex,
        index: item.index - (currentGroupIndex + 1) + firstItemIndex,
      }
    }

    transposedItems.push({
      ...transposedItem,
      data: item.data,
      offset: item.offset,
      originalIndex: item.index,
      size: item.size,
    })
  }

  return transposedItems
}

export const listStateSystem = u.system(
  ([
    { data, firstItemIndex, gap, sizes, totalCount },
    groupedListSystem,
    { listBoundary, topListHeight: rangeTopListHeight, visibleRange },
    { initialTopMostItemIndex, scrolledToInitialItem },
    { topListHeight },
    stateFlags,
    { didMount },
    { recalcInProgress },
  ]) => {
    const topItemsIndexes = u.statefulStream<number[]>([])
    const initialItemCount = u.statefulStream(0)
    const itemsRendered = u.stream<ListItems>()
    const didCalcList = u.stream<true>()
    

    u.connect(groupedListSystem.topItemsIndexes, topItemsIndexes)

    const listState = u.statefulStreamFromEmitter(
      u.pipe(
        u.combineLatest(
          didMount,
          recalcInProgress,
          u.duc(visibleRange, tupleComparator),
          u.duc(totalCount),
          u.duc(sizes),
          u.duc(initialTopMostItemIndex),
          scrolledToInitialItem,
          u.duc(topItemsIndexes),
          u.duc(firstItemIndex),
          u.duc(gap),
          data
        ),
        u.filter(([mount, recalcInProgress, , totalCount, , , , , , , data]) => {
          // When data length changes, it is synced to totalCount, both of which trigger a recalc separately.
          // Recalc should be skipped then, as the calculation expects both data and totalCount to be in sync.
          const dataChangeInProgress = data && data.length !== totalCount
          return mount && !recalcInProgress && !dataChangeInProgress
        }),
        u.map(
          ([
            ,
            ,
            [startOffset, endOffset],
            totalCount,
            sizes,
            initialTopMostItemIndex,
            scrolledToInitialItem,
            topItemsIndexes,
            firstItemIndex,
            gap,
            data,
          ]) => {
            const sizesValue = sizes
            const { offsetTree, sizeTree } = sizesValue
            const initialItemCountValue = u.getValue(initialItemCount)

            if (totalCount === 0) {
              return { ...EMPTY_LIST_STATE, totalCount }
            }

            // no container measruements yet
            if (startOffset === 0 && endOffset === 0) {
              if (initialItemCountValue === 0) {
                return { ...EMPTY_LIST_STATE, totalCount }
              } else {
                return buildListStateFromItemCount(initialItemCountValue, initialTopMostItemIndex, sizes, firstItemIndex, gap, data || [])
              }
            }

            if (empty(sizeTree)) {
              if (initialItemCountValue > 0) {
                return null
              }
              const state = buildListState(
                probeItemSet(getInitialTopMostItemIndexNumber(initialTopMostItemIndex, totalCount), sizesValue, data),
                [],
                totalCount,
                gap,
                sizesValue,
                firstItemIndex
              )
              return state
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
                  topItems.push({ data: data?.[i], index: i, offset: offset, size })
                  offset += size
                }
              }
            }

            // If the list hasn't scrolled to the initial item because the initial item was set,
            // render empty list.
            //
            // This is a condition to be evaluated after the probe check cycle, do not merge
            // with the totalCount check above
            if (!scrolledToInitialItem) {
              return buildListState([], topItems, totalCount, gap, sizesValue, firstItemIndex)
            }

            const minStartIndex = topItemsIndexes.length > 0 ? topItemsIndexes[topItemsIndexes.length - 1] + 1 : 0

            const offsetPointRanges = rangesWithinOffsets(offsetTree, startOffset, endOffset, minStartIndex)
            if (offsetPointRanges.length === 0) {
              return null
            }

            const maxIndex = totalCount - 1

            const items = u.tap([] as Item<any>[], (result) => {
              for (const range of offsetPointRanges) {
                const point = range.value
                let offset = point.offset
                let rangeStartIndex = range.start
                const size = point.size

                if (point.offset < startOffset) {
                  rangeStartIndex += Math.floor((startOffset - point.offset + gap) / (size + gap))
                  const itemCount = rangeStartIndex - range.start
                  offset += itemCount * size + itemCount * gap
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

                  result.push({ data: data?.[i], index: i, offset: offset, size })
                  offset += size + gap
                }
              }
            })

            let state = buildListState(items, topItems, totalCount, gap, sizesValue, firstItemIndex)
            u.publish(didCalcList, true);
            return state
          }
        ),
        //@ts-expect-error filter needs to be fixed
        u.filter((value) => value !== null),
        u.distinctUntilChanged()
      ),
      EMPTY_LIST_STATE
    )

    u.connect(
      u.pipe(
        data,
        u.filter(u.isDefined),
        u.map((data) => data?.length)
      ),
      totalCount
    )

    u.connect(
      u.pipe(
        listState,
        u.map((value) => value.topListHeight)
      ),
      topListHeight
    )
    u.connect(topListHeight, rangeTopListHeight)

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
        u.map(([count]) => count)
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
          let startIndex = 0
          let endIndex = items.length - 1

          while (items[startIndex].type === 'group' && startIndex < endIndex) {
            startIndex++
          }

          while (items[endIndex].type === 'group' && endIndex > startIndex) {
            endIndex--
          }

          return {
            endIndex: items[endIndex].index,
            startIndex: items[startIndex].index,
          } as ListRange
        }),
        u.distinctUntilChanged(rangeComparator)
      )
    )

    return { endReached, initialItemCount, itemsRendered, listState, rangeChanged, startReached, topItemsIndexes, didCalcList, ...stateFlags }
  },
  u.tup(
    sizeSystem,
    groupedListSystem,
    sizeRangeSystem,
    initialTopMostItemIndexSystem,
    scrollToIndexSystem,
    stateFlagsSystem,
    propsReadySystem,
    recalcSystem
  ),
  { singleton: true }
)
