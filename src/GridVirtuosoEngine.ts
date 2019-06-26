import {
  subject,
  map,
  scan,
  /*
  withLatestFrom,
  debounceTime,
  mapTo,
  skip,
  filter,
  coldSubject,
  */
  combineLatest,
  TObservable,
} from '../src/tinyrx'
import { makeInput, makeOutput } from './rxio'

type GridDimensions = [
  number, // container width,
  number, // container height,
  number | undefined, // item width,
  number | undefined // item height
]

type GridItemRange = [
  number, // start index
  number // end index
]

// ---Input
// container size
// item size
// total items
// scroll top
// overscan
// ---Output
// totalHeight
// [startIndex, endIndex]
// listOffset

export const GridVirtuosoEngine = () => {
  const gridDimensions$ = subject<GridDimensions>()
  const totalCount$ = subject(0)
  const scrollTop$ = subject(0)
  const overscan$ = subject(0)

  const itemRange$: TObservable<GridItemRange> = combineLatest(
    gridDimensions$,
    scrollTop$,
    overscan$,
    totalCount$
  ).pipe(
    scan(
      (
        itemRange,
        [[containerWidth, containerHeight, itemWidth, itemHeight], scrollTop, overscan, totalCount]
      ): GridItemRange => {
        if (itemWidth === undefined || itemHeight === undefined) {
          return [0, 0] as GridItemRange
        }

        const [startIndex, endIndex] = itemRange

        const itemsPerRow = Math.floor(containerWidth / itemWidth)
        const rowCount = Math.ceil(containerHeight / itemHeight)
        const scrollOffset = Math.floor(scrollTop / itemHeight) * itemsPerRow

        const listTop = itemHeight * Math.floor(startIndex / itemsPerRow)

        if (listTop > scrollTop) {
          let startIndexWithOverscan = Math.floor((scrollTop - overscan * 2) / itemHeight) * itemsPerRow
          startIndexWithOverscan = Math.max(0, startIndexWithOverscan)
          return [startIndexWithOverscan, itemsPerRow * rowCount - 1 + scrollOffset] as GridItemRange
        }

        const listBottom = itemHeight * Math.floor(endIndex / itemsPerRow) + itemHeight

        // console.log({ listTop, listBottom, scrollTop, containerHeight })

        if (listBottom < scrollTop + containerHeight) {
          const rowsWithOverscan = Math.ceil((containerHeight + overscan * 2) / itemHeight)
          let endIndex = itemsPerRow * rowsWithOverscan - 1 + scrollOffset
          endIndex = Math.min(endIndex, totalCount - 1)
          return [scrollOffset, endIndex] as GridItemRange
        }

        return itemRange
      },
      [0, 0]
    )
  )

  const totalHeight$ = combineLatest(gridDimensions$, totalCount$).pipe(
    map(([[containerWidth, _, itemWidth, itemHeight], totalCount]) => {
      if (itemWidth === undefined || itemHeight === undefined) {
        return 0
      }
      const itemsPerRow = Math.floor(containerWidth / itemWidth)
      const rows = Math.ceil(totalCount / itemsPerRow)
      return itemHeight * rows
    })
  )

  return {
    gridDimensions: makeInput(gridDimensions$),
    totalCount: makeInput(totalCount$),
    scrollTop: makeInput(scrollTop$),
    overscan: makeInput(overscan$),

    itemRange: makeOutput(itemRange$),
    totalHeight: makeOutput(totalHeight$),
  }
}
