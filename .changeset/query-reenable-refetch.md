---
'@virtuoso.dev/reactive-engine-query': patch
---

Fix a `Query` that stopped reacting to `enabled$` after its first toggle. Setting `enabled$` back to `true` now fetches with the current params every time, and setting it to `false` again aborts the in-flight request and stops `refetchInterval` polling. Both reactions previously ran through filtered streams, which are distinct, so only the first enable and the first disable took effect.
