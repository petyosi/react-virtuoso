---
title: Scroll Handling
sidebar:
  label: Scroll Handling
  order: 302
---

Loading and rendering complex content while scrolling affects the scrolling performance.

To address that, the `Virtuoso` component exposes a `isScrolling` event property which gets called when the user starts/stops scrolling.
The callback receives `true` when the user starts scrolling and `false` shortly after the last scroll event.

Handling this event can improve performance by hiding/replacing certain heavy elements in the items.


```tsx live
import { Virtuoso } from 'react-virtuoso'
import { useState, FC } from 'react'

export default function App() {
  const [isScrolling, setIsScrolling] = useState(false);
  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={1000}
      context={{ isScrolling }}
      isScrolling={setIsScrolling}
      itemContent={(index, user, { isScrolling }) => {
        return (
          <div style={{ padding: '1rem 0', alignItems: 'center', display: 'flex', flexDirection: 'row' }} >
            <div style={{ margin: '1rem' }}>
              {isScrolling ? <AvatarPlaceholder /> : <Avatar /> }
            </div>

            <div>
              Item {index}
            </div>
          </div>
        )
      }}
    />
  )
}

const Avatar: FC = () => {
  return (
    <div style={{
        backgroundColor: 'blue',
        borderRadius: '50%',
        width: 50,
        height: 50,
        paddingTop: 13,
        paddingLeft: 14,
        color: 'white',
        boxSizing: 'border-box'
      }}>AB</div>
  )
}

const AvatarPlaceholder: FC = () => {
return (<div style={{
        backgroundColor: '#eef2f4',
        borderRadius: '50%',
        width: 50,
        height: 50,
    }}>{' '}</div>)
}



```
