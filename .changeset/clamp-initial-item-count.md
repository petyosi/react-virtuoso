---
'react-virtuoso': patch
---

Fixed "Zero-sized element, this should not happen" error when `initialItemCount` exceeds the available `data`. The initial list state builder now clamps the item count to the data remaining after `initialTopMostItemIndex`, and renders no items when `data` is explicitly empty, preventing phantom items with `undefined` data from being rendered. `initialItemCount` also became a reactive input of the list state computation, so changing it after mount recomputes the list instead of leaving stale state until an unrelated update.
