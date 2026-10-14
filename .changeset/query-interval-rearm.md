---
'@virtuoso.dev/reactive-engine-query': patch
---

Stop a polling query from re-arming its `refetchInterval` after a `data$` subscriber disables it, changes its params, or starts another fetch while handling a successful result.
