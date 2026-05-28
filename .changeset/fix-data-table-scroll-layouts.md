---
"@virtuoso.dev/data-table": patch
---

Fix Data Table scroll behavior in sticky-column, external-scroller, and window-scroll layouts.

- Match sticky column hover transitions with the rest of the row in the shadcn wrapper.
- Avoid rendering the internal scrollbar overlay when `customScrollParent` or `useWindowScroll` owns scrolling.
- Restore row virtualization for `useWindowScroll` by measuring against the window viewport instead of the table wrapper height.
