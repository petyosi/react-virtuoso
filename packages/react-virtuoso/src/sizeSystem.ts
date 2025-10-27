import { AANode, arrayToRanges, empty, find, findMaxKeyValue, insert, newTree, Range, rangesWithin, remove, walk } from './AATree'
import { SizeFunction, SizeRange } from './interfaces'
import { Log, loggerSystem, LogLevel } from './loggerSystem'
import { recalcSystem } from './recalcSystem'
import * as u from './urx'
import * as arrayBinarySearch from './utils/binaryArraySearch'
import { correctItemSize } from './utils/correctItemSize'

export type Data = readonly unknown[] | undefined

export type FlatOrGroupedLocation = { groupIndex: number } | { index: 'LAST' | number }

export interface OffsetPoint {
  index: number
  offset: number
  size: number
}

export interface SizeState {
  groupIndices: number[]
  groupOffsetTree: AANode<number>
  lastIndex: number
  lastOffset: number
  lastSize: number
  offsetTree: OffsetPoint[]
  sizeTree: AANode<number>
}

type OptionalNumber = number | undefined

export function hasGroups(sizes: SizeState) {
  return !empty(sizes.groupOffsetTree)
}

export function indexComparator({ index: itemIndex }: OffsetPoint, index: number) {
  return index === itemIndex ? 0 : index < itemIndex ? -1 : 1
}

export function initialSizeState(): SizeState {
  return {
    groupIndices: [],
    groupOffsetTree: newTree<number>(),
    lastIndex: 0,
    lastOffset: 0,
    lastSize: 0,
    offsetTree: [],
    sizeTree: newTree<number>(),
  }
}

