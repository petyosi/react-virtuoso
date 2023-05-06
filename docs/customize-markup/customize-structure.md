---
id: customize-structure
title: Customize Rendering
sidebar_label: Customize Rendering
slug: /customize-structure/
---

The React Virtuoso component renders as several nested `DIV` elements. The default values in the `component` prop entries are `"div"`.

```txt
components.Scroller (div)
  |-viewport (div)
    |-header(div* headerFooterTag)
      |-components.Header
    |-components.List (div)
      |-components.Group (div+)
        |-groupItemContent
      |-components.Item (div+)
        |-itemContent
      |-components.EmptyPlaceholder
    |-footer(div*, headerFooterTag)
      |-components.Footer
    |-components.List (Top Items) (div)
      |-components.Item (div+)
        |-itemContent
      |-components.Group (div+)
        |-groupItemContent

```

Pass a custom component to the specified key in `components` to change rendering. 
Notice that the `List` component must accept and pass its `ref` to the actual DOM element.
The example below adds borders to each customizable element.


:::note
If you pass the components inline and combine that with `useState`, each re-render will pass a fresh instance component, causing unnecessary unmounting and remounting. 
Don't do
```tsx
<Virtuoso components={{ Header:() => <div></div> }} />
```
Move the components outside. If you need to capture a certain state in them, use the `context` prop.
:::

```jsx live import=@emotion/styled
import styled from '@emotion/styled'
import React from 'react'
import { Virtuoso } from 'react-virtuoso'

const Item = styled.div`
  border: 2px solid red;
`
const ListEl = styled.div`
  border: 1px solid blue;
`
const Header = () => 'Header'
const Footer = () => 'Footer'

const List = React.forwardRef((props, ref) => {
  return <ListEl {...props} ref={ref} />
})

export default function App() {
  return (
    <Virtuoso style={{ height: 400 }} components={{ Item, List, Header, Footer }} totalCount={30} itemContent={(idx) => `Item ${idx}`} />
  )
}
```

## TypeScript Interfaces

The types for each component are available in the `Components` interface. The example below annotates the `Scroller` custom component:

```tsx
import { Components } from 'react-virtuoso'

const Scroller: Components['Scroller'] = React.forwardRef(({ style, children }, ref) => {
  return (
    <div style={style} ref={ref}>
      {children}
    </div>
  )
})
```
