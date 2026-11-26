---
'@virtuoso.dev/reactive-engine-core': minor
---

Add `coalescePromise` and `concatMapPromise` for ordered async writes, and a `key` option on them and on `switchMapPromise` so ordering applies per record. `coalescePromise` keeps one request in flight and sends only the newest waiting input, with an optional `merge` for partial updates.
