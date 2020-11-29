---
id: top-items
title: Top Items List Example
sidebar_label: Top Items
slug: /top-items/
---

The Virtuoso component accepts an optional `topItemCount` number property that allows you to pin the first several items of the list.

Scroll the list below - the first two items remain fixed and always visible. 
`backgroundColor` is set to hide the scrollable items behind the top ones.

```jsx live
<Virtuoso
  data={generateUsers(1000)}
  topItemCount={2}
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
```
