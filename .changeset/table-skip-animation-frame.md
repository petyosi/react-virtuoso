---
'react-virtuoso': patch
---

Map `skipAnimationFrameInResizeObserver` through TableVirtuoso's urx optional props so the table resize observer consumes it instead of leaving the leftover prop on the scroller DOM.
