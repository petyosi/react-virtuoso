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

To change what's rendered, pass your component to the specified key in `components`. Notice that the `List` component needs to accept and pass its `ref` to the actual DOM element.
The example below adds borders to each customizable element.

```jsx live
() => {
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

  return <Virtuoso components={{ Item, List, Header, Footer }} totalCount={30} itemContent={idx => `Item ${idx}`} />
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
