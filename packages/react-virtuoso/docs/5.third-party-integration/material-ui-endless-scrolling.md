---
title: MUI List
description: Use React Virtuoso with Material UI List components for virtualized grouped lists with MUI styling.
sidebar:
  label: MUI List
  order: 1
---

The React Virtuoso component supports customization of its internal components to accommodate styled components from frameworks like MUI.

The example displays 500 records grouped by name, using the [List components from MUI](https://mui.com/components/lists/).

The implementation uses `GroupedVirtuoso` with custom MUI components passed through the `components` prop. The `List` component maps to MUI's `List`, `Item` maps to `ListItem`, and `Group` maps to `ListSubheader` for sticky group headers. Each component wrapper forwards the required props and refs while applying MUI-specific styling. The `groupCounts` array defines how many items belong to each group, and the `groupContent` and `itemContent` render props handle the actual content rendering with `ListItemAvatar` and `ListItemText`.

View the [example source code on GitHub](https://github.com/petyosi/react-virtuoso/blob/master/examples/react-virtuoso/mui-list.stories.tsx).
