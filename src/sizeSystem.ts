import * as u from '@virtuoso.dev/urx'
import { AANode, empty, find, findMaxKeyValue, insert, newTree, Range, rangesWithin, remove, walk } from './AATree'

export interface SizeRange {
  startIndex: number
  endIndex: number
  size: number
}

export type Data = any[] | undefined

function rangeIncludes(refRange: SizeRange) {
  const { size, startIndex, endIndex } = refRange
  return (range: Range<number>) => {
    return range.start === startIndex && (range.end === endIndex || range.end === Infinity) && range.value === size
  }
}

export function insertRanges(sizeTree: AANode<number>, ranges: SizeRange[], onRemove: (index: number) => void = () => {}) {
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
        // it has the same value as it, in order to perfrom a merge
        if (endIndex >= rangeStart || size === rangeValue) {
          sizeTree = remove(sizeTree, rangeStart)
          onRemove(rangeStart)
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

export interface SizeState {
  sizeTree: AANode<number>
  offsetTree: AANode<number>
  groupOffsetTree: AANode<number>
  lastIndex: number
  lastOffset: number
  lastSize: number
  groupIndices: number[]
}

export function initialSizeState(): SizeState {
  return {
    offsetTree: newTree<number>(),
    sizeTree: newTree<number>(),
    groupOffsetTree: newTree<number>(),
    lastIndex: 0,
    lastOffset: 0,
    lastSize: 0,
    groupIndices: [],
  }
}

export function sizeStateReducer(state: SizeState, [ranges, groupIndices]: [SizeRange[], number[]]) {
  let { sizeTree, offsetTree } = state
  let newSizeTree: AANode<number> = sizeTree as AANode<number>
  let syncStart: number = 0

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
    ;[newSizeTree, syncStart] = insertRanges(newSizeTree, ranges, index => {
      offsetTree = remove(offsetTree, index)
    })
  }

  if (newSizeTree === sizeTree) {
    return state
  }

  let prevOffset = 0
  let prevIndex = 0
  let prevSize = 0

  if (syncStart !== 0) {
    prevOffset = findMaxKeyValue(offsetTree, syncStart - 1)[1]!
    const kv = findMaxKeyValue(newSizeTree, syncStart - 1)
    prevIndex = kv[0]
    prevSize = kv[1]!
  } else {
    prevSize = find(newSizeTree, 0)!
  }

  for (const { start: startIndex, value } of rangesWithin(newSizeTree, syncStart, Infinity)) {
    const offset = (startIndex - prevIndex!) * prevSize! + prevOffset
    offsetTree = insert(offsetTree, startIndex, offset)
    prevIndex = startIndex
    prevOffset = offset
    prevSize = value
  }

  return {
    offsetTree: offsetTree,
    sizeTree: newSizeTree,
    groupOffsetTree: groupIndices.reduce((tree, index) => {
      return insert(tree, index, offsetOf(index, { offsetTree, sizeTree: newSizeTree }))
    }, newTree<number>()),
    lastIndex: prevIndex!,
    lastOffset: prevOffset,
    lastSize: prevSize!,
    groupIndices,
  }
}

export function offsetOf(index: number, state: Pick<SizeState, 'sizeTree' | 'offsetTree'>) {
  void index
  void state

  if (empty(state.offsetTree)) {
    return 0
  }

  const [startIndex, startOffset] = findMaxKeyValue(state.offsetTree, index)
  const size = findMaxKeyValue(state.sizeTree, index)[1]
  return size! * (index - startIndex) + startOffset!
}

export function originalIndexFromItemIndex(itemIndex: number, sizes: SizeState) {
  if (empty(sizes.groupOffsetTree)) {
    return itemIndex
  }

  let groupOffset = 0
  while (sizes.groupIndices[groupOffset] <= itemIndex + groupOffset) {
    groupOffset++
  }
  // we find the real item index, offseting it by the number of group items before it
  return itemIndex + groupOffset
}

type OptionalNumber = number | undefined
export const sizeSystem = u.system(
  () => {
    const sizeRanges = u.stream<SizeRange[]>()
    const totalCount = u.stream<number>()
    const unshiftWith = u.stream<number>()
    const firstItemIndex = u.statefulStream(0)
    const groupIndices = u.statefulStream([] as number[])
    const fixedItemSize = u.statefulStream<OptionalNumber>(undefined)
    const defaultItemSize = u.statefulStream<OptionalNumber>(undefined)
    const data = u.statefulStream<Data>(undefined)
    const initial = initialSizeState()

    const sizes = u.statefulStreamFromEmitter(
      u.pipe(sizeRanges, u.withLatestFrom(groupIndices), u.scan(sizeStateReducer, initial), u.distinctUntilChanged()),
      initial
    )

    u.connect(
      u.pipe(
        groupIndices,
        u.filter(indexes => indexes.length > 0),
        u.withLatestFrom(sizes),
        u.map(([groupIndices, sizes]) => {
          // the initial pass through that finds empty sizes,
          // so we record the first group only
          const groupOffsetTree = false
            ? insert(newTree<number>(), 0, 0)
            : groupIndices.reduce((tree, index, idx) => {
                return insert(tree, index, offsetOf(index, sizes) || idx)
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

    u.connect(fixedItemSize, defaultItemSize)

    const trackItemSizes = u.statefulStreamFromEmitter(
      u.pipe(
        fixedItemSize,
        u.map(size => size === undefined)
      ),
      true
    )

    u.connect(
      u.pipe(
        defaultItemSize,
        u.filter(value => value !== undefined),
        u.map(size => [{ startIndex: 0, endIndex: 0, size }] as SizeRange[])
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
        u.map(value => value.changed)
      )
    )

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

    u.connect(
      u.pipe(
        firstItemIndex,
        u.scan(
          (prev, next) => {
            return { diff: prev.prev - next, prev: next }
          },
          { diff: 0, prev: 0 }
        ),
        u.map(val => val.diff),
        u.filter(value => value > 0)
      ),
      unshiftWith
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
      firstItemIndex,

      // output
      sizes,
      listRefresh,
      trackItemSizes,
    }
  },
  [],
  { singleton: true }
)
