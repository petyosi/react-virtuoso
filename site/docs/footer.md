---
id: footer
title: List with Footer Example
sidebar_label: Footer
slug: /footer/
---

Customize the Virtuoso component rendering by passing components through the `components` property.

For example, the `Footer` component will render at the bottom of the list.
The footer can be used for loading indicators or "load more" buttons.

Scroll to the bottom of the list to see `end reached`.

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'

export default function App() {
  return (
    <Virtuoso
      style={{ height: 400 }}
      data={generateUsers(100)}
      components={{
        Footer: () => {
          return (
            <div
              style={{
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              end reached
            </div>
          )
        },
      }}
      itemContent={(index, user) => (
        <div
          style={{
            backgroundColor: user.bgColor,
            padding: '1rem 0.5rem',
          }}
        >
          <h4>{user.name}</h4>
        </div>
      )}
    />
  )
}
```
