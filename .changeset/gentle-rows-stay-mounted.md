---
'@virtuoso.dev/data-table': minor
---

Add `model.updateData(data)` for applying a same-shape data snapshot (same length, same rows at the same indices) without resetting the known row-size tree, so mounted cells keep their DOM nodes and local state (focused inputs, popovers, etc.) across the update. `setData()` is unchanged and still resets the size tree.
