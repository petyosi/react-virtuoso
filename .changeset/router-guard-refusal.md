---
'@virtuoso.dev/reactive-engine-router': patch
---

Keep the router working when an async guard keeps the reader where they are. A guard that resolved to `navigate()` or `redirect()` left the router suspended on its pending placeholder and left the refused route set, so later navigation, including asking for the same route again, never reached the guards. The router now restores what it showed before the guard ran and clears the refused route. The active route also renders inside the router's own Suspense boundary, so a pending guard no longer suspends content outside the router or disposes the router engine, which made an async guard on the first load run again without end.
