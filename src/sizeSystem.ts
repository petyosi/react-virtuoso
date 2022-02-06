import * as u from '@virtuoso.dev/urx'
import { arrayToRanges, AANode, empty, findMaxKeyValue, insert, newTree, Range, rangesWithin, remove, walk } from './AATree'
import * as arrayBinarySearch from './utils/binaryArraySearch'
import { correctItemSize } from './utils/correctItemSize'
import { loggerSystem, Log, LogLevel } from './loggerSystem'

export interface SizeRange {
  startIndex: number
  endIndex: number
  size: number
}

export type Data = readonly unknown[] | undefined

function rangeIncludes(refRange: SizeRange) {
  const { size, startIndex, endIndex } = refRange
  return (range: Range<number>) => {
    return range.start === startIndex && (range.end === endIndex || range.end === Infinity) && range.value === size
  }
}

export function insertRanges(sizeTree: AANode<number>, ranges: SizeRange[]) {
  let syncStart = empty(sizeTree) ? 0 : Infinity

  for (const range of ranges) {
    const { size, startIndex, endIndex } = range
    syncStart = Math.min(syncStart, startIndex)

    if (empty(sizeTree)) {
      sizeTree = insert(sizeTree, 0, size)
      continue
    }

    // extend the range in both directions, so that we can get adjacent neighbours.
    // if the previous / next ones have the same value as the one we are about to insert,
    // we 'merge' them.
    const overlappingRanges = rangesWithin(sizeTree, startIndex - 1, endIndex + 1)

    if (overlappingRanges.some(rangeIncludes(range))) {
      continue
    }

    let firstPassDone = false
    let shouldInsert = false
    for (const { start: rangeStart, end: rangeEnd, value: rangeValue } of overlappingRanges) {
      // previous range
      if (!firstPassDone) {
        shouldInsert = rangeValue !== size
        firstPassDone = true
      } else {
        // remove the range if it starts within the new range OR if
        // it has the same value as it, in order to perform a merge
        if (endIndex >= rangeStart || size === rangeValue) {
          sizeTree = remove(sizeTree, rangeStart)
        }
      }

      // next range
      if (rangeEnd > endIndex && endIndex >= rangeStart) {
        if (rangeValue !== size) {
          sizeTree = insert(sizeTree, endIndex + 1, rangeValue)
        }
      }
    }

    if (shouldInsert) {
      sizeTree = insert(sizeTree, startIndex, size)
    }
  }
  return [sizeTree, syncStart] as const
}

export interface OffsetPoint {
  offset: number
  size: number
  index: number
}

export interface SizeState {
  sizeTree: AANode<number>
  offsetTree: Array<OffsetPoint>
  groupOffsetTree: AANode<number>
  lastIndex: number
  lastOffset: number
  lastSize: number
  groupIndices: number[]
}

export function initialSizeState(): SizeState {
  return {
    offsetTree: [],
    sizeTree: newTree<number>(),
    groupOffsetTree: newTree<number>(),
    lastIndex: 0,
    lastOffset: 0,
    lastSize: 0,
    groupIndices: [],
  }
}

export function indexComparator({ index: itemIndex }: OffsetPoint, index: number) {
  return index === itemIndex ? 0 : index < itemIndex ? -1 : 1
}

export function offsetComparator({ offset: itemOffset }: OffsetPoint, offset: number) {
  return offset === itemOffset ? 0 : offset < itemOffset ? -1 : 1
}

function offsetPointParser(point: OffsetPoint) {
  return { index: point.index, value: point }
}

export function rangesWithinOffsets(
  tree: Array<OffsetPoint>,
  startOffset: number,
  endOffset: number,
  minStartIndex = 0
): Array<{
  start: number
  end: number
  value: {
    size: number
    offset: number
    index: number
  }
}> {
  if (minStartIndex > 0) {
    startOffset = Math.max(startOffset, arrayBinarySearch.findClosestSmallerOrEqual(tree, minStartIndex, indexComparator).offset)
  }

  return arrayToRanges(arrayBinarySearch.findRange(tree, startOffset, endOffset, offsetComparator), offsetPointParser)
}

