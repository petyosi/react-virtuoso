---
id: mui-table-virtual-scroll
title: Table Virtuoso with mui table
sidebar_label: MUI Table
slug: /mui-table-virtual-scroll/
---

The structure of `TableVirtuoso` is compatible with the markup of MUI Table. Notice the adjustment of the `borderCollapse` styling.

## MUI Table virtualized with Table Virtuoso

```jsx live
<TableVirtuoso
  data={generateUsers(100)}
  components={{
    Scroller: React.forwardRef((props, ref) => <MUI.TableContainer component={MUI.Paper} {...props} ref={ref} />),
    Table: props => <MUI.Table {...props} style={{ borderCollapse: 'separate' }} />,
    TableHead: MUI.TableHead,
    TableRow: MUI.TableRow,
    TableBody: React.forwardRef((props, ref) => <MUI.TableBody {...props} ref={ref} />),
  }}
  fixedHeaderContent={() => (
    <MUI.TableRow>
      <MUI.TableCell style={{ width: 150, background: 'var(--ifm-color-emphasis-200)', color: 'var(--ifm-font-color-base)' }}>
        Name
      </MUI.TableCell>
      <MUI.TableCell style={{ background: 'var(--ifm-color-emphasis-200)', color: 'var(--ifm-font-color-base)' }}>
        Description
      </MUI.TableCell>
    </MUI.TableRow>
  )}
  itemContent={(index, user) => (
    <>
      <MUI.TableCell style={{ width: 150, background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)' }}>
        {user.name}
      </MUI.TableCell>
      <MUI.TableCell style={{ background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)' }}>
        {user.description}
      </MUI.TableCell>
    </>
  )}
/>
```
