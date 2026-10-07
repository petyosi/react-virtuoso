---
'react-virtuoso': patch
---

Fixed `endReached` receiving an index that includes the group headers in `GroupedVirtuoso` and `GroupedTableVirtuoso`. The callback now receives the index of the last real item - e.g. 499 instead of 522 for a list of 500 items with 23 groups.
