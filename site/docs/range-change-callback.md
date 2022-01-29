---
id: range-change-callback
title: Range Change Callback
sidebar_label: Range Change Callback
slug: /range-change-callback/
---

The `rangeChanged` callback property gets called with the start/end indexes of the visible range.

Note: the `rangeChanged` reports the rendered items, which are affected by the `overscan` property - not the ones visible in the viewport.
If you must track only the visible items, you can try the workaround from [this Github issue](https://github.com/petyosi/react-virtuoso/issues/118#issuecomment-642156138).

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'
import { useState, useMemo, useRef } from 'react'

export default function App() {
  const [visibleRange, setVisibleRange] = useState({
    startIndex: 0,
    endIndex: 0,
  })
  const users = useMemo(() => generateUsers(100), [])
  return (
    <div style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
      <p>
        current visible range: {visibleRange.startIndex} - {visibleRange.endIndex}{' '}
      </p>
      <Virtuoso
        data={users}
        rangeChanged={setVisibleRange}
        style={{ flex: 1 }}
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
    </div>
  )
}
```
