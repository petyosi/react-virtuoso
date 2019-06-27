import { subject, map, scan, combineLatest, TObservable } from '../src/tinyrx'
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

const { ceil, floor, min, max } = Math

const hackFloor = (val: number) => (ceil(val) - val < 0.01 ? ceil(val) : floor(val))

export const VirtuosoGridEngine = () => {
  const gridDimensions$ = subject<GridDimensions>([0, 0, undefined, undefined])
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
        const itemsPerRow = hackFloor(containerWidth / itemWidth)

        const toRange = (down = true): GridItemRange => {
          const [topOverscan, bottomOverscan] = down ? [0, overscan] : [overscan, 0]

          const startIndex = itemsPerRow * floor((scrollTop - topOverscan) / itemHeight)
          const endIndex = itemsPerRow * ceil((scrollTop + containerHeight + bottomOverscan) / itemHeight) - 1

          return [max(0, startIndex), min(totalCount - 1, endIndex)]
        }

        const listTop = itemHeight * floor(startIndex / itemsPerRow)
        const listBottom = itemHeight * floor(endIndex / itemsPerRow) + itemHeight

        // user is scrolling up - list top is below the top edge of the viewport
        if (listTop > scrollTop) {
          return toRange(false)
        }

        // user is scrolling down - list bottom is above the bottom edge of the viewport
        if (listBottom < scrollTop + containerHeight) {
          return toRange(true)
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
      const itemsPerRow = hackFloor(containerWidth / itemWidth)
      const rows = ceil(totalCount / itemsPerRow)
      return itemHeight * rows
    })
  )

  const listOffset$ = combineLatest(itemRange$, gridDimensions$).pipe(
    map(([[startIndex], [containerWidth, _, itemWidth, itemHeight]]) => {
      if (itemWidth === undefined || itemHeight === undefined) {
        return 0
      }

      const itemsPerRow = hackFloor(containerWidth / itemWidth)
      return floor(startIndex / itemsPerRow) * itemHeight
    })
  )

  return {
    gridDimensions: makeInput(gridDimensions$),
    totalCount: makeInput(totalCount$),
    scrollTop: makeInput(scrollTop$),
    overscan: makeInput(overscan$),

    itemRange: makeOutput(itemRange$),
    totalHeight: makeOutput(totalHeight$),
    listOffset: makeOutput(listOffset$),
    scrollTo: () => {},
  }
}
