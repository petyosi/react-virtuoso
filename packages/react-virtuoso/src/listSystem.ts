import { alignToBottomSystem } from './alignToBottomSystem'
import { contextSystem } from './contextSystem'
import { domIOSystem } from './domIOSystem'
import { followOutputSystem } from './followOutputSystem'
import { groupedListSystem } from './groupedListSystem'
import { initialItemCountSystem } from './initialItemCountSystem'
import { initialScrollTopSystem } from './initialScrollTopSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { listStateSystem } from './listStateSystem'
import { loggerSystem } from './loggerSystem'
import { propsReadySystem } from './propsReadySystem'
import { scrollIntoViewSystem } from './scrollIntoViewSystem'
import { scrollSeekSystem } from './scrollSeekSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { sizeRangeSystem } from './sizeRangeSystem'
import { sizeSystem } from './sizeSystem'
import { stateLoadSystem } from './stateLoadSystem'
import { topItemCountSystem } from './topItemCountSystem'
import { totalListHeightSystem } from './totalListHeightSystem'
import { upwardScrollFixSystem } from './upwardScrollFixSystem'
import * as u from './urx'
import { windowScrollerSystem } from './windowScrollerSystem'

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
    context,
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
      ...context,
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
    loggerSystem,
    contextSystem
  )
)

export const listSystem = u.system(
  ([
    {
      data,
      defaultItemSize,
      firstItemIndex,
      fixedItemSize,
      fixedGroupSize,
      gap,
      groupIndices,
      heightEstimates,
      itemSize,
      sizeRanges,
      sizes,
      statefulTotalCount,
      totalCount,
      trackItemSizes,
    },
    { initialItemFinalLocationReached, initialTopMostItemIndex, scrolledToInitialItem },
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
      data,
      defaultItemHeight: defaultItemSize,
      firstItemIndex,
      fixedItemHeight: fixedItemSize,
      fixedGroupHeight: fixedGroupSize,
      gap,
      groupCounts,
      heightEstimates,
      initialItemFinalLocationReached,
      initialTopMostItemIndex,
      scrolledToInitialItem,
      sizeRanges,
      topItemCount,
      topItemsIndexes,
      // input
      totalCount,
      ...followOutput,

      groupIndices,
      itemSize,
      listState,
      scrollToIndex,
      // output
      statefulTotalCount,
      trackItemSizes,

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
