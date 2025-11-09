---
title: MUI List
sidebar:
  label: MUI List
  order: 1
---

The React Virtuoso component supports customization of its internal components to accommodate styled components from frameworks like MUI.

The example below displays 500 records grouped by name, using the [the List components from MUI](https://mui.com/components/lists/).

```tsx live noSandbox
import {GroupedVirtuoso, GroupedVirtuosoProps} from 'react-virtuoso'
import {useMemo, forwardRef} from 'react'
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";

// the object includes the necessary MUI components for this example.

const MUIComponents: GroupedVirtuosoProps<unknown, unknown>['components'] = {
  List: forwardRef(({ style, children }, listRef) => {
    return (
      <List style={{ padding: 0, ...style, margin: 0 }} component="div" ref={listRef}>
        {children}
      </List>
    )
  }),

  Item: ({ children, ...props }) => {
    return (
      <ListItem component="div" {...props} style={{ margin: 0 }}>
        {children}
      </ListItem>
    )
  },

  Group: ({ children, style, ...props }) => {
    return (
      <ListSubheader
        component="div"
        {...props}
        style={{
          ...style,
          backgroundColor: 'var(--ifm-color-content-inverse)',
          margin: 0,
        }}
      >
        {children}
      </ListSubheader>
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
            <ListItemAvatar>
              <Avatar>{user.initials}</Avatar>
            </ListItemAvatar>

            <ListItemText primary={user.name} secondary={<span>{user.description}</span>} />
          </>
        )
      }}
    />
  )
}

 
```
