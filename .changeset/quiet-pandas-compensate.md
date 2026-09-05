---
'react-virtuoso': patch
---

Fix the transcript blanking for a frame when an older page is prepended.

The compensation for a prepend was a deviation that grows the content followed, one
`requestAnimationFrame` later, by the scroll that cancels it. In between there is a painted frame in
which the list is displaced by the whole page — and because prepends fire near `scrollTop` 0, that
displacement is the entire viewport.

The scroll now runs as soon as the renderer acknowledges, from a layout effect, that the deviation
has reached the DOM: after the mutation, before paint. Both land in the same paint, and because the
content has already grown the scroll can no longer be clamped to the old maximum. If nothing
acknowledges by the next frame the previous deferred behaviour still applies, so the worst case is
unchanged.
