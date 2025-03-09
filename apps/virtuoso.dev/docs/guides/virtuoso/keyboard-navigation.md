---
id: keyboard-navigation
title: Keyboard Navigation
sidebar_label: Keyboard Navigation
slug: /keyboard-navigation/
sidebar_position: 121
---

The Virtuoso component exposes an imperative `scrollIntoView` method, which makes it easy to implement keyboard navigation.
As an optional configuration, the method accepts `behavior: 'smooth' | 'auto'`, and a `done` callback which gets called after the scrolling is done.
See the example below for its usage.

To test the example below, click anywhere in the list and press up / down arrows. 

```tsx live 
import * as React from 'react'
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  const ref = React.useRef(null)
  const [currentItemIndex, setCurrentItemIndex] = React.useState(-1)
  const listRef = React.useRef(null)

  const keyDownCallback = React.useCallback(
    (e) => {
      let nextIndex = null

      if (e.code === 'ArrowUp') {
        nextIndex = Math.max(0, currentItemIndex - 1)
      } else if (e.code === 'ArrowDown') {
        nextIndex = Math.min(99, currentItemIndex + 1)
      }

      if (nextIndex !== null) {
        ref.current.scrollIntoView({
          index: nextIndex,
          behavior: 'auto',
          done: () => {
            setCurrentItemIndex(nextIndex)
          },
        })
        e.preventDefault()
      }
    },
    [currentItemIndex, ref, setCurrentItemIndex]
  )

  const scrollerRef = React.useCallback(
    (element) => {
      if (element) {
        element.addEventListener('keydown', keyDownCallback)
        listRef.current = element
      } else {
        listRef.current.removeEventListener('keydown', keyDownCallback)
      }
    },
    [keyDownCallback]
  )

  return (
    <Virtuoso
      ref={ref}
      totalCount={100}
      context={{ currentItemIndex }}
      itemContent={(index, _, { currentItemIndex }) => (
        <div
          style={{
            borderColor: index === currentItemIndex ? 'blue' : 'transparent',
            borderSize: '1px',
            borderStyle: 'solid',
            padding: '0.5rem 0.2rem',
          }}
        >
          <div style={{ marginTop: '1rem' }}>Item {index + 1}</div>
        </div>
      )}
      scrollerRef={scrollerRef}
      style={{ height: '100%' }}
    />
  )
}
```
