---
'@virtuoso.dev/reactive-engine-core': patch
---

Add synchronous after-settle continuations so graph work can wait for current propagation while retaining transaction diagnostics and
event ordering.