export function sizeStateReducer(state: SizeState, [ranges, groupIndices, log]: [SizeRange[], number[], Log]) {
  if (ranges.length > 0) {
    log('received item sizes', ranges, LogLevel.DEBUG)
  }
  const sizeTree = state.sizeTree
  let offsetTree = state.offsetTree
  let newSizeTree: AANode<number> = sizeTree
  let syncStart = 0

  // We receive probe item results from a group probe,
  // which should always pass an item and a group
  // the results contain two ranges, which we consider to mean that groups and items have different size
  if (groupIndices.length > 0 && empty(sizeTree) && ranges.length === 2) {
    const groupSize = ranges[0].size
    const itemSize = ranges[1].size
    newSizeTree = groupIndices.reduce((tree, groupIndex) => {
      return insert(insert(tree, groupIndex, groupSize), groupIndex + 1, itemSize)
    }, newSizeTree)
  } else {
    ;[newSizeTree, syncStart] = insertRanges(newSizeTree, ranges)
  }

  if (newSizeTree === sizeTree) {
    return state
  }

  let prevIndex = 0
  let prevSize = 0

  let prevAOffset = 0
  let startAIndex = 0

  if (syncStart !== 0) {
    startAIndex = arrayBinarySearch.findIndexOfClosestSmallerOrEqual(offsetTree, syncStart - 1, indexComparator)
    const offsetInfo = offsetTree[startAIndex]
    prevAOffset = offsetInfo.offset
    const kv = findMaxKeyValue(newSizeTree, syncStart - 1)
    prevIndex = kv[0]
    prevSize = kv[1]!

    if (offsetTree.length && offsetTree[startAIndex].size === findMaxKeyValue(newSizeTree, syncStart)[1]) {
      startAIndex -= 1
    }

    offsetTree = offsetTree.slice(0, startAIndex + 1)
  } else {
    offsetTree = []
  }

  for (const { start: startIndex, value } of rangesWithin(newSizeTree, syncStart, Infinity)) {
    const aOffset = (startIndex - prevIndex) * prevSize + prevAOffset
    offsetTree.push({
      offset: aOffset,
      size: value,
      index: startIndex,
    })
    prevIndex = startIndex
    prevAOffset = aOffset
    prevSize = value
  }

  return {
    sizeTree: newSizeTree,
    offsetTree,
    groupOffsetTree: groupIndices.reduce((tree, index) => {
      return insert(tree, index, offsetOf(index, offsetTree))
    }, newTree<number>()),
    lastIndex: prevIndex,
    lastOffset: prevAOffset,
    lastSize: prevSize,
    groupIndices,
  }
}

export function offsetOf(index: number, tree: Array<OffsetPoint>) {
  if (tree.length === 0) {
    return 0
  }

  const { offset, index: startIndex, size } = arrayBinarySearch.findClosestSmallerOrEqual(tree, index, indexComparator)
  return size * (index - startIndex) + offset
}

export function originalIndexFromItemIndex(itemIndex: number, sizes: SizeState) {
  if (!hasGroups(sizes)) {
    return itemIndex
  }

  let groupOffset = 0
  while (sizes.groupIndices[groupOffset] <= itemIndex + groupOffset) {
    groupOffset++
  }
  // we find the real item index, offsetting it by the number of group items before it
  return itemIndex + groupOffset
}

export function hasGroups(sizes: SizeState) {
  return !empty(sizes.groupOffsetTree)
}

type OptionalNumber = number | undefined

const SIZE_MAP = {
  offsetHeight: 'height',
  offsetWidth: 'width',
} as const

/** Calculates the height of `el`, which will be the `Item` element in the DOM. */
export type SizeFunction = (el: HTMLElement, field: 'offsetHeight' | 'offsetWidth') => number

