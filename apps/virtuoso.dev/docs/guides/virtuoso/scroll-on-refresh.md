---
id: scroll-on-refresh
title: Scroll on Refresh
sidebar_label: Scroll on Refresh
slug: /scroll-on-refresh/
sidebar_position: 121
---

## Scrolling an item into view when the data changes

When data in a list changes (E.g. filters being applied or new data being inserted) important information may be pushed off the screen(like a selected item).
Setting the `targetsNextRefresh` option set to `true` allows you to call `scrollIntoView` _before_ the next update to `data`/`totalCount` after which the list will be rendered with the new data and the target `index` already scrolled into view.

:::caution
Remember when setting `targetsNextRefresh` to `true`, the `index` is relative to the new `data`/`totalCount` subsequently set.
:::

```tsx live
import * as React from 'react'
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [currentItemIndex, setCurrentItemIndex] = React.useState(-1)
  const [count, setCount] = React.useState(100)
  const increment = 50
  const bottomOffset = 10

  return (
    <div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'row', gap: 5, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <li>
          <button
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              const newCount = count + increment
              const nextIndex = newCount - bottomOffset
              ref.current?.scrollIntoView({
                align: `start`,
                index: nextIndex,
                behavior: 'auto',
                done: () => {
                  setCurrentItemIndex(nextIndex)
                },
                targetsNextRefresh: true,
              })
              setCount(newCount)
              return false
            }}
          >
            Add {increment} and go to {count + (increment - bottomOffset) + 1}
          </button>
        </li>
      </ul>
      <Virtuoso
        ref={ref}
        totalCount={count}
        context={{ currentItemIndex }}
        itemContent={(index, _, { currentItemIndex }) => (
          <div
            style={{
              borderColor: index === currentItemIndex ? 'var(--border)' : 'transparent',
              borderSize: '1px',
              borderStyle: 'solid',
              padding: '0.5rem 0.2rem',
            }}
          >
            <div style={{ marginTop: '1rem' }}>Item {index + 1}</div>
          </div>
        )}
        style={{ height: '100%' }}
      />
    </div>
  )
}
```
