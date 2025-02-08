---
id: mui-table-virtual-scroll
title: Table Virtuoso with MUI table
sidebar_label: MUI Table
slug: /mui-table-virtual-scroll/
sidebar_position: 1
---

The structure of `TableVirtuoso` is compatible with the markup of MUI Table. Notice the adjustment of the `borderCollapse` styling.

Notice that you should keep table components outside of the component defniition to avoid re-renders.
If you need to interact with a state within the component, you can pass the state through the table's `context` prop;
its value will be propagated in the below component `context` prop.
See the [press to load more example](../press-to-load-more/) for an example usage of the context.

## MUI Table virtualized with Table Virtuoso

```jsx live noInline

const TableComponents = {
  Scroller: React.forwardRef((props, ref) => <MUITable.TableContainer component={MUITable.Paper} {...props} ref={ref} />),
  Table: (props) => <MUITable.Table {...props} style={{ borderCollapse: 'separate' }} />,
  TableHead: MUITable.TableHead,
  TableRow: MUITable.TableRow,
  TableBody: React.forwardRef((props, ref) => <MUITable.TableBody {...props} ref={ref} />),
}

function App() {
  const users = useMemo(() => Array.from({ length: 100 }, (_, index) => ({
        name: `User ${index}`,
        description: `${index} description`
      })), [])

  return (
    <TableVirtuoso
      style={{ height: 400 }}
      data={users}
      components={TableComponents}
      fixedHeaderContent={() => (
        <MUITable.TableRow>
          <MUITable.TableCell style={{ width: 150, background: 'white' }}>
            Name
          </MUITable.TableCell>
          <MUITable.TableCell style={{ background: 'white' }}>
            Description
          </MUITable.TableCell>
        </MUITable.TableRow>
      )}
      itemContent={(index, user) => (
        <>
          <MUITable.TableCell style={{ width: 150, background: 'white' }}>
            {user.name}
          </MUITable.TableCell>
          <MUITable.TableCell style={{ background: 'white'  }}>
            {user.description}
          </MUITable.TableCell>
        </>
      )}
    />
  )
}

render(<App />)
```
