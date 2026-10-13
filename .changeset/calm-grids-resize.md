---
'react-virtuoso': patch
---

Measure VirtuosoGrid's viewport, items, and gaps together and publish them as one update, avoiding mixed dimensions and unnecessary cell remounts during resizing. Use one observer per grid with stable element refs.

Add `skipAnimationFrameInResizeObserver` to VirtuosoGrid. Set it to `true` to reduce flicker while resizing a scrolled grid by measuring before paint, including with window scrolling and custom scroll parents. The default remains `false`, scheduling observer measurements in the next animation frame. Direct measurement can report `ResizeObserver loop completed with undelivered notifications` errors when rendering changes observed sizes; applications can retain the default scheduling to avoid that trade-off.
