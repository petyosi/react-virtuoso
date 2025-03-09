---
id: material-ui-endless-scrolling
title: MUI List
sidebar_label: MUI List
slug: /material-ui-endless-scrolling/
sidebar_position: 1
---

The React Virtuoso component supports customization of its internal components to accommodate styled components from frameworks like MUI.

The example below displays 500 records grouped by name, using the [the List components from MUI](https://mui.com/components/lists/).

```tsx live
import {GroupedVirtuoso} from 'react-virtuoso'
// the MUIList object includes the necessary MUI components for this example.

const MUIComponents = {
  List: React.forwardRef(({ style, children }, listRef) => {
    return (
      <MUIList.List style={{ padding: 0, ...style, margin: 0 }} component="div" ref={listRef}>
        {children}
      </MUIList.List>
    )
  }),

  Item: ({ children, ...props }) => {
    return (
      <MUIList.ListItem component="div" {...props} style={{ margin: 0 }}>
        {children}
      </MUIList.ListItem>
    )
  },

  Group: ({ children, style, ...props }) => {
    return (
      <MUIList.ListSubheader
        component="div"
        {...props}
        style={{
          ...style,
          backgroundColor: 'var(--ifm-color-content-inverse)',
          margin: 0,
        }}
      >
        {children}
      </MUIList.ListSubheader>
    )
  },
}

export default function App() {
  const { users, groups, groupCounts } = useMemo(() => {
    const users = Array.from({ length: 500 }, (_, index) => ({
      name: `User ${index}`,
      initials: `U${index}`,
      description: `Description for user ${index}`,
    }))
    const groups = Array.from({ length: 10 }, (_, index) => `Group ${index}`)
    const groupCounts = groups.map((_, index) => {
      return users.filter((_, userIndex) => userIndex % 10 === index).length
    })
    return { users, groups, groupCounts }
  }, [])


  return (
    <GroupedVirtuoso
      style={{ height: '100%' }}
      groupCounts={groupCounts}
      components={MUIComponents}
      groupContent={(index) => {
        return <div>{groups[index]}</div>
      }}
      itemContent={(index) => {
        const user = users[index]
        return (
          <>
            <MUIList.ListItemAvatar>
              <MUIList.Avatar>{user.initials}</MUIList.Avatar>
            </MUIList.ListItemAvatar>

            <MUIList.ListItemText primary={user.name} secondary={<span>{user.description}</span>} />
          </>
        )
      }}
    />
  )
}

 
```
