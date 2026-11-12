---
'@virtuoso.dev/data-table': patch
---

Render rows again in environments without layout, such as jsdom tests. The 0.6.2 hidden-ancestor guard skipped every resize entry when an element had no client rects, which jsdom reports for every element, so tables in jsdom tests rendered no rows. The guard now also requires the entry to report a zero size.
