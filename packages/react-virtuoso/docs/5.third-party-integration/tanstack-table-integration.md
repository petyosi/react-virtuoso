---
title: Table Virtuoso integrated with @tanstack/table
sidebar:
  label: "@tanstack/table"
---

This example takes the [virtualized rows example of @tanstack/table](https://tanstack.com/table/v8/docs/examples/react/virtualized-rows) and uses Table Virtuoso instead of @tanstack/virtual.

## Virtualized @tanstack/table with Table Virtuoso

The integration works by using `useReactTable` to manage column definitions, sorting state, and row data, then passing the resulting row model to `TableVirtuoso`. The `TableRow` component accesses each row via the `data-index` prop and uses `flexRender` to render cells according to the column definitions. The `fixedHeaderContent` prop renders sortable column headers by mapping over `table.getHeaderGroups()`, with click handlers that toggle sorting. This approach lets @tanstack/table handle all the table logic while Table Virtuoso handles the virtualization.

View the [example source code on GitHub](https://github.com/petyosi/react-virtuoso/blob/master/examples/react-virtuoso/tanstack-table.stories.tsx).
