---
'@virtuoso.dev/reactive-engine-query': minor
---

Make `Mutation` safe for writes that fire faster than their round trip. Every call now ends with exactly one outcome on a new `settled$` stream (`success`, `error`, or `dropped` for calls that never started), and `onSuccess`/`onError` run for every call; `reset$` does not suppress either. `data$` is display state: `reset$` returns it to idle and calls made before the reset no longer appear in it, but they keep running. A started call is never aborted, because aborting does not undo a request the server received; the `AbortSignal` now passed to `mutationFn(params, signal)` aborts only on engine disposal.

New options: `concurrency` (`'parallel'` by default, `'serial'`, or `'coalesce'`), `key` to apply `'serial'`/`'coalesce'` per record, and `merge` to combine waiting partial updates under `'coalesce'`. TypeScript rejects `key` with `'parallel'` and `merge` outside `'coalesce'`. New nodes: `pendingCount$` counts running and waiting calls, and `dropWaiting$` drops calls that have not started.

Pending, success, and error results on `data$` now include their `params`, so code that builds `MutationResult` objects by hand must add the field. `onSuccess`/`onError` receive the params and the engine and run after `data$` subscribers have seen the result. Repeated equal `mutate$` params each make a call, and retry delays stop when a call or query is aborted. Requires `@virtuoso.dev/reactive-engine-core` 0.3.0.