export const sizeSystem = u.system(
  ([{ log }]) => {
    const sizeRanges = u.stream<SizeRange[]>()
    const totalCount = u.stream<number>()
    const statefulTotalCount = u.statefulStreamFromEmitter(totalCount, 0)
    const unshiftWith = u.stream<number>()
    const firstItemIndex = u.statefulStream(0)
    const groupIndices = u.statefulStream([] as number[])
    const fixedItemSize = u.statefulStream<OptionalNumber>(undefined)
    const defaultItemSize = u.statefulStream<OptionalNumber>(undefined)
    const itemSize = u.statefulStream<SizeFunction>((el, field) => correctItemSize(el, SIZE_MAP[field]))
    const data = u.statefulStream<Data>(undefined)
    const initial = initialSizeState()

    const sizes = u.statefulStreamFromEmitter(
      u.pipe(sizeRanges, u.withLatestFrom(groupIndices, log), u.scan(sizeStateReducer, initial), u.distinctUntilChanged()),
      initial
    )

    u.connect(
      u.pipe(
        groupIndices,
        u.filter((indexes) => indexes.length > 0),
        u.withLatestFrom(sizes),
        u.map(([groupIndices, sizes]) => {
          const groupOffsetTree = groupIndices.reduce((tree, index, idx) => {
            return insert(tree, index, offsetOf(index, sizes.offsetTree) || idx)
          }, newTree<number>())

          return {
            ...sizes,
            groupIndices,
            groupOffsetTree,
          }
        })
      ),
      sizes
    )

    // decreasing the total count should remove any existing entries
    // beyond the last index - do this by publishing the default size as a range over them.
    u.connect(
      u.pipe(
        totalCount,
        u.withLatestFrom(sizes),
        u.filter(([totalCount, { lastIndex }]) => {
          return totalCount < lastIndex
        }),
        u.map(([totalCount, { lastIndex, lastSize }]) => {
          return [
            {
              startIndex: totalCount,
              endIndex: lastIndex,
              size: lastSize,
            },
          ] as SizeRange[]
        })
      ),
      sizeRanges
    )

    u.connect(fixedItemSize, defaultItemSize)

    const trackItemSizes = u.statefulStreamFromEmitter(
      u.pipe(
        fixedItemSize,
        u.map((size) => size === undefined)
      ),
      true
    )

    u.connect(
      u.pipe(
        defaultItemSize,
        u.filter((value) => {
          return value !== undefined && empty(u.getValue(sizes).sizeTree)
        }),
        u.map((size) => [{ startIndex: 0, endIndex: 0, size }] as SizeRange[])
      ),
      sizeRanges
    )

    const listRefresh = u.streamFromEmitter(
      u.pipe(
        sizeRanges,
        u.withLatestFrom(sizes),
        u.scan(
          ({ sizes: oldSizes }, [_, newSizes]) => {
            return {
              changed: newSizes !== oldSizes,
              sizes: newSizes,
            }
          },
          { changed: false, sizes: initial }
        ),
        u.map((value) => value.changed)
      )
    )

    u.connect(
      u.pipe(
        firstItemIndex,
        u.scan(
          (prev, next) => {
            return { diff: prev.prev - next, prev: next }
          },
          { diff: 0, prev: 0 }
        ),
        u.map((val) => val.diff),
        u.filter((value) => value > 0)
      ),
      unshiftWith
    )

    u.subscribe(u.pipe(firstItemIndex, u.withLatestFrom(log)), ([index, log]) => {
      if (index < 0) {
        log(
          "`firstItemIndex` prop should not be set to less than zero. If you don't know the total count, just use a very high value",
          { firstItemIndex },
          LogLevel.ERROR
        )
      }
    })

    // Capture the current list top item before the sizes get refreshed
    const beforeUnshiftWith = u.streamFromEmitter(unshiftWith)

    u.connect(
      u.pipe(
        unshiftWith,
        u.withLatestFrom(sizes),
        u.map(([unshiftWith, sizes]) => {
          if (sizes.groupIndices.length > 0) {
            throw new Error('Virtuoso: prepending items does not work with groups')
          }

          return walk(sizes.sizeTree).reduce(
            (acc, { k: index, v: size }) => {
              return {
                ranges: [...acc.ranges, { startIndex: acc.prevIndex, endIndex: index + unshiftWith - 1, size: acc.prevSize }],
                prevIndex: index + unshiftWith,
                prevSize: size,
              }
            },
            {
              ranges: [] as SizeRange[],
              prevIndex: 0,
              prevSize: sizes.lastSize,
            }
          ).ranges
        })
      ),
      sizeRanges
    )

    return {
      // input
      data,
      totalCount,
      sizeRanges,
      groupIndices,
      defaultItemSize,
      fixedItemSize,
      unshiftWith,
      beforeUnshiftWith,
      firstItemIndex,

      // output
      sizes,
      listRefresh,
      statefulTotalCount,
      trackItemSizes,
      itemSize,
    }
  },
  u.tup(loggerSystem),
  { singleton: true }
)
