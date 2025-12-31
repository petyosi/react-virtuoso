---
title: Scroll to Index
description: Programmatically scroll to any item in React Virtuoso using scrollToIndex with alignment and smooth scroll options.
sidebar:
  label: Scroll to Index
  order: 50
---

The Virtuoso component exposes an imperative `scrollToIndex` method, which scrolls the item at the specified index into view.
As an optional configuration, the method accepts `align: 'start' | 'center' | 'end'` and `behavior: 'smooth'`.

:::caution
Using smooth scrolling over many items can kill performance and potentially clash with loading strategies.
:::

```tsx live
import { Virtuoso } from 'react-virtuoso'
import { useState, useRef } from 'react'

export default function App() {
  const [align, setAlign] = useState('start')
  const [behavior, setBehavior] = useState('auto')
  const virtuoso = useRef(null)
  return (
    <div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'row', gap: 5, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <li>
          <button
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              virtuoso.current.scrollToIndex({
                index: 0,
                align,
                behavior,
              })
              return false
            }}
          >
            Go to 1
          </button>
        </li>
        <li>
          <button
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              virtuoso.current.scrollToIndex({
                index: 499,
                align,
                behavior,
              })
              return false
            }}
          >
            Go to 500
          </button>
        </li>
        <li>
          <button
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              virtuoso.current.scrollToIndex({
                index: 999,
                align,
                behavior,
              })
              return false
            }}
          >
            Go to 1000
          </button>
        </li>
        <li>
          <label>
            Align:
            <select value={align} onChange={(e) => setAlign(e.target.value)}>
              <option value="start">Start</option>
              <option value="center">Center</option>
              <option value="end">End</option>
            </select>
          </label>
        </li>
        <li>
          <label>
            Behavior:
            <select value={behavior} onChange={(e) => setBehavior(e.target.value)}>
              <option value="auto">Instant (auto)</option>
              <option value="smooth">Smooth</option>
            </select>
          </label>
        </li>
      </ul>

      <div style={{ height: 300 }}>
        <Virtuoso totalCount={1000} ref={virtuoso} itemContent={(index) => <div style={{ height: 30 }}>Item {index + 1}</div>} />
      </div>
    </div>
  )
}
```
