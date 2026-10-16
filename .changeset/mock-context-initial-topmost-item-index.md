---
'react-virtuoso': patch
---

Fixed `initialTopMostItemIndex` and `scrollToIndex` having no effect inside `VirtuosoMockContext`. The scroller now reports the requested scroll position directly, so the list renders the target items in tests instead of staying empty or starting from the first item.
