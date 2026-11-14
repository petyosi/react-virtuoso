---
'react-virtuoso': minor
---

Add `cancelScrollToIndex()` to the `Virtuoso`, `GroupedVirtuoso`, `TableVirtuoso` and `GroupedTableVirtuoso` handles. After `scrollToIndex` scrolls, it retries for at least 150 ms whenever item sizes change, and a user scroll inside that window renders new items and triggers a retry that scrolls back to the old target. Call `cancelScrollToIndex()` when the user (or your own code) takes over the scroll position to stop the pending retries. It does not move the viewport.
