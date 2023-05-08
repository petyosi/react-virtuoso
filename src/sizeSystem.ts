import * as u from './urx'
import { AANode, arrayToRanges, empty, find, findMaxKeyValue, insert, newTree, Range, rangesWithin, remove, walk } from './AATree'
import * as arrayBinarySearch from './utils/binaryArraySearch'
import { correctItemSize } from './utils/correctItemSize'
import { Log, loggerSystem, LogLevel } from './loggerSystem'
import { recalcSystem } from './recalcSystem'
import { SizeFunction, SizeRange } from './interfaces'

export type Data = readonly unknown[] | undefined

function rangeIncludes(refRange: SizeRange) {
  const { size, startIndex, endIndex } = refRange
  return (range: Range<number>) => {
    return range.start === startIndex && (range.end === endIndex || range.end === Infinity) && range.value === size
  }
}

function affectedGroupCount(offset: number, groupIndices: Array<number>) {
  let recognizedOffsetItems = 0
  let groupIndex = 0
  while (recognizedOffsetItems < offset) {
    recognizedOffsetItems += groupIndices[groupIndex + 1] - groupIndices[groupIndex] - 1
    groupIndex++
  }
  const offsetIsExact = recognizedOffsetItems === offset

  return groupIndex - (offsetIsExact ? 0 : 1)
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

function createOffsetTree(prevOffsetTree: OffsetPoint[], syncStart: number, sizeTree: AANode<number>, gap: number) {
  let offsetTree = prevOffsetTree
  let prevIndex = 0
  let prevSize = 0

  let prevOffset = 0
  let startIndex = 0

  if (syncStart !== 0) {
    startIndex = arrayBinarySearch.findIndexOfClosestSmallerOrEqual(offsetTree, syncStart - 1, indexComparator)
    const offsetInfo = offsetTree[startIndex]
    prevOffset = offsetInfo.offset
    const kv = findMaxKeyValue(sizeTree, syncStart - 1)
    prevIndex = kv[0]
    prevSize = kv[1]!

    if (offsetTree.length && offsetTree[startIndex].size === findMaxKeyValue(sizeTree, syncStart)[1]) {
      startIndex -= 1
    }

    offsetTree = offsetTree.slice(0, startIndex + 1)
  } else {
    offsetTree = []
  }

  for (const { start: startIndex, value } of rangesWithin(sizeTree, syncStart, Infinity)) {
    const indexOffset = startIndex - prevIndex
    const aOffset = indexOffset * prevSize + prevOffset + indexOffset * gap
    offsetTree.push({
      offset: aOffset,
      size: value,
      index: startIndex,
    })
    prevIndex = startIndex
    prevOffset = aOffset
    prevSize = value
  }

  return {
    offsetTree,
    lastIndex: prevIndex,
    lastOffset: prevOffset,
    lastSize: prevSize,
  }
}

export function sizeStateReducer(state: SizeState, [ranges, groupIndices, log, gap]: [SizeRange[], number[], Log, number]) {
  if (ranges.length > 0) {
    log('received item sizes', ranges, LogLevel.DEBUG)
  }
  const sizeTree = state.sizeTree
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

  const { offsetTree: newOffsetTree, lastIndex, lastSize, lastOffset } = createOffsetTree(state.offsetTree, syncStart, newSizeTree, gap)

  return {
    sizeTree: newSizeTree,
    offsetTree: newOffsetTree,
    lastIndex,
    lastOffset,
    lastSize,
    groupOffsetTree: groupIndices.reduce((tree, index) => {
      return insert(tree, index, offsetOf(index, newOffsetTree, gap))
    }, newTree<number>()),
    groupIndices,
  }
}

export function offsetOf(index: number, tree: Array<OffsetPoint>, gap: number) {
  if (tree.length === 0) {
    return 0
  }

  const { offset, index: startIndex, size } = arrayBinarySearch.findClosestSmallerOrEqual(tree, index, indexComparator)
  const itemCount = index - startIndex
  const top = size * itemCount + (itemCount - 1) * gap + offset
  return top > 0 ? top + gap : top
}

export type FlatOrGroupedLocation = { index: number | 'LAST' } | { groupIndex: number }

export function isGroupLocation(location: FlatOrGroupedLocation): location is { groupIndex: number } {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return typeof (location as any).groupIndex !== 'undefined'
}

export function originalIndexFromLocation(location: FlatOrGroupedLocation, sizes: SizeState, lastIndex: number) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (isGroupLocation(location)) {
    // return the index of the first item below the index
    return sizes.groupIndices[location.groupIndex] + 1
  } else {
    const numericIndex = location.index === 'LAST' ? lastIndex : location.index
    let result = originalIndexFromItemIndex(numericIndex, sizes)
    result = Math.max(0, result, Math.min(lastIndex, result))
    return result
  }
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

export function sizeTreeToRanges(sizeTree: AANode<number>): SizeRange[] {
  return walk(sizeTree).map(({ k: startIndex, v: size }, index, sizeArray) => {
    const nextSize = sizeArray[index + 1]
    const endIndex = nextSize ? nextSize.k - 1 : Infinity

    return { startIndex, endIndex, size }
  })
}

type OptionalNumber = number | undefined

const SIZE_MAP = {
  offsetHeight: 'height',
  offsetWidth: 'width',
} as const

export const sizeSystem = u.system(
  ([{ log }, { recalcInProgress }]) => {
    const sizeRanges = u.stream<SizeRange[]>()
    const totalCount = u.stream<number>()
    const statefulTotalCount = u.statefulStreamFromEmitter(totalCount, 0)
    const unshiftWith = u.stream<number>()
    const shiftWith = u.stream<number>()
    const firstItemIndex = u.statefulStream(0)
    const groupIndices = u.statefulStream([] as number[])

    const fixedItemSize = u.statefulStream<OptionalNumber>(undefined)
    const defaultItemSize = u.statefulStream<OptionalNumber>(undefined)
    const itemSize = u.statefulStream<SizeFunction>((el, field) => correctItemSize(el, SIZE_MAP[field]))
    const data = u.statefulStream<Data>(undefined)
    const gap = u.statefulStream(0)
    const initial = initialSizeState()

    const sizes = u.statefulStreamFromEmitter(
      u.pipe(sizeRanges, u.withLatestFrom(groupIndices, log, gap), u.scan(sizeStateReducer, initial), u.distinctUntilChanged()),
      initial
    )

    const prevGroupIndices = u.statefulStreamFromEmitter(
      u.pipe(
        groupIndices,
        u.distinctUntilChanged(),
        u.scan((prev, curr) => ({ prev: prev.current, current: curr }), {
          prev: [] as number[],
          current: [] as number[],
        }),
        u.map(({ prev }) => prev)
      ),
      []
    )

    u.connect(
      u.pipe(
        groupIndices,
        u.filter((indexes) => indexes.length > 0),
        u.withLatestFrom(sizes, gap),
        u.map(([groupIndices, sizes, gap]) => {
          const groupOffsetTree = groupIndices.reduce((tree, index, idx) => {
            return insert(tree, index, offsetOf(index, sizes.offsetTree, gap) || idx)
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
        u.filter(([totalCount, { lastIndex, groupIndices }]) => {
          // if we have groups, we will take care of it in the
          return totalCount < lastIndex && groupIndices.length === 0
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

    u.subscribe(
      u.pipe(
        firstItemIndex,
        u.scan(
          (prev, next) => {
            return { diff: prev.prev - next, prev: next }
          },
          { diff: 0, prev: 0 }
        ),
        u.map((val) => val.diff)
      ),
      (offset) => {
        const { groupIndices } = u.getValue(sizes)
        if (offset > 0) {
          u.publish(recalcInProgress, true)
          u.publish(unshiftWith, offset + affectedGroupCount(offset, groupIndices))
        } else if (offset < 0) {
          const prevGroupIndicesValue = u.getValue(prevGroupIndices)

          if (prevGroupIndicesValue.length > 0) {
            offset -= affectedGroupCount(-offset, prevGroupIndicesValue)
          }
          u.publish(shiftWith, offset)
        }
      }
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
          const groupedMode = sizes.groupIndices.length > 0
          const initialRanges: SizeRange[] = []
          const defaultSize = sizes.lastSize
          if (groupedMode) {
            const firstGroupSize = find(sizes.sizeTree, 0)!

            let prependedGroupItemsCount = 0
            let groupIndex = 0

            while (prependedGroupItemsCount < unshiftWith) {
              const theGroupIndex = sizes.groupIndices[groupIndex]
              const groupItemCount =
                sizes.groupIndices.length === groupIndex + 1 ? Infinity : sizes.groupIndices[groupIndex + 1] - theGroupIndex - 1

              initialRanges.push({
                startIndex: theGroupIndex,
                endIndex: theGroupIndex,
                size: firstGroupSize,
              })

              initialRanges.push({
                startIndex: theGroupIndex + 1,
                endIndex: theGroupIndex + 1 + groupItemCount - 1,
                size: defaultSize,
              })
              groupIndex++
              prependedGroupItemsCount += groupItemCount + 1
            }

            const sizeTreeKV = walk(sizes.sizeTree)

            // here, we detect if the first group item size has increased, so that we can delete its value.
            const firstGroupIsExpanded = prependedGroupItemsCount !== unshiftWith

            if (firstGroupIsExpanded) {
              // remove the first group item size, already incorporated
              sizeTreeKV.shift()
            }

            return sizeTreeKV.reduce(
              (acc, { k: index, v: size }) => {
                let ranges: SizeRange[] = acc.ranges

                if (acc.prevSize !== 0) {
                  ranges = [
                    ...acc.ranges,
                    {
                      startIndex: acc.prevIndex,
                      endIndex: index + unshiftWith - 1,
                      size: acc.prevSize,
                    },
                  ]
                }

                return {
                  ranges,
                  prevIndex: index + unshiftWith,
                  prevSize: size,
                }
              },
              {
                ranges: initialRanges,
                prevIndex: unshiftWith,
                prevSize: 0,
              }
            ).ranges
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
              prevSize: defaultSize,
            }
          ).ranges
        })
      ),
      sizeRanges
    )

    const shiftWithOffset = u.streamFromEmitter(
      u.pipe(
        shiftWith,
        u.withLatestFrom(sizes, gap),
        u.map(([shiftWith, { offsetTree }, gap]) => {
          const newFirstItemIndex = -shiftWith
          return offsetOf(newFirstItemIndex, offsetTree, gap)
        })
      )
    )

    u.connect(
      u.pipe(
        shiftWith,
        u.withLatestFrom(sizes, gap),
        u.map(([shiftWith, sizes, gap]) => {
          const groupedMode = sizes.groupIndices.length > 0
          if (groupedMode) {
            // we can't shift an empty tree
            if (empty(sizes.sizeTree)) {
              return sizes
            }
            let newSizeTree = newTree<number>()
            const prevGroupIndicesValue = u.getValue(prevGroupIndices)
            let removedItemsCount = 0
            let groupIndex = 0
            let groupOffset = 0

            while (removedItemsCount < -shiftWith) {
              groupOffset = prevGroupIndicesValue[groupIndex]
              const groupItemCount = prevGroupIndicesValue[groupIndex + 1] - groupOffset - 1
              groupIndex++
              removedItemsCount += groupItemCount + 1
            }

            newSizeTree = walk(sizes.sizeTree).reduce((acc, { k, v }) => {
              return insert(acc, Math.max(0, k + shiftWith), v)
            }, newSizeTree)

            // here, we detect if the first group item size has increased, so that we can delete its value.
            const aGroupIsShrunk = removedItemsCount !== -shiftWith

            if (aGroupIsShrunk) {
              const firstGroupSize = find(sizes.sizeTree, groupOffset)!
              newSizeTree = insert(newSizeTree, 0, firstGroupSize)
              const nextItemSize = findMaxKeyValue(sizes.sizeTree, -shiftWith + 1)[1]!
              newSizeTree = insert(newSizeTree, 1, nextItemSize)
            }

            return {
              ...sizes,
              sizeTree: newSizeTree,
              ...createOffsetTree(sizes.offsetTree, 0, newSizeTree, gap),
            }
          } else {
            const newSizeTree = walk(sizes.sizeTree).reduce((acc, { k, v }) => {
              return insert(acc, Math.max(0, k + shiftWith), v)
            }, newTree<number>())

            return {
              ...sizes,
              sizeTree: newSizeTree,
              ...createOffsetTree(sizes.offsetTree, 0, newSizeTree, gap),
            }
          }
        })
      ),
      sizes
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
      shiftWith,
      shiftWithOffset,
      beforeUnshiftWith,
      firstItemIndex,
      gap,

      // output
      sizes,
      listRefresh,
      statefulTotalCount,
      trackItemSizes,
      itemSize,
    }
  },
  u.tup(loggerSystem, recalcSystem),
  { singleton: true }
)
