---
'@virtuoso.dev/reactive-engine-core': patch
---

Fix derived nodes that kept a stale value after a subscriber published during a cycle. When the outer cycle later recomputed a `combineCells`, `ComputedCell`, or `withLatestFrom` node, it read the value from before the nested publication and overwrote the correct result. `useCellValues` then kept rendering the old value while `useCellValue` showed the new one. A nested cycle now writes its accepted values into every running cycle on the engine, including the values forwarded to child engines.
