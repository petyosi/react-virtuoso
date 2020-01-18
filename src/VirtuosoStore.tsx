import { subject, map, scan, withLatestFrom, filter, combineLatest, coldSubject } from '../src/tinyrx'
import { OffsetList } from './OffsetList'
import { StubIndexTransposer, GroupIndexTransposer, ListItem } from './GroupIndexTransposer'
import { makeInput, makeOutput } from './rxio'
import { TScrollLocation, buildIsScrolling } from './EngineCommons'

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
) => (
  items: ListItem[],
  viewState: [number, number, number, number, number, number, number, OffsetList, boolean]
) => ListItem[]

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
  let initialOffsetList = OffsetList.create()
  let pendingRenderAfterInitial = false
  const stickyItems$ = subject<number[]>([])
  const initialItemCount$ = subject<number>()
  const scrollToIndex$ = coldSubject<TScrollLocation>()
  const adjustForPrependedItems$ = coldSubject<number>()
  const scrollToIndexRequestPending$ = subject(false)
  const initialTopMostItemIndex$ = subject(0)
  const scrolledToTopMostItem$ = subject(true)
  const followOutput$ = subject(false)
  const scrolledToBottom$ = subject(false)
  const scrollTo$ = coldSubject<number>()
  const listResetAdjustment$ = coldSubject<true>()
  const scheduledReadjust$ = subject<{ index: number; offset: number } | null>(null)
  const maxRangeSize$ = subject(Infinity)

  if (itemHeight) {
    initialOffsetList = initialOffsetList.insert(0, 0, itemHeight)
  }

  const offsetList$ = subject(initialOffsetList)

  offsetList$.pipe(withLatestFrom(maxRangeSize$)).subscribe(([list, maxRangeSize]) =>
    list.configureMaxRangeSize(maxRangeSize, () => {
      console.log('Clearing cache size')
      listResetAdjustment$.next(true)
    })
  )

  initialTopMostItemIndex$.pipe(withLatestFrom(offsetList$)).subscribe(([topMostItemIndex, list]) => {
    if (list.empty()) {
      if (topMostItemIndex !== 0) {
        scrolledToTopMostItem$.next(false)
        offsetList$.next(list.setInitialIndex(topMostItemIndex))
      }
    } else {
      scrollToIndex$.next(topMostItemIndex)
    }
  })

  if (!itemHeight) {
    itemHeights$
      .pipe(withLatestFrom(offsetList$, stickyItems$, scrolledToTopMostItem$, scheduledReadjust$))
      .subscribe(([heights, offsetList, stickyItems, scrolledToTopMostItem, scheduledReadjust]) => {
        // no changes in the known heights - this means that scrollToIndex worked as expected
        // we 'resolve' the pending state
        // console.log(heights)
        if (heights.length === 0 && scrolledToTopMostItem) {
          scrollToIndexRequestPending$.next(false)
        }

        let newList = offsetList
        if (pendingRenderAfterInitial) {
          newList = OffsetList.create()
          pendingRenderAfterInitial = false
        }

        for (const { start, end, size } of heights) {
          if (newList.empty() && start === end && stickyItems.indexOf(start) > -1) {
            newList = newList.insertSpots(stickyItems, size)
          } else {
            newList = newList.insert(start, end, size)
          }
        }

        if (newList !== offsetList) {
          offsetList$.next(newList)
        }

        if (scheduledReadjust !== null) {
          const scrollTo = offsetList.offsetOf(scheduledReadjust.index) + scheduledReadjust.offset
          scrollTo$.next(scrollTo)
          scheduledReadjust$.next(null)
        }
      })
  }

  let transposer: GroupIndexTransposer | StubIndexTransposer = new StubIndexTransposer()

  const listScanner: ListScanner = overscan => (
    items,
    [
      viewportHeight,
      scrollTop,
      topListHeight,
      listHeight,
      footerHeight,
      minIndex,
      totalCount,
      offsetList,
      scrolledToTopMostItem,
    ]
  ) => {
    const itemLength = items.length

    if (totalCount === 0) {
      return []
    }

    const listTop = getListTop(items)

    const listBottom = listTop - scrollTop + listHeight - footerHeight - topListHeight
    const maxIndex = Math.max(totalCount - 1, 0)
    const indexOutOfAllowedRange =
      itemLength > 0 && (items[0].index < minIndex || items[itemLength - 1].index > maxIndex)

    if (listBottom < viewportHeight || indexOutOfAllowedRange) {
      const startOffset = Math.max(scrollTop, 0)
      const endOffset = scrollTop + viewportHeight + overscan * 2 - 1
      items = transposer.transpose(offsetList.range(startOffset, endOffset, minIndex, maxIndex))
    }

    if (listTop > scrollTop) {
      const startOffset = Math.max(scrollTop - overscan * 2, 0)
      const endOffset = scrollTop + viewportHeight - 1
      items = transposer.transpose(offsetList.range(startOffset, endOffset, minIndex, maxIndex))
    }

    // this is a hack - we should let the probe item render,
    // but skip the real list until the viewport has scrolled
    // to the expected location
    if (items.length > 1 && !scrolledToTopMostItem) {
      return []
    }

    return items
  }

  groupCounts$.subscribe(counts => {
    transposer = new GroupIndexTransposer(counts)
    totalCount$.next(transposer.totalCount())
    stickyItems$.next(transposer.groupIndices())
  })

  combineLatest(followOutput$, totalCount$)
    .pipe(withLatestFrom(scrolledToBottom$))
    .subscribe(([[followOutput, totalCount], scrolledToBottom]) => {
      if (followOutput && scrolledToBottom) {
        setTimeout(() => {
          scrollToIndex$.next(totalCount - 1)
        })
      }
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

  combineLatest(offsetList$, topItemCount$, totalCount$, viewportHeight$)
    .pipe(
      filter(params => params[1] > 0 && params[3] > 0),
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
    offsetList$,
    scrolledToTopMostItem$
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

  scrollToIndex$
    .pipe(
      withLatestFrom(offsetList$, topListHeight$, stickyItems$, viewportHeight$, totalCount$, totalHeight$),
      map(([location, offsetList, topListHeight, stickyItems, viewportHeight, totalCount, totalHeight]) => {
        if (typeof location === 'number') {
          location = { index: location, align: 'start' }
        }
        let { index, align = 'start' } = location

        index = Math.max(0, index, Math.min(totalCount - 1, index))

        let offset = offsetList.offsetOf(index)
        if (align === 'end') {
          offset = offset - viewportHeight + offsetList.itemAt(index).size
        } else if (align === 'center') {
          offset = Math.round(offset - viewportHeight / 2 + offsetList.itemAt(index).size / 2)
        } else {
          if (stickyItems.indexOf(index) === -1) {
            offset -= topListHeight
          }
        }
        scrollToIndexRequestPending$.next(true)
        return Math.min(offset, totalHeight - viewportHeight)
      })
    )
    .subscribe(scrollTo$.next)

  scrollTop$
    .pipe(withLatestFrom(scrollTo$, scrolledToTopMostItem$))
    .subscribe(([scrollTop, scrollTo, scrolledToTopMostItem]) => {
      if (scrollTop === scrollTo && !scrolledToTopMostItem) {
        scrolledToTopMostItem$.next(true)
      }
    })

  offsetList$
    .pipe(withLatestFrom(scrolledToTopMostItem$, initialTopMostItemIndex$))
    .subscribe(([list, scrolledTo, initialTopMostItemIndex]) => {
      if (!scrolledTo && !list.empty()) {
        scrollToIndex$.next(initialTopMostItemIndex)
      }
    })

  // if the list has received new heights, the scrollTo call calculations were wrong;
  // we will retry by re-requesting the same index
  offsetList$
    .pipe(withLatestFrom(scrollToIndexRequestPending$, scrollToIndex$))
    .subscribe(([_, scrollToIndexRequestPending, scrollToIndex]) => {
      if (scrollToIndexRequestPending) {
        scrollToIndex$.next(scrollToIndex)
      }
    })

  const unsubscribeInitial = initialItemCount$.subscribe(count => {
    const dummyItemHeight = 30
    itemHeights$.next([{ start: 0, end: 0, size: dummyItemHeight }])
    viewportHeight$.next(dummyItemHeight * count)
    pendingRenderAfterInitial = true
    unsubscribeInitial()
  })

  const groupIndices$ = stickyItems$.pipe()
  const stickyItemsOffset$ = listOffset$.pipe(map(offset => -offset))
  const isScrolling$ = buildIsScrolling(scrollTop$)

  combineLatest(scrollTop$, viewportHeight$, totalHeight$)
    .pipe(
      map(([scrollTop, viewportHeight, totalHeight]) => {
        if (viewportHeight === 0) return false
        return scrollTop === totalHeight - viewportHeight
      })
    )
    .subscribe(scrolledToBottom$.next)

  adjustForPrependedItems$.pipe(withLatestFrom(offsetList$, scrollTop$)).subscribe(([count, list, scrollTop]) => {
    if (list.empty()) {
      return
    }

    offsetList$.next(list.adjustForPrependedItems(count))
    setTimeout(() => {
      scrollTo$.next(count * list.getDefaultSize() + scrollTop)
    })
  })

  listResetAdjustment$.pipe(withLatestFrom(scrollTop$, list$)).subscribe(([_, scrollTop, list]) => {
    const position = {
      index: list[0].index,
      offset: scrollTop - list[0].offset,
    }
    scheduledReadjust$.next(position)
  })

  // list$.subscribe(list => console.log({ list }))
  // scrollTop$.subscribe(top => console.log({ top }))

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
    initialItemCount: makeInput(initialItemCount$),
    initialTopMostItemIndex: makeInput(initialTopMostItemIndex$),
    followOutput: makeInput(followOutput$),
    adjustForPrependedItems: makeInput(adjustForPrependedItems$),
    maxRangeSize: makeInput(maxRangeSize$),

    list: makeOutput(list$),
    itemsRendered: makeOutput(list$),
    topList: makeOutput(topList$),
    listOffset: makeOutput(listOffset$),
    totalHeight: makeOutput(totalHeight$),
    endReached: makeOutput(endReached$),
    atBottomStateChange: makeOutput(scrolledToBottom$),
    totalListHeightChanged: makeOutput(totalHeight$),
    isScrolling: makeOutput(isScrolling$),
    stickyItems: makeOutput(stickyItems$),
    groupIndices: makeOutput(groupIndices$),
    stickyItemsOffset: makeOutput(stickyItemsOffset$),
    scrollTo: makeOutput(scrollTo$),
  }
}

export { VirtuosoStore }
