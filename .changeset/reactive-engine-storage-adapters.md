---
'@virtuoso.dev/reactive-engine-storage': patch
---

Add per-engine synchronous storage adapters with identity-based sharing, replacement, removal, debounce, and disposal contracts while preserving legacy storage links. Browser adapters retain cookie identity during removal and resolve native storage identity when subscribing so later events do not re-enter protected storage accessors.
