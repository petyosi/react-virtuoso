---
id: stick-to-bottom
title: Stick to Bottom
sidebar_label: Stick to Bottom
slug: /stick-to-bottom/
---

This example "follows" the live updates of a list by auto-scrolling to the last item when `totalCount` is increased.
The `atBottomStateChange` callback is used to suspend / resume the updates.

The `followOutput` property accepts `true` or `"smooth"`. The smooth mode looks better visually but might not keep up with very fast updates.

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { user, generateUsers, toggleBg } from './data'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

export default function App() {
  const [users, setUsers] = useState(() => generateUsers(100))
  const appendInterval = useRef(null)
  const virtuosoRef = useRef(null)
  const [atBottom, setAtBottom] = useState(false)
  const showButtonTimeoutRef = useRef(null)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    return () => {
      clearInterval(appendInterval.current)
      clearTimeout(showButtonTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    clearTimeout(showButtonTimeoutRef.current)
    if (!atBottom) {
      showButtonTimeoutRef.current = setTimeout(() => setShowButton(true), 500)
    } else {
      setShowButton(false)
    }
  }, [atBottom, setShowButton])

  return (
    <>
      <Virtuoso
        style={{ height: 400 }}
        ref={virtuosoRef}
        initialTopMostItemIndex={999}
        data={users}
        atBottomStateChange={(bottom) => {
          clearInterval(appendInterval.current)
          if (bottom) {
            appendInterval.current = setInterval(() => {
              setUsers((users) => [...users, user(), user(), user(), user(), user()])
            }, 400)
          }
          setAtBottom(bottom)
        }}
        itemContent={(index, user) => {
          return (
            <div style={{ backgroundColor: toggleBg(index), padding: '1rem 0.5rem' }}>
              <h4>{user.name}</h4>
              <div style={{ marginTop: '1rem' }}>{user.description}</div>
            </div>
          )
        }}
        followOutput={'smooth'}
      />
      {showButton && (
        <button
          onClick={() => virtuosoRef.current.scrollToIndex({ index: users.length - 1, behavior: 'smooth' })}
          style={{ float: 'right', transform: 'translate(-1rem, -2rem)' }}
        >
          Bottom
        </button>
      )}
    </>
  )
}
```
