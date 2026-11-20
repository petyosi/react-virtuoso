---
'react-virtuoso': patch
---

Measure the current custom scroll parent in viewport updates queued before the parent changed, so an old resize cannot overwrite the current parent's offset and misalign a later scrollToIndex call.
