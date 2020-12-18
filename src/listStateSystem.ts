import * as u from '@virtuoso.dev/urx'
import { empty, find, findMaxKeyValue, Range, rangesWithin } from './AATree'
import { groupedListSystem } from './groupedListSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { ListRange } from './interfaces'
import { propsReadySystem } from './propsReadySystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { Data, originalIndexFromItemIndex, SizeState, sizeSystem } from './sizeSystem'
import { stateFlagsSystem } from './stateFlagsSystem'
import { domIOSystem } from './domIOSystem'
import { Item, ListItem } from './interfaces'

export interface TopListState {
  items: ListItem[]
  listHeight: number
}

export interface ListState {
  items: ListItem[]
  topItems: ListItem[]
  topListHeight: number
  offsetTop: number
  offsetBottom: number
  top: number
  bottom: number
}

function probeItemSet(index: number, sizes: SizeState, data: Data) {
  if (!empty(sizes.groupOffsetTree)) {
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
  items: [] as ListItem[],
  topItems: [] as ListItem[],
  offsetTop: 0,
  offsetBottom: 0,
  top: 0,
  bottom: 0,
  topListHeight: 0,
}

function transposeItems(items: Item[], sizes: SizeState, firstItemIndex: number): ListItem[] {
  if (items.length === 0) {
    return []
  }

  if (empty(sizes.groupOffsetTree)) {
    return items.map(item => ({ ...item, index: item.index + firstItemIndex, originalIndex: item.index }))
  }

  const startIndex = items[0].index
  const endIndex = items[items.length - 1].index

  const transposedItems = [] as ListItem[]
  const groupRanges = rangesWithin(sizes.groupOffsetTree, startIndex, endIndex)
  let currentRange: Range<number> | undefined = undefined
  let currentGroupIndex: number = 0

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

  return transposedItems as ListItem[]
}

export function buildListState(items: Item[], topItems: Item[], totalCount: number, sizes: SizeState, firstItemIndex: number): ListState {
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
  }
}

export const listStateSystem = u.system(
  ([
    { statefulScrollTop },
    { sizes, totalCount, data, firstItemIndex },
    groupedListSystem,
    { visibleRange, listBoundary, topListHeight: rangeTopListHeight },
    { scrolledToInitialItem, initialTopMostItemIndex },
    { topListHeight },
    stateFlags,
    { didMount },
  ]) => {
    const topItemsIndexes = u.statefulStream<Array<number>>([])
    const itemsRendered = u.stream<ListItem[]>()

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
          u.duc(firstItemIndex)
        ),
        u.filter(([didMount]) => didMount),
        u.withLatestFrom(data),
        u.map(
          ([
            [
              ,
              [startOffset, endOffset],
              totalCount,
              sizes,
              initialTopMostItemIndex,
              scrolledToInitialItem,
              topItemsIndexes,
              firstItemIndex,
            ],
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

            let topItems = [] as Item[]

            if (topItemsIndexes.length > 0) {
              let startIndex = topItemsIndexes[0]
              let endIndex = topItemsIndexes[topItemsIndexes.length - 1]
              let offset = 0
              for (const range of rangesWithin(sizeTree, startIndex, endIndex)) {
                let size = range.value
                let rangeStartIndex = Math.max(range.start, startIndex)
                let rangeEndIndex = Math.min(range.end, endIndex)
                for (let i = rangeStartIndex; i <= rangeEndIndex; i++) {
                  topItems.push({ index: i, size, offset: offset, data: data && data[i] })
                  offset += size
                }
              }
            }

            // If the list hasn't scrolled to the initial item because the initial item was set,
            // render empty list.
            //
            // This is a condition to be avaluated past the probe check, do not merge
            // with the totalcount check above
            if (!scrolledToInitialItem) {
              return buildListState([], topItems, totalCount, sizesValue, firstItemIndex)
            }

            // pull a fresh top group, avoids a bug where
            // scrolling up too fast causes stack overflow
            if (!empty(sizesValue.groupOffsetTree)) {
              topItemsIndexes = [findMaxKeyValue(sizesValue.groupOffsetTree, u.getValue(statefulScrollTop), 'v')[0]]
            }

            let minStartIndex = topItemsIndexes.length > 0 ? topItemsIndexes[topItemsIndexes.length - 1] + 1 : 0
            let startIndex = Math.max(minStartIndex, findMaxKeyValue(offsetTree, startOffset, 'v')[0]!)
            let endIndex = findMaxKeyValue(offsetTree, endOffset, 'v')[0]!
            const maxIndex = totalCount - 1

            const items = u.tap([] as Item[], result => {
              for (const range of rangesWithin(offsetTree, startIndex, endIndex)) {
                let offset = range.value
                let rangeStartIndex = range.start
                let size = find(sizeTree, rangeStartIndex)!

                if (range.value < startOffset) {
                  rangeStartIndex += Math.floor((startOffset - range.value) / size)
                  offset += (rangeStartIndex - range.start) * size
                }

                if (rangeStartIndex < minStartIndex) {
                  offset += (minStartIndex - rangeStartIndex) * size
                  rangeStartIndex = minStartIndex
                }

                let endIndex = Math.min(range.end, maxIndex)

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
        u.filter(data => data !== undefined),
        u.map(data => data!.length)
      ),
      totalCount
    )

    u.connect(u.pipe(listState, u.map(u.prop('topListHeight'))), topListHeight)
    u.connect(topListHeight, rangeTopListHeight)
    u.connect(listState, stateFlags.listStateListener)

    u.connect(
      u.pipe(
        listState,
        u.map(state => [state.top, state.bottom])
      ),
      listBoundary
    )

    u.connect(
      u.pipe(
        listState,
        u.map(state => state.items)
      ),
      itemsRendered
    )

    const endReached = u.streamFromEmitter(
      u.pipe(
        listState,
        u.filter(({ items }) => items.length > 0),
        u.withLatestFrom(totalCount),
        u.filter(([{ items }, totalCount]) => items[items.length - 1].originalIndex === totalCount - 1),
        u.map(([, totalCount]) => totalCount - 1),
        u.distinctUntilChanged()
      )
    )

    const startReached = u.streamFromEmitter(
      u.pipe(
        listState,
        u.filter(({ items, topItems }) => items.length > 0 && items[0].originalIndex === topItems.length),
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
        u.distinctUntilChanged((prev, next) => {
          return prev && prev.startIndex === next.startIndex && prev.endIndex === next.endIndex
        })
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
