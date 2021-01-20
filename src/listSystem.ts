import { system, tup, connect } from '@virtuoso.dev/urx'
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

// workaround the growing list of systems below
// fix this with 4.1 recursive conditional types
const featureGroup1System = system(
  ([sizeRange, initialItemCount, propsReady, scrollSeek, totalListHeight, initialScrollTopSystem, alignToBottom, windowScroller]) => {
    return {
      ...sizeRange,
      ...initialItemCount,
      ...propsReady,
      ...scrollSeek,
      ...totalListHeight,
      ...initialScrollTopSystem,
      ...alignToBottom,
      ...windowScroller,
    }
  },
  tup(
    sizeRangeSystem,
    initialItemCountSystem,
    propsReadySystem,
    scrollSeekSystem,
    totalListHeightSystem,
    initialScrollTopSystem,
    alignToBottomSystem,
    windowScrollerSystem
  )
)

export const listSystem = system(
  ([
    { totalCount, sizeRanges, fixedItemSize, defaultItemSize, trackItemSizes, data, firstItemIndex, groupIndices },
    { initialTopMostItemIndex },
    domIO,
    followOutput,
    { listState, topItemsIndexes, ...flags },
    { scrollToIndex },
    _,
    { topItemCount },
    { groupCounts },
    featureGroup1,
  ]) => {
    connect(flags.rangeChanged, featureGroup1.scrollSeekRangeChanged)

    return {
      // input
      totalCount,
      data,
      firstItemIndex,
      sizeRanges,
      initialTopMostItemIndex,
      topItemsIndexes,
      topItemCount,
      groupCounts,
      fixedItemHeight: fixedItemSize,
      defaultItemHeight: defaultItemSize,
      followOutput: followOutput.followOutput,

      // output
      listState,
      scrollToIndex,
      trackItemSizes,
      groupIndices,

      // exported from stateFlagsSystem
      ...flags,
      // the bag of IO from featureGroup1System
      ...featureGroup1,
      ...domIO,
    }
  },
  tup(
    sizeSystem,
    initialTopMostItemIndexSystem,
    domIOSystem,
    followOutputSystem,
    listStateSystem,
    scrollToIndexSystem,
    upwardScrollFixSystem,
    topItemCountSystem,
    groupedListSystem,
    featureGroup1System
  )
)
