import Avatar from '@mui/material/Avatar'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import { forwardRef, useMemo } from 'react'
import { GroupedVirtuoso, GroupedVirtuosoProps } from 'react-virtuoso'

const MUIComponents: GroupedVirtuosoProps<unknown, unknown>['components'] = {
  Group: ({ children, style, ...props }) => {
    return (
      <ListSubheader
        component="div"
        {...props}
        style={{
          ...style,
          backgroundColor: '#f5f5f5',
          margin: 0,
        }}
      >
        {children}
      </ListSubheader>
    )
  },
  Item: ({ children, ...props }) => {
    return (
      <ListItem component="div" {...props} style={{ margin: 0 }}>
        {children}
      </ListItem>
    )
  },
  List: forwardRef(({ children, style }, listRef) => {
    return (
      <List component="div" ref={listRef} style={{ padding: 0, ...style, margin: 0 }}>
        {children}
      </List>
    )
  }),
}

export const MuiListExample = () => {
  const { groupCounts, groups, users } = useMemo(() => {
    const users = Array.from({ length: 500 }, (_, index) => ({
      description: `Description for user ${index}`,
      initials: `U${index}`,
      name: `User ${index}`,
    }))
    const groups = Array.from({ length: 10 }, (_, index) => `Group ${index}`)
    const groupCounts = groups.map((_, index) => {
      return users.filter((_, userIndex) => userIndex % 10 === index).length
    })
    return { groupCounts, groups, users }
  }, [])

  return (
    <GroupedVirtuoso
      components={MUIComponents}
      groupContent={(index) => {
        return <div>{groups[index]}</div>
      }}
      groupCounts={groupCounts}
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
      style={{ height: '100%' }}
    />
  )
}
