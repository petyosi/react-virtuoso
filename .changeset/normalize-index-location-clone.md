---
"react-virtuoso": patch
---

Stop mutating the location object passed to `scrollToIndex`. `normalizeIndexLocation` now applies its defaults to a shallow copy, so a shared or memoized location object is no longer altered (and re-published with mutated defaults on scroll retries).
