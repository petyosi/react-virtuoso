---
id: custom-scroll-container
title: Customize Root Element
sidebar_label: Customize Root Element
slug: /custom-scroll-container/
---

The React Virtuoso component accepts the standard set of HTML attributes and passes them to the root scrollable DOM div. 
This can be used to customize the styling and also to bind to DOM events like `onScroll`.

If you want to customize the wrapper further, you can pass your own component as `components.ScrollContainer`.

## List with `data`

```jsx live
  <Virtuoso
    onScroll={e => console.log(e.target.scrollTop)}
    totalCount={1000}
    components={{
      Header:() => <div>Header</div>
    }}
    overscan={200}
    itemContent={(idx) => `Item ${idx}`}
    style={{
      border: '5px dashed gray',
      borderRadius: '4px',
    }}
  />
```
