---
'react-virtuoso': patch
---

Cancel queued viewport measurements when a custom scroll parent changes or unmounts, so an old resize cannot overwrite the current parent's offset and misalign a later scrollToIndex call.
