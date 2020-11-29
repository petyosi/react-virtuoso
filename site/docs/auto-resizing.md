---
id: auto-resizing
title: Auto Resizing Virtual List
sidebar_label: Auto Resizing
slug: /auto-resizing/
---

The Virtuoso component automatically handles changes of the items' heights (due to content being resized, images being loaded, etc). 
You don't have to configure anything additional.

Resize your browser and scroll the list around the items reposition correctly without overlap.

```jsx live
<Virtuoso
  data={generateUsers(100)}
  itemContent={(index, user) => (
    <div
      style={{
        backgroundColor: user.bgColor,
        padding: '1rem 0.5rem',
      }}
    >
      <h4>{user.name}</h4>
      <div style={{ marginTop: '1rem' }}>
        {user.description}
      </div>
    </div>
  )}
/>
```
