---
id: horizontal-mode
title: Horizontal Mode
sidebar_title: Horizontal Mode
slug: /horizontal-mode/
sidebar_position: 90
---


Setting the `horizontalDirection` property to `true` will render the Virtuoso component horizontally. The items are positioned using `display: inline-block`.


## Horizontal mode list

```tsx live
import { Virtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

export default function App() {
  const users = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => ({
      name: `User ${index}`,
      size: Math.floor(Math.random() * 40) + 100,
      description: `Description for user ${index}`,
    }));
  }, []);

  return (
    <Virtuoso
      style={{ height: 320 }}
      data={users}
      horizontalDirection
      itemContent={(_, user) => (
        <div
          style={{
            padding: "1rem",
            height: `100%`,
            borderRight: "1px solid var(--border)",
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', height: '100%' }}>
          <p style={{marginBottom: '1rem'}}>
            <strong>{user.name}</strong>
          </p>
          <div>{user.description}</div>
          </div>
        </div>
      )}
    />
  );
}
```
