---
'@virtuoso.dev/reactive-engine-query': major
---

`Mutation` now runs one call at a time per record, and the new `ConcurrentMutation` handles writes that overlap.

**Migration, step 1: `key` is now required, so every existing `Mutation` fails to compile until you choose.**

- `key: false` if the mutation serves one record at a time, such as a single form. A second call while the first runs is ignored, not run.
- A key function for per-row actions shared across rows, with the key type as the third type argument: `Mutation<Params, Data, number>({ key: ({ id }) => id, … })`. With two type arguments, a key function fails with "No overload matches this call".
- `ConcurrentMutation` when every call carries a new value that must reach the server, such as a toggle that saves per click: `concurrency: 'coalesce'` (latest value wins, optional `merge`), `'serial'` (every call, in order), or `'parallel'` (independent calls). The closest equivalent of 2.0.2 behavior is `ConcurrentMutation({ concurrency: 'parallel', key: false, … })`, but its `data$` has the `ConcurrentMutationState` shape.

**Also changed:**

- A keyed `Mutation` exposes `status$`, a `ReadonlyMap` of per-record results, instead of `data$`. Read records with `status.get(key)`.
- `reset$` is replaced by `dismiss$` (and `dismissAll$` when keyed). Dismiss never returns a pending call to idle; its result still appears when it settles.
- A call for a busy record is ignored: it is reported on the new `settled$` stream as `ignored`, calls `onIgnored` if given, and warns in development otherwise. Disable the control while the record is pending.
- `settled$` emits one outcome per input (`success`, `error`, `ignored`; `dropped` for `ConcurrentMutation`). Results and outcomes carry `params`, keyed ones carry `key`, and settled results carry `settledAt`.
- Repeated equal params each make a call; 2.0.2 suppressed equal consecutive params.
- `mutationFn` receives an `AbortSignal`, aborted only when the engine is disposed; a call that started is never aborted otherwise. `onSuccess` and `onError` receive the params and the engine, and run directly after the outcome is delivered. Retry delays stop when a call or query is aborted.
- With child engines, register shared mutations in the root engine at startup, for example `root.register(mutation.mutate$)`. Using one from a child engine before its parent is unsupported and warns in development.
- Requires `@virtuoso.dev/reactive-engine-core` `^0.3.0`.
