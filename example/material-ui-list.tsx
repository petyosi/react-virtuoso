import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/Virtuoso'
import { LoremIpsum } from 'lorem-ipsum'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import { ListItemText, ListItemIcon, ListItemAvatar, Avatar } from '@material-ui/core'
import FolderIcon from '@material-ui/icons/Folder'

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
})

const generated: { [key: number]: string } = {}

const lipsum = (index: number) => {
  if (!generated[index]) {
    generated[index] = lorem.generateSentences(3)
  }
  return generated[index]
}

const App = () => {
  return (
    <List component="div" style={{ height: '100%', width: '100%', boxSizing: 'border-box' }}>
      <Virtuoso
        totalCount={200}
        overscan={1200}
        item={(index: number) => {
          return (
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <FolderIcon />
                </Avatar>
              </ListItemAvatar>

              <ListItemText primary={`Item ${index}`} />
            </ListItem>
          )
        }}
      />
    </List>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
