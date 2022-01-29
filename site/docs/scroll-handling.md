---
id: scroll-handling
title: Scroll Handling
sidebar_label: Scroll Handling
slug: /scroll-handling/
---

Loading and rendering complex content while scrolling affects the scrolling performance.

To let the integrator address that issue, the `Virtuoso` component exposes a `scrollingStateChange` event property which gets called when the user starts/stops scrolling.
The callback receives true when the user starts scrolling and false shortly after the last scroll event.

Handling this event can improve performance by hiding/replacing certain heavy elements in the items.


```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers, avatar, avatarPlaceholder } from './data'
import { useState, useMemo } from 'react'

export default function App() {
  const [isScrolling, setIsScrolling] = useState(false);
  const users = useMemo(() => generateUsers(100), [])
  return (
    <Virtuoso
      style={{ height: 400 }}
      data={users}
      isScrolling={setIsScrolling}
      itemContent={(index, user) => {
        return (
          <div
            style={{
              backgroundColor: user.bgColor,
              padding: '1rem 0'
            }}
          >
            
            <div style={{ float: 'left', margin: '1rem' }}>
              {isScrolling ? avatarPlaceholder() : avatar() }
            </div>

            <h4>{user.name}</h4>
            <div style={{ marginTop: '1rem' }}>
            {user.longText}
            </div>
          </div>
        )
      }}
    />
  )
}
```
