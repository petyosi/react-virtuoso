---
'react-virtuoso': patch
---

Fix one-frame flicker on upward scroll: wrap the `skipAnimationFrameInResizeObserver` measurement dispatch in `ReactDOM.flushSync`, matching the treatment already given to native scroll events in `useScrollTop.ts`.
