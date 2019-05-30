import {
  subject,
  map,
  scan,
  withLatestFrom,
  debounceTime,
  mapTo,
  skip,
  filter,
  combineLatest,
  coldSubject,
} from '../src/tinyrx'
import { OffsetList } from './OffsetList'
import { StubIndexTransposer, GroupIndexTransposer, ListItem } from './GroupIndexTransposer'
import { makeInput, makeOutput } from './rxio'

export interface ItemHeight {
  start: number
  end: number
  size: number
}

interface TVirtuosoConstructorParams {
  overscan?: number
  totalCount?: number
  topItems?: number
  itemHeight?: number
}

type MapToTotal = (input: [OffsetList, number]) => number
type ListScanner = (
  overscan: number
) => (items: ListItem[], viewState: [number, number, number, number, number, number, number, OffsetList]) => ListItem[]

interface TScrollLocationWithAlign {
  index: number
  align: 'start' | 'center' | 'end'
}
export type TScrollLocation = number | TScrollLocationWithAlign

const getListTop = (items: ListItem[]) => (items.length > 0 ? items[0].offset : 0)

const mapToTotal: MapToTotal = ([offsetList, totalCount]) => offsetList.total(totalCount - 1)

const VirtuosoStore = ({ overscan = 0, totalCount = 0, itemHeight }: TVirtuosoConstructorParams) => {
  const viewportHeight$ = subject(0)
  const listHeight$ = subject(0)
  const scrollTop$ = subject(0)
  const footerHeight$ = subject(0)
  const itemHeights$ = subject<ItemHeight[]>()
  const totalCount$ = subject(totalCount)
  const groupCounts$ = subject<number[]>()
  const topItemCount$ = subject<number>()
  const isScrolling$ = subject(false)
  let initialOffsetList = OffsetList.create()
  const stickyItems$ = subject<number[]>([])
  const scrollToIndex$ = subject<TScrollLocation>(undefined, false)

  if (itemHeight) {
    initialOffsetList = initialOffsetList.insert(0, 0, itemHeight)
  }

  const offsetList$ = subject(initialOffsetList)

  if (!itemHeight) {
    itemHeights$.pipe(withLatestFrom(offsetList$, stickyItems$)).subscribe(([heights, offsetList, stickyItems]) => {
      let newList = offsetList

      for (let { start, end, size } of heights) {
        if (newList.empty() && start == end && stickyItems.indexOf(start) > -1) {
          newList = newList.insertSpots(stickyItems, size)
        } else {
          newList = newList.insert(start, end, size)
        }
      }

      if (newList !== offsetList) {
        offsetList$.next(newList)
      }
    })
  }

  let transposer: GroupIndexTransposer | StubIndexTransposer = new StubIndexTransposer()

  const listScanner: ListScanner = overscan => (
    items,
    [viewportHeight, scrollTop, topListHeight, listHeight, footerHeight, minIndex, totalCount, offsetList]
  ) => {
    const itemLength = items.length

    if (totalCount === 0) {
      return itemLength === 0 ? items : []
    }

    const listTop = getListTop(items)

    const listBottom = listTop - scrollTop + listHeight - footerHeight - topListHeight
    const maxIndex = Math.max(totalCount - 1, 0)
    const indexOutOfAllowedRange =
      itemLength > 0 && (items[0].index < minIndex || items[itemLength - 1].index > maxIndex)

    if (listBottom < viewportHeight || indexOutOfAllowedRange) {
      const startOffset = Math.max(scrollTop + topListHeight, topListHeight)
      const endOffset = scrollTop + viewportHeight + overscan * 2 - 1
      const result = transposer.transpose(offsetList.range(startOffset, endOffset, minIndex, maxIndex))
      return result
    }

    if (listTop > scrollTop + topListHeight) {
      const startOffset = Math.max(scrollTop + topListHeight - overscan * 2, topListHeight)
      const endOffset = scrollTop + viewportHeight - 1
      return transposer.transpose(offsetList.range(startOffset, endOffset, minIndex, maxIndex))
    }

    return items
  }

  groupCounts$.subscribe(counts => {
    transposer = new GroupIndexTransposer(counts)
    totalCount$.next(transposer.totalCount())
    stickyItems$.next(transposer.groupIndices())
  })

  const totalListHeight$ = combineLatest(offsetList$, totalCount$).pipe(map(mapToTotal))

  const totalHeight$ = combineLatest(totalListHeight$, footerHeight$).pipe(
    map(([totalListHeight, footerHeight]) => totalListHeight + footerHeight)
  )

  const stickyItemsIndexList$ = combineLatest(offsetList$, stickyItems$).pipe(
    map(([offsetList, stickyItems]) => {
      return offsetList.getOffsets(stickyItems)
    })
  )

  const topList$ = subject<ListItem[]>([])

  combineLatest(offsetList$, topItemCount$, totalCount$)
    .pipe(
      filter(params => params[1] > 0),
      map(([offsetList, topItemCount, totalCount]) => {
        const endIndex = Math.max(0, Math.min(topItemCount - 1, totalCount))
        return transposer.transpose(offsetList.indexRange(0, endIndex))
      })
    )
    .subscribe(topList$.next)

  combineLatest(offsetList$, stickyItemsIndexList$, scrollTop$)
    .pipe(
      filter(params => !params[1].empty() && !params[0].empty()),
      withLatestFrom(topList$),
      map(([[offsetList, stickyItemsIndexList, scrollTop], topList]) => {
        const currentStickyItem = stickyItemsIndexList.findMaxValue(Math.max(scrollTop, 0))

        if (topList.length === 1 && topList[0].index === currentStickyItem) {
          return topList
        }

        const item = offsetList.itemAt(currentStickyItem)
        return transposer.transpose([item])
      })
    )
    .subscribe(topList$.next)

  const topListHeight$ = topList$.pipe(map(items => items.reduce((total, item) => total + item.size, 0)))

  const minListIndex$ = topList$.pipe(
    map(topList => {
      return topList.length && topList[topList.length - 1].index + 1
    })
  )

  const list$ = combineLatest(
    viewportHeight$,
    scrollTop$,
    topListHeight$,
    listHeight$,
    footerHeight$,
    minListIndex$,
    totalCount$,
    offsetList$
  ).pipe(scan(listScanner(overscan), []))

  const endReached$ = coldSubject<number>()
  let currentEndIndex = 0

  list$
    .pipe(map(items => (items.length ? items[items.length - 1].index : 0)))
    .pipe(withLatestFrom(totalCount$))
    .subscribe(([endIndex, totalCount]) => {
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

  const listOffset$ = combineLatest(list$, scrollTop$, topListHeight$).pipe(map(([items]) => getListTop(items)))

  scrollTop$
    .pipe(
      skip(1),
      mapTo(true)
    )
    .subscribe(isScrolling$.next)

  scrollTop$
    .pipe(
      skip(1),
      mapTo(false),
      debounceTime(200)
    )
    .subscribe(isScrolling$.next)

  const scrollTo$ = scrollToIndex$.pipe(
    withLatestFrom(offsetList$, topListHeight$, stickyItems$, viewportHeight$, totalCount$),
    map(([location, offsetList, topListHeight, stickyItems, viewportHeight, totalCount]) => {
      if (typeof location === 'number') {
        location = { index: location, align: 'start' }
      }
      let { index, align = 'start' } = location

      index = Math.max(0, index, Math.min(totalCount - 1, index))

      let offset = offsetList.offsetOf(index)
      if (align == 'end') {
        offset = offset - viewportHeight + offsetList.itemAt(index).size
      } else if (align === 'center') {
        offset = Math.round(offset - viewportHeight / 2 + offsetList.itemAt(index).size / 2)
      } else {
        if (stickyItems.indexOf(index) === -1) {
          offset -= topListHeight
        }
      }
      return offset
    })
  )

  const groupIndices$ = stickyItems$.pipe()
  const stickyItemsOffset$ = listOffset$.pipe(map(offset => -offset))

  return {
    groupCounts: makeInput(groupCounts$),
    itemHeights: makeInput(itemHeights$),
    footerHeight: makeInput(footerHeight$),
    listHeight: makeInput(listHeight$),
    viewportHeight: makeInput(viewportHeight$),
    scrollTop: makeInput(scrollTop$),
    topItemCount: makeInput(topItemCount$),
    totalCount: makeInput(totalCount$),
    scrollToIndex: makeInput(scrollToIndex$),

    list: makeOutput(list$),
    topList: makeOutput(topList$),
    listOffset: makeOutput(listOffset$),
    totalHeight: makeOutput(totalHeight$),
    endReached: makeOutput(endReached$),
    isScrolling: makeOutput(isScrolling$),
    stickyItems: makeOutput(stickyItems$),
    groupIndices: makeOutput(groupIndices$),
    stickyItemsOffset: makeOutput(stickyItemsOffset$),
    scrollTo: makeOutput(scrollTo$),
  }
}

export { VirtuosoStore }
