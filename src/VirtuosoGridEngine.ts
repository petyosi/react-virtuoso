import { subject, combineLatest, withLatestFrom } from '../src/tinyrx'
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
  const itemRange$ = subject<GridItemRange>([0, 0])
  const totalHeight$ = subject(0)
  const listOffset$ = subject(0)

  combineLatest(gridDimensions$, scrollTop$, overscan$, totalCount$)
    .pipe(withLatestFrom(itemRange$))
    .subscribe(
      ([[[containerWidth, containerHeight, itemWidth, itemHeight], scrollTop, overscan, totalCount], itemRange]) => {
        if (itemWidth === undefined || itemHeight === undefined) {
          return
        }

        const [startIndex, endIndex] = itemRange
        const itemsPerRow = hackFloor(containerWidth / itemWidth)

        const updateRange = (down: boolean): void => {
          const [topOverscan, bottomOverscan] = down ? [0, overscan] : [overscan, 0]

          let startIndex = itemsPerRow * floor((scrollTop - topOverscan) / itemHeight)
          let endIndex = itemsPerRow * ceil((scrollTop + containerHeight + bottomOverscan) / itemHeight) - 1

          startIndex = max(0, startIndex)
          endIndex = min(totalCount - 1, endIndex)
          itemRange$.next([startIndex, endIndex])
          listOffset$.next(floor(startIndex / itemsPerRow) * itemHeight)
        }

        const listTop = itemHeight * floor(startIndex / itemsPerRow)
        const listBottom = itemHeight * floor(endIndex / itemsPerRow) + itemHeight

        // user is scrolling up - list top is below the top edge of the viewport
        if (listTop > scrollTop) {
          updateRange(false)
          // user is scrolling down - list bottom is above the bottom edge of the viewport
        } else if (listBottom < scrollTop + containerHeight) {
          updateRange(true)
        }

        totalHeight$.next(itemHeight * ceil(totalCount / itemsPerRow))
      }
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
