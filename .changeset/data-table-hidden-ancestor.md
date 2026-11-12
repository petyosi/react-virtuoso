---
'@virtuoso.dev/data-table': patch
---

Keep the rows of a data table whose ancestor is hidden with `display: none`. The table no longer records zero sizes while hidden, so it renders its rows again when the ancestor shows, and development builds no longer throw a zero-size error.
