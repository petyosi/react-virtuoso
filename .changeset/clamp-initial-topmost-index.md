---
"react-virtuoso": patch
---

Clamp the initial top-most item index to the available range. An out-of-range `initialTopMostItemIndex` (for example after the data set shrinks) no longer starts the list at a blank or mid-list position.
