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

// workaround the growing list of systems below
// fix this with 4.1 recursive conditional types
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
    scrollIntoViewSystem
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
    },
    { initialTopMostItemIndex, scrolledToInitialItem },
    domIO,
    followOutput,
    { listState, topItemsIndexes, ...flags },
    { scrollToIndex },
    _,
    { topItemCount },
    { groupCounts },
    featureGroup1,
    log,
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
      ...log,
    }
  },
  u.tup(
    sizeSystem,
    initialTopMostItemIndexSystem,
    domIOSystem,
    followOutputSystem,
    listStateSystem,
    scrollToIndexSystem,
    upwardScrollFixSystem,
    topItemCountSystem,
    groupedListSystem,
    featureGroup1System,
    loggerSystem
  )
)
