---
id: custom-scroll-container
title: Customize Root Element
sidebar_label: Customize Scroller
slug: /custom-scroll-container/
---

The React Virtuoso component accepts the standard set of HTML attributes and passes them to the root scrollable DOM div.
You can use this to customize the styling and to bind to DOM events like `onScroll`. If you want to customize the wrapper further, you can pass a custom component as `components.Scroller`.

## List with custom styling

```jsx live
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <Virtuoso
      onScroll={(e) => console.log(e.target.scrollTop)}
      totalCount={1000}
      itemContent={(idx) => `Item ${idx}`}
      style={{
        border: '5px dashed gray',
        borderRadius: '4px',
        height: 400
      }}
    />
  )
}
```

The example above changes the scroller element with a custom component. This approach is useful for integrating the component with a custom scroller library.

## List with custom scroller

```jsx live
import { Virtuoso } from 'react-virtuoso'
import React from 'react'

// do not inline the component, as a fresh instance would be created with each re-render
// if you need to do some conditional logic, use Virtuoso's context prop to pass props inside the Scroller
const Scroller = React.forwardRef(({ style, ...props }, ref) => {
  // an alternative option to assign the ref is
  // <div ref={(r) => ref.current = r}>
  return <div style={{ ...style, border: '5px solid gray' }} ref={ref} {...props} />
})

export default function App() {
  return (
    <Virtuoso
      style={{ height: 400 }}
      onScroll={(e) => console.log(e.target.scrollTop)}
      totalCount={1000}
      itemContent={(idx) => `Item ${idx}`}
      components={{ Scroller }}
    />
  )
}
```
