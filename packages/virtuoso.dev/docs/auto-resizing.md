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
  data={generateRandomItems(100)}
  itemContent={(index, item) => (
    <div
      style={{
        padding: "1rem 0",
      }}
    >
      <h4>{item.text}</h4>

      {item.longText}
    </div>
  )}
/>
```
