---
'@virtuoso.dev/data-table': minor
---

Keep the measured column header at its natural width when a consumer style stretches it with flex-grow or a percentage width. The header's measured width is the column's base width, so a stretched header used to record its grown width as the base, and grow columns never gave the extra width back when the table narrowed. Consumers can set fixed and minimum base widths on the intrinsic header surface.

Add `containerProps` to `ColumnHeader` for styles, event handlers, and accessibility attributes that must cover the full rendered column width without changing its intrinsic measurement.
