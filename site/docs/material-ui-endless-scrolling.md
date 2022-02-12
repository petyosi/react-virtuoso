---
id: material-ui-endless-scrolling
title: MUI List
sidebar_label: MUI List
slug: /material-ui-endless-scrolling/
---

The React Virtuoso component supports customization of its internal components to accommodate styled components from frameworks like MUI.

The example below displays 500 records grouped by name, using the [the List components from MUI](https://mui.com/components/lists/).

```jsx live include-data import=@mui/material
import { GroupedVirtuoso } from 'react-virtuoso'
import { generateGroupedUsers, generateUsers } from './data'
import List from '@mui/material/List'
import ListSubheader from '@mui/material/ListSubheader'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import ListItemText from '@mui/material/ListItemText'
import React, { useMemo } from 'react'

export default function App() {
  const { users, groups, groupCounts } = generateGroupedUsers(500)

  return (
    <GroupedVirtuoso
      style={{ height: 400 }}
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


const MUIComponents = {
  List: React.forwardRef(({ style, children }, listRef) => {
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
          backgroundColor: 'white',
          margin: 0,
        }}
      >
        {children}
      </ListSubheader>
    )
  },
}
```
