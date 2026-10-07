---
'react-virtuoso': patch
---

Fixed `GroupedVirtuoso` calling `computeItemKey` and `itemContent` with a non-existent item index when all groups are empty (e.g. `groupCounts={[0]}`) or when `initialTopMostItemIndex` is `LAST`. The initial size probe now stays within the existing items, and probes only the group headers when there are no items.
