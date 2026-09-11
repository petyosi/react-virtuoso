---
'react-virtuoso': patch
---

Fixed "Zero-sized element, this should not happen" error when `initialItemCount` exceeds `data.length`. The initial list state builder now clamps the item count to the data array length when the `data` prop is used, preventing phantom items with `undefined` data from being rendered.
