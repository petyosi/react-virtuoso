---
'@virtuoso.dev/reactive-engine-query': minor
---

Add `concurrency` (`'parallel'`, `'serial'`, `'coalesce'`, or `'switch'`), `key`, and `merge` options to `Mutation`, plus a pending count on every result and a `pendingCount$` cell derived from `data$`, so the count stays accurate when calls overlap. `mutationFn` now receives an `AbortSignal`, pending, success, and error results include their `params`, and `onSuccess`/`onError` receive the params and the engine. `reset$` now aborts running calls instead of letting them overwrite the idle state, repeated `mutate$` params and repeated `reset$` calls each act, callbacks run after `data$` subscribers have seen the result, and retry delays stop when a call or query is aborted. Requires `@virtuoso.dev/reactive-engine-core` 0.3.0.
