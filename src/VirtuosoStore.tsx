import { duc, filter, map, subject, coldSubject, withLatestFrom, scan } from '../src/tinyrx'
import { buildIsScrolling } from './EngineCommons'
import { adjustForPrependedItemsEngine } from './engines/adjustForPrependedItemsEngine'
import { followOutputEngine } from './engines/followOutputEngine'
import { groupCountEngine } from './engines/groupCountEgine'
import { listEngine } from './engines/listEngine'
import { maxRangeSizeEngine } from './engines/maxRangeSizeEngine'
import { offsetListEngine } from './engines/offsetListEngine'
import { scrolledToBottomEngine } from './engines/scrolledToBottomEngine'
import { scrollToIndexEngine } from './engines/scrollToIndexEngine'
import { topItemCountEngine } from './engines/topItemCountEngine'
import { topListEngine } from './engines/topListEngine'
import { ListItem, StubIndexTransposer, Transposer } from './GroupIndexTransposer'
import { makeInput, makeOutput } from './rxio'
import { scrollSeekEngine, ListRange } from './engines/scrollSeekEngine'

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
  defaultItemHeight?: number
  initialTopMostItemIndex?: number
}

const VirtuosoStore = ({
  overscan = 0,
  totalCount = 0,
  itemHeight,
  initialTopMostItemIndex,
  defaultItemHeight,
}: TVirtuosoConstructorParams) => {
  const transposer$ = subject<Transposer>(new StubIndexTransposer())
  const viewportHeight$ = subject(0)
  const scrollTop$ = subject(0, false)
  const isScrolling$ = buildIsScrolling(scrollTop$)

  const { topList$, minListIndex$, topListHeight$ } = topListEngine()
  const {
    stickyItems$,
    initialItemCount$,
    itemHeights$,
    offsetList$,
    totalCount$,
    footerHeight$,
    totalHeight$,
    heightsChanged$,
  } = offsetListEngine({
    totalCount,
    itemHeight,
    defaultItemHeight,
    initialTopMostItemIndex,
    viewportHeight$,
    scrollTop$,
    transposer$,
    topList$,
  })

  const { groupCounts$, groupIndices$ } = groupCountEngine({ totalCount$, transposer$, stickyItems$ })

  const { scrolledToBottom$ } = scrolledToBottomEngine({ totalHeight$, viewportHeight$, scrollTop$ })

  const { scrolledToTopMostItem$, scrollToIndex$, scrollTo$ } = scrollToIndexEngine({
    initialTopMostItemIndex,
    scrollTop$,
    offsetList$,
    viewportHeight$,
    totalHeight$,
    stickyItems$,
    totalCount$,
    topListHeight$,
    itemHeights$,
  })

  const { listHeight$, list$, listOffset$, endReached$ } = listEngine({
    overscan,
    viewportHeight$,
    scrollTop$,
    totalHeight$,
    topListHeight$,
    footerHeight$,
    minListIndex$,
    totalCount$,
    offsetList$,
    scrolledToTopMostItem$,
    transposer$,
  })

  const { adjustForPrependedItems$, adjustmentInProgress$ } = adjustForPrependedItemsEngine({
    offsetList$,
    scrollTop$,
    scrollTo$,
  })

  const { maxRangeSize$ } = maxRangeSizeEngine({ scrollTo$, offsetList$, scrollTop$, list$ })

  const { topItemCount$ } = topItemCountEngine({ offsetList$, totalCount$, transposer$, viewportHeight$, topList$ })

  const { followOutput$ } = followOutputEngine({ totalCount$, scrollToIndex$, scrolledToBottom$ })

  const stickyItemsOffset$ = listOffset$.pipe(map(offset => -offset))

  const rangeChanged$ = coldSubject<ListRange>()

  list$
    .pipe(
      withLatestFrom(adjustmentInProgress$),
      filter<[ListItem[], boolean]>(([list, inProgress]) => list.length !== 0 && !inProgress),
      map(([{ 0: { index: startIndex }, length, [length - 1]: { index: endIndex } }]) => ({ startIndex, endIndex })),
      duc((current, next) => !current || current.startIndex !== next.startIndex || current.endIndex !== next.endIndex)
    )
    .subscribe(rangeChanged$.next)

  const listDir$ = list$.pipe(
    duc(),
    filter(list => list.length > 0),
    scan(
      ([prev], current) => {
        return [current, prev.length && prev[0].index > current[0].index ? 'up' : 'down'] as [ListItem[], 'up' | 'down']
      },
      [[], 'down'] as [ListItem[], 'up' | 'down' | 'same']
    ),
    map(([_, dir]) => dir)
  )

  heightsChanged$
    .pipe(
      withLatestFrom(listDir$, list$, scrollTop$),
      filter(([[changed], dir]) => {
        return changed && dir === 'up'
      })
    )
    .subscribe(([[_, offsetList], __, list, scrollTop]) => {
      const expectedOffset = list[list.length - 1].offset
      const actualOffset = offsetList.offsetOf(list[list.length - 1].index)
      const difference = actualOffset - expectedOffset
      scrollTo$.next({ top: scrollTop + difference })
    })

  const { isSeeking$, scrollVelocity$, scrollSeekConfiguration$ } = scrollSeekEngine({
    scrollTop$,
    isScrolling$,
    rangeChanged$,
  })

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
    followOutput: makeInput(followOutput$),
    adjustForPrependedItems: makeInput(adjustForPrependedItems$),
    maxRangeSize: makeInput(maxRangeSize$),
    scrollSeekConfiguration: makeInput(scrollSeekConfiguration$),

    list: makeOutput(list$),
    isSeeking: makeOutput(isSeeking$),
    scrollVelocity: makeOutput(scrollVelocity$),
    itemsRendered: makeOutput(list$),
    topList: makeOutput(topList$),
    listOffset: makeOutput(listOffset$),
    totalHeight: makeOutput(totalHeight$),
    endReached: makeOutput(endReached$),
    atBottomStateChange: makeOutput(scrolledToBottom$),
    totalListHeightChanged: makeOutput(totalHeight$),
    rangeChanged: makeOutput(rangeChanged$),
    isScrolling: makeOutput(isScrolling$),
    stickyItems: makeOutput(stickyItems$),
    groupIndices: makeOutput(groupIndices$),
    stickyItemsOffset: makeOutput(stickyItemsOffset$),
    scrollTo: makeOutput(scrollTo$),
  }
}

export { VirtuosoStore }
