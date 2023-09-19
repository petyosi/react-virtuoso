---
id: tanstack-table-integration
title: Table Virtuoso integrated with @tanstack/table
sidebar_label: "@tanstack/table"
slug: /tanstack-table-integration/
---

The following takes the [virtualized rows example of @tanstack/table](https://tanstack.com/table/v8/docs/examples/react/virtualized-rows) and instead of using @tanstack/virtual it uses Table Virtoso.

## Virtualized @tanstack/table with Table Virtuoso

```jsx live include-data import=@tanstack/react-table
import React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { TableVirtuoso } from "react-virtuoso";

import { makeData } from "./data";

export default function App() {
  const rerender = React.useReducer(() => ({}), {})[1];

  const [sorting, setSorting] = React.useState([]);

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "firstName",
        cell: (info) => info.getValue()
      },
      {
        accessorFn: (row) => row.lastName,
        id: "lastName",
        cell: (info) => info.getValue(),
        header: () => <span>Last Name</span>
      },
      {
        accessorKey: "age",
        header: () => "Age",
        size: 50
      },
      {
        accessorKey: "visits",
        header: () => <span>Visits</span>,
        size: 50
      },
      {
        accessorKey: "status",
        header: "Status"
      },
      {
        accessorKey: "progress",
        header: "Profile Progress",
        size: 80
      }
    ],
    []
  );

  const [data, setData] = React.useState(() => makeData(500));
  const refreshData = () => setData(() => makeData(500));

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const { rows } = table.getRowModel();

  return (
    <div style={{ padding: "0.5rem" }}>
      <div style={{ height: "0.5rem" }} />

      <TableVirtuoso
        style={{ height: "500px", border: "1px solid lightgray" }}
        totalCount={rows.length}
        components={{
          Table: ({ style, ...props }) => {
            return (
              <table
                {...props}
                style={{
                  ...style,
                  width: "100%",
                  tableLayout: "fixed",
                  borderCollapse: "collapse",
                  borderSpacing: 0
                }}
              />
            );
          },
          TableRow: (props) => {
            const index = props["data-index"];
            const row = rows[index];

            return (
              <tr {...props}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ padding: "6px" }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          }
        }}
        fixedHeaderContent={() => {
          return table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              style={{ background: "lightgray", margin: 0 }}
            >
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      width: header.getSize(),
                      borderBottom: "1px solid lightgray",
                      padding: "2px 4px",
                      textAlign: "left"
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                      <div
                        {...{
                          style: header.column.getCanSort()
                            ? { cursor: "pointer", userSelect: "none" }
                            : {},
                          onClick: header.column.getToggleSortingHandler()
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽"
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ));
        }}
      />

      <div>{table.getRowModel().rows.length} Rows</div>
      <div>
        <button onClick={() => rerender()}>Force Rerender</button>
      </div>
      <div>
        <button onClick={() => refreshData()}>Refresh Data</button>
      </div>
    </div>
  );
}
```
