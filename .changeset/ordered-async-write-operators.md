---
'@virtuoso.dev/reactive-engine-core': minor
---

Add Promise operators for writes: `coalescePromise` keeps one request in flight and sends only the newest waiting input, with an optional `merge` for partial updates; `concatMapPromise` runs every input in order; `exhaustMapPromise` ignores inputs while work runs, for actions where a second request would be a duplicate. All three accept a `key` so they apply per record, and `switchMapPromise` accepts `key` as well.
