import { Cell, combine, filter, link, pipe, pub, scan, sub } from '@virtuoso.dev/gurx'
import { data$, totalCount$ } from './data'
import { listOffset$, listScrollTop$, useWindowScroll$, visibleListHeight$ } from './dom'
import type { Data, OffsetPoint } from './interfaces'
import { columnCount$, indexesInColumns$, initialItemCount$, offsetTrees$, sizeTrees$, totalHeights$ } from './masonry-sizes'
import { empty, newTree } from './sizing/AATree'
import { rangesWithinOffsets } from './sizing/rangesWithinOffsets'

export interface MasonryItem<T> {
  data: T
  height: number
  index: number
  columnIndex: number
  indexInColumn: number
  offset: number
}

interface ColumnItemsState<T> {
  index: number
  items: MasonryItem<T>[]
  listBottom: number
  viewportBottom: number
  listTop: number
  offsetTree: OffsetPoint[]
  totalHeight: number
}

interface MasonryItemsState<T> {
  columns: ColumnItemsState<T>[]
  totalCount: number
  data: Data<T> | null
  indexesInColumns: number[][]
}

export const masonryItemsState$ = Cell<MasonryItemsState<unknown>>({ columns: [], totalCount: -1, data: [], indexesInColumns: [] }, (r) => {
  link(
    pipe(
      combine(
        columnCount$,
        listScrollTop$,
        visibleListHeight$,
        sizeTrees$,
        offsetTrees$,
        totalCount$,
        totalHeights$,
        data$,
        indexesInColumns$,
        initialItemCount$,
        listOffset$,
        useWindowScroll$
      ),
      scan(
        (
          current,
          [
            columnCount,
            listScrollTop,
            visibleListHeight,
            sizeTrees,
            offsetTrees,
            totalCount,
            totalHeights,
            data,
            indexesInColumns,
            initialItemCount,
            listOffset,
            useWindowScroll,
          ]
        ) => {
          const listOffsetTop = useWindowScroll ? listOffset + listScrollTop : 0
          const viewportTop = Math.min(Math.max(listScrollTop - listOffsetTop, 0), Math.max(...totalHeights) - visibleListHeight)
          const viewportBottom = viewportTop + visibleListHeight

          const itemsToRenderInitially = initialItemCount === 0 ? Math.min(columnCount, totalCount) : initialItemCount

          const columns: ColumnItemsState<unknown>[] = Array.from<{ length: number }, ColumnItemsState<unknown>>(
            { length: columnCount },
            (_, columnIndex) => {
              const currentColumnState = current.columns[columnIndex]
              const sizeTree = sizeTrees[columnIndex] ?? newTree()
              const offsetTree = offsetTrees[columnIndex] ?? []
              const totalHeight = totalHeights[columnIndex] ?? 0
              const indexes = indexesInColumns[columnIndex] ?? []

              if (empty(sizeTree) || indexes.length === 0) {
                const items: MasonryItem<unknown>[] = []

                let indexInColumn = 0
                for (let i = columnIndex; i < itemsToRenderInitially; i += columnCount) {
                  items.push({
                    data: data?.[i],
                    height: 0,
                    columnIndex,
                    indexInColumn: indexInColumn++,
                    index: i,
                    offset: 0,
                  } satisfies MasonryItem<unknown>)
                }

                return {
                  index: columnIndex,
                  items,
                  listBottom: 0,
                  listTop: 0,
                  offsetTree: offsetTree,
                  totalHeight: 0,
                  viewportBottom: 0,
                } satisfies ColumnItemsState<unknown>
              }

              if (
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                currentColumnState &&
                currentColumnState.offsetTree === offsetTree &&
                current.totalCount === totalCount &&
                current.data === data &&
                current.indexesInColumns === indexesInColumns
              ) {
                if (viewportTop >= currentColumnState.listTop && viewportBottom <= currentColumnState.listBottom) {
                  return currentColumnState
                }
              }

              const items: MasonryItem<unknown>[] = []
              const maxIndex = indexes.length - 1
              const minStartIndex = 0
              const offsetPointRanges = rangesWithinOffsets(offsetTree, viewportTop, viewportBottom, minStartIndex)

              let listBottom = 0
              let listTop = 0
              let firstItemFound = false
              for (const range of offsetPointRanges) {
                const {
                  value: { offset, height },
                } = range

                let rangeStartIndex = range.start

                listBottom = offset

                if (offset < viewportTop) {
                  rangeStartIndex += Math.floor((viewportTop - offset) / height)
                  listBottom += (rangeStartIndex - range.start) * height
                }

                if (rangeStartIndex < minStartIndex) {
                  listBottom += (minStartIndex - rangeStartIndex) * height
                  rangeStartIndex = minStartIndex
                }

                const endIndex = Math.min(range.end, maxIndex)

                for (let i = rangeStartIndex; i <= endIndex; i++) {
                  if (listBottom >= viewportBottom) {
                    break
                  }
                  const realIndex = indexes[i]
                  const item: MasonryItem<unknown> = {
                    data: data?.[realIndex],
                    height,
                    columnIndex,
                    indexInColumn: i,
                    index: realIndex,
                    offset: listBottom,
                  }

                  if (!firstItemFound) {
                    firstItemFound = true

                    listTop = listBottom
                  }

                  items.push(item)
                  listBottom += height
                }
              }

              return {
                items,
                viewportBottom,
                listBottom,
                listTop,
                offsetTree,
                totalHeight,
                index: columnIndex,
              } satisfies ColumnItemsState<unknown>
            }
          )

          return {
            columns,
            totalCount,
            data,
            indexesInColumns,
          } satisfies MasonryItemsState<unknown>
        },
        {
          columns: [],
          totalCount: -1,
          indexesInColumns: [],
          data: [],
        } as MasonryItemsState<unknown>
      )
    ),
    masonryItemsState$
  )

  sub(
    pipe(
      masonryItemsState$,
      filter((state) => state.columns.some((column) => column.listBottom < column.viewportBottom))
    ),
    (masonryItemsState) => {
      const shortestColumn = masonryItemsState.columns.slice().sort((a, b) => a.listBottom - b.listBottom)[0]
      const indexes = r.getValue(indexesInColumns$)
      const nextIndex = Math.max(...indexes.flat()) + 1
      if (nextIndex >= r.getValue(totalCount$)) {
        return
      }

      pub(
        indexesInColumns$,
        indexes.map((indexesInColumn, index) => {
          return index === shortestColumn.index ? [...indexesInColumn, nextIndex] : indexesInColumn
        })
      )
    }
  )
})
