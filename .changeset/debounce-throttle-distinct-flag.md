---
'@virtuoso.dev/reactive-engine-core': minor
---

Add a `distinct` parameter to `debounceTime` and `throttleTime`, mirroring `map`. Both operators emit through a distinct stream by default, so a valueless `Trigger` piped through them fires once and is then suppressed forever. Pass `false` to re-emit equal values, or a comparator to define equality.
