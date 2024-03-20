import * as u from './urx'
import { domIOSystem } from './domIOSystem'
import { followOutputSystem } from './followOutputSystem'
import { groupedListSystem } from './groupedListSystem'
import { initialItemCountSystem } from './initialItemCountSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { listStateSystem } from './listStateSystem'
import { propsReadySystem } from './propsReadySystem'
import { scrollSeekSystem } from './scrollSeekSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { sizeSystem } from './sizeSystem'
import { topItemCountSystem } from './topItemCountSystem'
import { totalListHeightSystem } from './totalListHeightSystem'
import { upwardScrollFixSystem } from './upwardScrollFixSystem'
import { initialScrollTopSystem } from './initialScrollTopSystem'
import { alignToBottomSystem } from './alignToBottomSystem'
import { windowScrollerSystem } from './windowScrollerSystem'
import { loggerSystem } from './loggerSystem'
import { scrollIntoViewSystem } from './scrollIntoViewSystem'
import { stateLoadSystem } from './stateLoadSystem'

const featureGroup1System = u.system(
  ([
    sizeRange,
    initialItemCount,
    propsReady,
    scrollSeek,
    totalListHeight,
    initialScrollTopSystem,
    alignToBottom,
    windowScroller,
    scrollIntoView,
    logger,
  ]) => {
    return {
      ...sizeRange,
      ...initialItemCount,
      ...propsReady,
      ...scrollSeek,
      ...totalListHeight,
      ...initialScrollTopSystem,
      ...alignToBottom,
      ...windowScroller,
      ...scrollIntoView,
      ...logger,
    }
  },
  u.tup(
    sizeRangeSystem,
    initialItemCountSystem,
    propsReadySystem,
    scrollSeekSystem,
    totalListHeightSystem,
    initialScrollTopSystem,
    alignToBottomSystem,
    windowScrollerSystem,
    scrollIntoViewSystem,
    loggerSystem
  )
)

export const listSystem = u.system(
  ([
    {
      totalCount,
      sizeRanges,
      fixedItemSize,
      defaultItemSize,
      trackItemSizes,
      itemSize,
      data,
      firstItemIndex,
      groupIndices,
      statefulTotalCount,
      gap,
      sizes,
    },
    { initialTopMostItemIndex, scrolledToInitialItem, initialItemFinalLocationReached },
    domIO,
    stateLoad,
    followOutput,
    { listState, topItemsIndexes, ...flags },
    { scrollToIndex },
    _,
    { topItemCount },
    { groupCounts },
    featureGroup1,
  ]) => {
    u.connect(flags.rangeChanged, featureGroup1.scrollSeekRangeChanged)
    u.connect(
      u.pipe(
        featureGroup1.windowViewportRect,
        u.map((value) => value.visibleHeight)
      ),
      domIO.viewportHeight
    )

    return {
      // input
      totalCount,
      data,
      firstItemIndex,
      sizeRanges,
      initialTopMostItemIndex,
      scrolledToInitialItem,
      initialItemFinalLocationReached,
      topItemsIndexes,
      topItemCount,
      groupCounts,
      fixedItemHeight: fixedItemSize,
      defaultItemHeight: defaultItemSize,
      gap,
      ...followOutput,

      // output
      statefulTotalCount,
      listState,
      scrollToIndex,
      trackItemSizes,
      itemSize,
      groupIndices,

      // exported from stateFlagsSystem
      ...flags,
      // the bag of IO from featureGroup1System
      ...featureGroup1,
      ...domIO,
      sizes,
      ...stateLoad,
    }
  },
  u.tup(
    sizeSystem,
    initialTopMostItemIndexSystem,
    domIOSystem,
    stateLoadSystem,
    followOutputSystem,
    listStateSystem,
    scrollToIndexSystem,
    upwardScrollFixSystem,
    topItemCountSystem,
    groupedListSystem,
    featureGroup1System
  )
)
