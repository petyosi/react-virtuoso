---
"react-virtuoso": patch
---

Treat an `initialTopMostItemIndex` of `{ index: 0 }` the same as `0`. Previously the object form was considered a non-default initial location, which triggered a redundant initial scroll and delayed `followOutput` from engaging. Both forms now resolve to "start at the top".
