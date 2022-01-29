---
id: auto-resizing
title: Auto Resizing Virtual List
sidebar_label: Auto Resizing
slug: /auto-resizing/
---

The Virtuoso component automatically handles any changes of the items' heights (due to content resizing, images loading, etc.)
You don't have to configure anything additional.

Launch the example below in a codesanbox and resize it around.

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'

export default function App() {
  return (
  <>
    <Virtuoso
      style={{ height: '100%' }}
      data={generateUsers(100)}
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
    <style>{`html, body, #root { height: 100% }`}</style>
  </>
  )
}

```
