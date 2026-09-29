---
'@virtuoso.dev/data-table': patch
---

Keep the measured column header at its natural width when a consumer style lets it grow. The header's measured width is the column's base width, so a stretched header used to record its grown width as the base, and grow columns never gave the extra width back when the table narrowed.
