---
id: window-scrolling
title: Window Scrolling
sidebar_label: Window Scrolling
slug: /window-scrolling/
---

The Virtuoso and the VirtuosoGrid components can use the document scroller.
This feature is a recent addition and may not work as expected in specific scenarios.
If you encounter such case, please open an issue with a reproduction of it.

## List attached to window scroller

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'

export default function App() {
  return (
    <Virtuoso
      useWindowScroll
      data={generateUsers(200)}
      itemContent={(index, user) => (
        <div
          style={{
            backgroundColor: user.bgColor,
            padding: '1rem 0.5rem',
          }}
        >
          <h4>{user.name}</h4>
          <div style={{ marginTop: '1rem' }}>{user.description}</div>
        </div>
      )}
    />
  )
}
```
