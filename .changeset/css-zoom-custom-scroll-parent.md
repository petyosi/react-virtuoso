---
'react-virtuoso': patch
---

Fixed lists using `customScrollParent` or `useWindowScroll` inside an element with CSS `zoom`. The rendered items drifted away from the scroll position, leaving blank space that grew as you scrolled, and `endReached` stopped firing. Sizes read with `getBoundingClientRect()` are now converted to the same pixels as `scrollTop`, for `Virtuoso`, `TableVirtuoso` and `VirtuosoGrid`.
