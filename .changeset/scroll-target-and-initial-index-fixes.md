---
'react-virtuoso': patch
---

Harden scroll-target and initial-index handling:

- Clamp the initial top-most item index to the available range, so an out-of-range `initialTopMostItemIndex` (for example after the data set shrinks) no longer starts the list at a blank or mid-list position.
- Stop mutating the location object passed to `scrollToIndex`; `normalizeIndexLocation` now applies its defaults to a shallow copy.
- Treat a default-positioned `initialTopMostItemIndex` of `{ index: 0 }` the same as `0`, avoiding a redundant initial scroll and a delayed `followOutput`.
