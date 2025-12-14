---
title: Table Virtuoso with MUI Table
sidebar:
  label: MUI Table
  order: 1
---

The structure of `TableVirtuoso` is compatible with the markup of MUI Table. Notice the adjustment of the `borderCollapse` styling.

Keep the table components object outside of the component definition to avoid re-renders.
If you need to interact with state within the component, pass the state through the table's `context` prop;
its value will be available in each component's `context` prop.
See the [press to load more example](../press-to-load-more/) for an example usage of context.

## MUI Table virtualized with Table Virtuoso

The implementation maps each `TableVirtuoso` slot to its MUI equivalent: `Scroller` wraps with `TableContainer` and `Paper`, `Table` uses MUI's `Table` with `borderCollapse: 'separate'` to prevent border rendering issues during scrolling, and `TableBody`, `TableHead`, and `TableRow` use their MUI counterparts directly. The `fixedHeaderContent` prop renders the sticky header with `TableCell` components, while `itemContent` renders each row's cells.

View the [example source code on GitHub](https://github.com/petyosi/react-virtuoso/blob/master/examples/react-virtuoso/mui-table.stories.tsx).
