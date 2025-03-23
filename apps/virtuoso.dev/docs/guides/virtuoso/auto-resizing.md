---
id: auto-resizing
title: Auto Resizing Virtual List
sidebar_label: Auto Resizing
slug: /auto-resizing/
sidebar_position: 2
---

The Virtuoso component automatically handles any changes of the items' heights (due to content resizing, images loading, etc.)
You don't have to configure anything additional.

The list below is wrapped in a resizeable container. Try resizing the container to see how the list reacts.

```tsx live 
import { Virtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

export default function App() {
  const users = useMemo(() => {
    return Array.from({ length: 100000 }, (_, index) => ({
      name: `User ${index}`,
      description: `Description for user ${index}`
    }))
  }, [])

  return (
  <div style={{ height: '100%', overflow: 'hidden', boxSizing: 'border-box', resize: 'both', padding: '1em', border: '1px solid #ccc' }}>
    <Virtuoso
      style={{ height: '100%' }}
      data={users}
      itemContent={(index, user) => (
        <div
          style={{
            padding: '1rem 0.5rem',
              borderBottom: `1px solid var(--border)`
          }}
        >
          <h4>{user.name}</h4>
          <div style={{ marginTop: '1rem' }}>{user.description}</div>
        </div>
      )}
    />
  </div>
  )
}

```
