---
'@virtuoso.dev/reactive-engine-core': patch
---

Allow downstream wiring to reference a computed cell while its initial value is being calculated, while still rejecting recursive reads of unfinished computed state.