export function insertRanges(sizeTree: AANode<number>, ranges: SizeRange[]) {
  let syncStart = empty(sizeTree) ? 0 : Infinity

  for (const range of ranges) {
    const { endIndex, size, startIndex } = range
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
    for (const { end: rangeEnd, start: rangeStart, value: rangeValue } of overlappingRanges) {
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

export function isGroupLocation(location: FlatOrGroupedLocation): location is { groupIndex: number } {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return typeof (location as any).groupIndex !== 'undefined'
}

export function offsetComparator({ offset: itemOffset }: OffsetPoint, offset: number) {
  return offset === itemOffset ? 0 : offset < itemOffset ? -1 : 1
}

export function offsetOf(index: number, tree: OffsetPoint[], gap: number) {
  if (tree.length === 0) {
    return 0
  }

  const { index: startIndex, offset, size } = arrayBinarySearch.findClosestSmallerOrEqual(tree, index, indexComparator)
  const itemCount = index - startIndex
  const top = size * itemCount + (itemCount - 1) * gap + offset
  return top > 0 ? top + gap : top
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

export function originalIndexFromLocation(location: FlatOrGroupedLocation, sizes: SizeState, lastIndex: number) {
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

export function rangesWithinOffsets(
  tree: OffsetPoint[],
  startOffset: number,
  endOffset: number,
  minStartIndex = 0
): {
  end: number
  start: number
  value: {
    index: number
    offset: number
    size: number
  }
}[] {
  if (minStartIndex > 0) {
    startOffset = Math.max(startOffset, arrayBinarySearch.findClosestSmallerOrEqual(tree, minStartIndex, indexComparator).offset)
  }

  return arrayToRanges(arrayBinarySearch.findRange(tree, startOffset, endOffset, offsetComparator), offsetPointParser)
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

  const { lastIndex, lastOffset, lastSize, offsetTree: newOffsetTree } = createOffsetTree(state.offsetTree, syncStart, newSizeTree, gap)

  return {
    groupIndices,
    groupOffsetTree: groupIndices.reduce((tree, index) => {
      return insert(tree, index, offsetOf(index, newOffsetTree, gap))
    }, newTree<number>()),
    lastIndex,
    lastOffset,
    lastSize,
    offsetTree: newOffsetTree,
    sizeTree: newSizeTree,
  }
}

export function sizeTreeToRanges(sizeTree: AANode<number>): SizeRange[] {
  return walk(sizeTree).map(({ k: startIndex, v: size }, index, sizeArray) => {
    const nextSize = sizeArray[index + 1]
    const endIndex = nextSize ? nextSize.k - 1 : Infinity

    return { endIndex, size, startIndex }
  })
}

function affectedGroupCount(offset: number, groupIndices: number[]) {
  let recognizedOffsetItems = 0
  let groupIndex = 0
  while (recognizedOffsetItems < offset) {
    recognizedOffsetItems += groupIndices[groupIndex + 1] - groupIndices[groupIndex] - 1
    groupIndex++
  }
  const offsetIsExact = recognizedOffsetItems === offset

  return groupIndex - (offsetIsExact ? 0 : 1)
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
      index: startIndex,
      offset: aOffset,
      size: value,
    })
    prevIndex = startIndex
    prevOffset = aOffset
    prevSize = value
  }

  return {
    lastIndex: prevIndex,
    lastOffset: prevOffset,
    lastSize: prevSize,
    offsetTree,
  }
}

function offsetPointParser(point: OffsetPoint) {
  return { index: point.index, value: point }
}

function rangeIncludes(refRange: SizeRange) {
  const { endIndex, size, startIndex } = refRange
  return (range: Range<number>) => {
    return range.start === startIndex && (range.end === endIndex || range.end === Infinity) && range.value === size
  }
}

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
    const fixedGroupSize = u.statefulStream<OptionalNumber>(undefined)
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
        u.scan((prev, curr) => ({ current: curr, prev: prev.current }), {
          current: [] as number[],
          prev: [] as number[],
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
    // This causes some size loss in for the last items, but it's better than having the wrong measurements
    // see #896
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
              endIndex: lastIndex,
              size: lastSize,
              startIndex: totalCount,
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
        u.filter((itemSize) => {
          return itemSize !== undefined && empty(u.getValue(sizes).sizeTree)
        }),
        u.map((itemSize) => {
          const groupSize = u.getValue(fixedGroupSize)

          if (groupSize) {
            return [
              { endIndex: 0, size: groupSize, startIndex: 0 },
              { endIndex: 1, size: itemSize, startIndex: 1 },
            ] as SizeRange[]
          } else {
            return [{ endIndex: 0, size: itemSize, startIndex: 0 }] as SizeRange[]
          }
        })
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
                endIndex: theGroupIndex,
                size: firstGroupSize,
                startIndex: theGroupIndex,
              })

              initialRanges.push({
                endIndex: theGroupIndex + 1 + groupItemCount - 1,
                size: defaultSize,
                startIndex: theGroupIndex + 1,
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
                      endIndex: index + unshiftWith - 1,
                      size: acc.prevSize,
                      startIndex: acc.prevIndex,
                    },
                  ]
                }

                return {
                  prevIndex: index + unshiftWith,
                  prevSize: size,
                  ranges,
                }
              },
              {
                prevIndex: unshiftWith,
                prevSize: 0,
                ranges: initialRanges,
              }
            ).ranges
          }

          return walk(sizes.sizeTree).reduce(
            (acc, { k: index, v: size }) => {
              return {
                prevIndex: index + unshiftWith,
                prevSize: size,
                ranges: [...acc.ranges, { endIndex: index + unshiftWith - 1, size: acc.prevSize, startIndex: acc.prevIndex }],
              }
            },
            {
              prevIndex: 0,
              prevSize: defaultSize,
              ranges: [] as SizeRange[],
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
      beforeUnshiftWith,
      // input
      data,
      defaultItemSize,
      firstItemIndex,
      fixedItemSize,
      fixedGroupSize,
      gap,
      groupIndices,
      itemSize,
      listRefresh,
      shiftWith,
      shiftWithOffset,
      sizeRanges,

      // output
      sizes,
      statefulTotalCount,
      totalCount,
      trackItemSizes,
      unshiftWith,
    }
  },
  u.tup(loggerSystem, recalcSystem),
  { singleton: true }
)
