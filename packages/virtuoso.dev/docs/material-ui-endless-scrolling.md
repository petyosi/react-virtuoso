---
id: material-ui-endless-scrolling
title: Material UI
sidebar_label: Material UI
slug: /material-ui-endless-scrolling/
---

The React Virtuoso component supports customization of its internal components to accomodate styled components from frameworks like Material-UI. 

The example below displayes 500 records grouped by name, using the [the List components from Material-UI](https://material-ui.com/components/lists/).

```jsx live
() => {
  const { users, groups, groupCounts } = generateGroupedUsers(500)

  const { List, ListSubheader, ListItem, ListItemAvatar, Avatar, ListItemText } = MaterialUI;

  const Components = useMemo(() => {
    return {
      List: React.forwardRef(({ style, children }, listRef) => {
        return (
          <List
            style={{padding: 0, ...style, margin: 0}}
            component="div"
            ref={listRef}
          >
            {children}
          </List>
        );
      }),

      Item: ({ children, ...props }) => {
        return (
          <ListItem component="div" {...props} style={{ margin: 0 }}>
            {children}
          </ListItem>
        );
      },

      Group: ({ children, ...props }) => {
        return (
          <ListSubheader
            component="div"
            {...props}
            style={{
              backgroundColor: 'var(--ifm-background-color)',
              margin: 0
            }}
            disableSticky={true}
          >
            {children}
          </ListSubheader>
        );
      },
    };
  }, []);

  return (
    <GroupedVirtuoso
      groupCounts={groupCounts}
      components={Components}

      groupContent={index => {
        return <div>{groups[index]}</div>
      }}

      itemContent={index => {
        const user = users[index]
        return (
        <>
          <ListItemAvatar>
            <Avatar>{user.initials}</Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={user.name}
            secondary={ <span>{user.description}</span> }
          />
        </>
      )
      }}
    />
  )
}
```
