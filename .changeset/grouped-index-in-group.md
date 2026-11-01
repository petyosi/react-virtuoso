---
'react-virtuoso': minor
---

`GroupedVirtuoso` and `GroupedTableVirtuoso` now pass the index of the item within its group as an additional last argument to `itemContent`: `itemContent(index, groupIndex, data, context, indexInGroup)`. The existing arguments are unchanged. Grouped list items reported through `itemsRendered` also include the new `indexInGroup` field.
