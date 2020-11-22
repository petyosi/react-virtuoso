---
id: initial-index
title: Start from a certain item
sidebar_label: Initial Index
slug: /initial-index/
---

The `initialTopMostItemIndex` property changes the initial location of the list to display the item at the specified index.

Note: The property applies to the list only on mount. If you want to change the position of the list afterwards, use the [scrollToIndex](/scroll-to-index/) method.

```jsx live
<Virtuoso
  data={generateRandomItems(1000)}
  initialTopMostItemIndex={800}
  itemContent={(index, item) => (
    <div style={{ 
      height: item.height, 
      borderBottom: "1px solid #ccc" 
    }}>
      {item.text}
    </div>
  )}
/>
```
