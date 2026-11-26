---
'@virtuoso.dev/reactive-engine-query': minor
---

Add `concurrency` (`'parallel'`, `'serial'`, `'coalesce'`, or `'switch'`), `key`, and `merge` options to `Mutation`, plus a `pendingCount$` cell that stays accurate when calls overlap. `mutationFn` now receives an `AbortSignal`, pending, success, and error results include their `params`, and `onSuccess`/`onError` receive the params and the engine. `reset$` now aborts running calls instead of letting them overwrite the idle state, and retry delays stop when a call or query is aborted. Requires `@virtuoso.dev/reactive-engine-core` 0.3.0.
