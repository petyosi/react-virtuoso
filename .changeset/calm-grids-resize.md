---
'react-virtuoso': patch
---

Fix flickering and unnecessary cell remounts when resizing a scrolled VirtuosoGrid. Measure each grid's viewport and items together and commit its range and padding before paint, including with window scrolling and custom scroll parents.
