---
'@virtuoso.dev/data-table': minor
'@virtuoso.dev/reactive-engine-react': patch
---

Add id-based data table columns for display-only and computed values, keep
table-only props off DOM elements, and avoid disposing reactive engines during
React 18 StrictMode's development-only effect replay.
