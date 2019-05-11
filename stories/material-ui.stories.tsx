import React from 'react'
import { useState } from 'react'

import { storiesOf } from '@storybook/react'

import { Virtuoso } from '../src/Virtuoso'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import { ListItemText, ListItemAvatar, Avatar, Button, Divider } from '@material-ui/core'
import Box from '@material-ui/core/Box'

import FolderIcon from '@material-ui/icons/Folder'

const MaterialList = () => {
  const [total, setTotal] = useState(300)

  return (
    <List
      component="div"
      style={{
        height: '500px',
        width: '50%',
        minWidth: '200px',
        maxWidth: '350px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <Virtuoso
        totalCount={total}
        overscan={0}
        item={(index: number) => {
          return (
            <div>
              <ListItem component="div">
                <ListItemAvatar>
                  <Avatar>
                    <FolderIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={`Item ${index}`} secondary={'some more text'} />
              </ListItem>
              <Divider variant="inset" />
            </div>
          )
        }}
        footer={() => {
          return (
            <Box p={2} alignItems="center" display="flex" justifyContent="center">
              {' '}
              <Button variant="contained" color="primary" onClick={() => setTotal(total + 30)}>
                Load More
              </Button>
            </Box>
          )
        }}
      />
    </List>
  )
}

storiesOf('Integration', module).add('Material UI', () => <MaterialList />)
