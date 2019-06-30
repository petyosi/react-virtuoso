import { subject, map, combineLatest, withLatestFrom, coldSubject } from './tinyrx'
import { makeInput, makeOutput } from './rxio'
import { TScrollLocation, buildIsScrolling } from './EngineCommons'

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

const hackFloor = (val: number) => (ceil(val) - val < 0.03 ? ceil(val) : floor(val))

export const VirtuosoGridEngine = () => {
  const gridDimensions$ = subject<GridDimensions>([0, 0, undefined, undefined])
  const totalCount$ = subject(0)
  const scrollTop$ = subject(0)
  const overscan$ = subject(0)
  const itemRange$ = subject<GridItemRange>([0, 0])
  const totalHeight$ = subject(0)
  const listOffset$ = subject(0)
  const scrollToIndex$ = coldSubject<TScrollLocation>()

  combineLatest(gridDimensions$, scrollTop$, overscan$, totalCount$)
    .pipe(withLatestFrom(itemRange$))
    .subscribe(
      ([[[viewportWidth, viewportHeight, itemWidth, itemHeight], scrollTop, overscan, totalCount], itemRange]) => {
        if (itemWidth === undefined || itemHeight === undefined || totalCount == 0) {
          return
        }

        const [startIndex, endIndex] = itemRange
        const itemsPerRow = hackFloor(viewportWidth / itemWidth)

        const toRowIndex = (index: number, roundFunc = floor) => {
          return roundFunc(index / itemsPerRow)
        }

        const updateRange = (down: boolean): void => {
          const [topOverscan, bottomOverscan] = down ? [0, overscan] : [overscan, 0]

          let startIndex = itemsPerRow * floor((scrollTop - topOverscan) / itemHeight)

          let endIndex = itemsPerRow * ceil((scrollTop + viewportHeight + bottomOverscan) / itemHeight) - 1

          endIndex = min(totalCount - 1, endIndex)
          startIndex = min(endIndex, max(0, startIndex))

          itemRange$.next([startIndex, endIndex])
          listOffset$.next(toRowIndex(startIndex) * itemHeight)
        }

        const listTop = itemHeight * toRowIndex(startIndex)
        const listBottom = itemHeight * toRowIndex(endIndex) + itemHeight

        // user is scrolling up - list top is below the top edge of the viewport
        if (listTop > scrollTop) {
          updateRange(false)
          // user is scrolling down - list bottom is above the bottom edge of the viewport
        } else if (listBottom < scrollTop + viewportHeight) {
          updateRange(true)
        }

        totalHeight$.next(itemHeight * toRowIndex(totalCount, ceil))
      }
    )

  const scrollTo$ = scrollToIndex$.pipe(
    withLatestFrom(gridDimensions$, totalCount$),
    map(([location, [viewportWidth, viewportHeight, itemWidth, itemHeight], totalCount]) => {
      if (itemWidth === undefined || itemHeight === undefined) {
        return 0
      }

      if (typeof location === 'number') {
        location = { index: location, align: 'start' }
      }

      let { index, align = 'start' } = location

      index = Math.max(0, index, Math.min(totalCount - 1, index))

      const itemsPerRow = hackFloor(viewportWidth / itemWidth)

      let offset = floor(index / itemsPerRow) * itemHeight

      if (align == 'end') {
        offset = offset - viewportHeight + itemHeight
      } else if (align === 'center') {
        offset = Math.round(offset - viewportHeight / 2 + itemHeight / 2)
      }
      return offset
    })
  )

  const isScrolling$ = buildIsScrolling(scrollTop$)

  const endReached$ = coldSubject<number>()
  let currentEndIndex = 0

  itemRange$.pipe(withLatestFrom(totalCount$)).subscribe(([[_, endIndex], totalCount]) => {
    if (totalCount === 0) {
      return
    }

    if (endIndex === totalCount - 1) {
      if (currentEndIndex !== endIndex) {
        currentEndIndex = endIndex
        endReached$.next(endIndex)
      }
    }
  })

  return {
    gridDimensions: makeInput(gridDimensions$),
    totalCount: makeInput(totalCount$),
    scrollTop: makeInput(scrollTop$),
    overscan: makeInput(overscan$),
    scrollToIndex: makeInput(scrollToIndex$),

    itemRange: makeOutput(itemRange$),
    totalHeight: makeOutput(totalHeight$),
    listOffset: makeOutput(listOffset$),
    scrollTo: makeOutput(scrollTo$),
    isScrolling: makeOutput(isScrolling$),
    endReached: makeOutput(endReached$),
  }
}
