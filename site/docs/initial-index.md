---
id: initial-index
title: Start from a certain item
sidebar_label: Initial Index
slug: /initial-index/
---

The `initialTopMostItemIndex` property changes the initial location of the list to display the item at the specified index. You can pass in an object to achieve additional effects similar to [scrollToIndex](/scroll-to-index/).

Note: The property applies to the list only when the component mounts. 
If you want to change the position of the list afterward, use the [scrollToIndex](/scroll-to-index/) method.

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers, avatar, avatarPlaceholder } from './data'
import { useState, useMemo, useRef } from 'react'

export default function App() {
  return (
    <Virtuoso
      style={{ height: 400 }}
      data={generateUsers(1000)}
      initialTopMostItemIndex={800}
      itemContent={(index, user) => (
        <div
          style={{
            backgroundColor: user.bgColor,
            padding: '1rem 0.5rem',
          }}
        >
          <h4>
            {user.index}. {user.name}
          </h4>
          <div style={{ marginTop: '1rem' }}>{user.description}</div>
        </div>
      )}
    />
  )
}
```
