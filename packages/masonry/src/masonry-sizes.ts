import { Cell, changeWith, combine, DerivedCell, link, map, pipe, scan, Signal, withLatestFrom } from '@virtuoso.dev/gurx'

import type { OffsetPoint, SizeRange } from './interfaces'

import { totalCount$ } from './data'
import { type AANode, newTree } from './sizing/AATree'
import { insertRanges } from './sizing/insertRanges'
import { offsetTreeReducer } from './sizing/offsetTreeReducer'
import { sizeTreeReducer } from './sizing/sizeTreeReducer'

type SizeTreeState = [AANode, number]
type OffsetTreeState = [OffsetPoint[], number, number, number]

export const masonryRanges$ = Signal<SizeRange[][]>()
export const absoluteSizes$ = Signal<Record<number, number>>()

export const knownSizes$ = Cell<number[]>([], () => {
  changeWith(knownSizes$, absoluteSizes$, (knownSizes, sizes) => {
    const result = knownSizes.slice()
    for (const [index, size] of Object.entries(sizes)) {
      result[Number.parseInt(index, 10)] = size
    }
    // - this is intentional. the array might have holes
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < result.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (result[i] === undefined) {
        return knownSizes
      }
    }
    return result
  })
})

export const columnCount$ = Cell(0)
export const initialItemCount$ = Cell(0)

const sizeTreesState$ = Cell<SizeTreeState[]>([], () => {
  link(
    pipe(
      columnCount$,
      withLatestFrom(knownSizes$),
      map(([columnCount, knownSizes]) => {
        const newSizeTreeState = Array.from({ length: columnCount }, () => [newTree(), 0] as SizeTreeState)
        // we have known sizes, so we need to re-distribute them to the new columns
        if (knownSizes.length > 0) {
          const columnHeights = Array.from({ length: columnCount }, () => 0)
          const columnCounts = Array.from({ length: columnCount }, () => 0)

          // eslint-disable-next-line @typescript-eslint/prefer-for-of
          for (let i = 0; i < knownSizes.length; i++) {
            const size = knownSizes[i]

            // find the shortest column
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
            const indexInTree = columnCounts[shortestColumnIndex]
            columnCounts[shortestColumnIndex]++
            columnHeights[shortestColumnIndex] += size
            newSizeTreeState[shortestColumnIndex] = insertRanges(newSizeTreeState[shortestColumnIndex][0], [
              { endIndex: indexInTree, size, startIndex: indexInTree },
            ])
          }
        }
        return newSizeTreeState.map(([tree]) => [tree, 0])
      })
    ),
    sizeTreesState$
  )

  changeWith(sizeTreesState$, masonryRanges$, (sizeTreesState, ranges) => {
    const trees = sizeTreesState.map(([tree]) => tree)
    const sizeTrees: SizeTreeState[] = []
    for (let i = 0; i < ranges.length; i++) {
      const tree = trees[i] ?? newTree()
      const columnRanges = ranges[i]
      if (columnRanges.length === 0) {
        sizeTrees.push([tree, 0])
        continue
      }
      sizeTrees.push(sizeTreeReducer(tree, [ranges[i], []]))
    }

    return sizeTrees
  })
})

export const sizeTrees$ = DerivedCell<AANode[]>([], () => {
  return pipe(
    sizeTreesState$,
    map((trees: SizeTreeState[]) => trees.map(([tree]) => tree))
  )
})

const lastRangeStarts$ = DerivedCell<number[]>([], (r) => {
  return r.pipe(
    sizeTreesState$,
    map((trees) => trees.map(([, lastRangeStart]) => lastRangeStart))
  )
})

const offsetTreesState$ = DerivedCell<OffsetTreeState[]>([], () => {
  return pipe(
    sizeTrees$,
    withLatestFrom(lastRangeStarts$),
    scan((offsetTrees, [sizeTrees, lastRangeStarts]) => {
      const newOffsetTrees = []
      for (let i = 0; i < sizeTrees.length; i++) {
        const offsetTree = offsetTrees[i] ?? [[]]
        newOffsetTrees.push(offsetTreeReducer(offsetTree[0], [sizeTrees[i], lastRangeStarts[i]]))
      }

      return newOffsetTrees
    }, [] as OffsetTreeState[])
  )
})

export const offsetTrees$ = DerivedCell<OffsetPoint[][]>([], () =>
  pipe(
    offsetTreesState$,
    map((state) => state.map(([tree]) => tree))
  )
)

const lastHeights$ = DerivedCell<number[]>([], () =>
  pipe(
    offsetTreesState$,
    map((state) => state.map(([, lastHeight]) => lastHeight))
  )
)

const lastOffsets$ = DerivedCell<number[]>([], () =>
  pipe(
    offsetTreesState$,
    map((state) => state.map(([, , lastOffset]) => lastOffset))
  )
)

const lastItemIndexes$ = DerivedCell<number[]>([], (r) =>
  r.pipe(
    offsetTreesState$,
    map((state) => state.map(([, , , lastItemIndex]) => lastItemIndex))
  )
)

export const indexesInColumns$ = DerivedCell<number[][]>([], () => {
  return pipe(
    columnCount$,
    withLatestFrom(totalCount$, initialItemCount$, knownSizes$),
    map(([columnCount, totalCount, initialItemCount, knownSizes]) => {
      // we have known sizes, so we need to re-distribute them to the new columns
      if (knownSizes.length > 0) {
        const columnHeights = Array.from({ length: columnCount }, () => 0)
        const indexesInColumns: number[][] = Array.from({ length: columnCount }, () => [])

        for (let i = 0; i < knownSizes.length; i++) {
          const size = knownSizes[i]
          // find the shortest column
          const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))

          indexesInColumns[shortestColumnIndex].push(i)
          columnHeights[shortestColumnIndex] += size
        }

        return indexesInColumns
      }
      const itemsToRenderInitially = initialItemCount === 0 ? Math.min(columnCount, totalCount) : initialItemCount
      const indexesInColumns = Array.from({ length: columnCount }, (_, columnIndex) => {
        const indexes: number[] = []
        for (let i = columnIndex; i < itemsToRenderInitially; i += columnCount) {
          indexes.push(i)
        }
        return indexes
      })

      return indexesInColumns
    })
  )
})

export const totalHeights$ = DerivedCell<number[]>([], () =>
  pipe(
    combine(columnCount$, totalCount$, lastItemIndexes$, lastOffsets$, lastHeights$, indexesInColumns$),
    map(([columnCount, totalCount, lastItemIndexes, lastOffsets, lastHeights, indexesInColumns]) => {
      const distributedItems = indexesInColumns.reduce((acc, indexes) => acc + indexes.length, 0)
      const remainingItemsPerColumn = Math.ceil((totalCount - distributedItems) / columnCount)

      const result = Array.from({ length: columnCount }, (_, i) => {
        const itemsInColumn = indexesInColumns[i].length + remainingItemsPerColumn
        const itemsToUseLastHeight = itemsInColumn - lastItemIndexes[i]
        return lastOffsets[i] + itemsToUseLastHeight * lastHeights[i]
      })
      return result
    })
  )
)
