---
id: footer
title: List with Footer Example
sidebar_label: Footer
slug: /footer/
sidebar_position: 5
---

Customize the Virtuoso component rendering by passing components through the `components` property.

For example, the `Footer` component will render at the bottom of the list.
The footer can be used for loading indicators or "load more" buttons.

Scroll to the bottom of the list to see `end reached`.

:::note
If you pass the components inline and combine that with `useState`, each re-render will pass a fresh instance component, causing unnecessary unmounting and remounting. 
Don't do

```tsx
<Virtuoso components={{ Footer: () => <div></div> }} />
```

Instead, move the components to the module level. If you need to control the components state, pass the necessary variables through Virtuoso's `context` prop.
:::

```tsx live noInline
function Footer() {
  return (<div style={{ padding: '1rem', textAlign: 'center', }} > end reached </div>)
}

function App() {
  return (
    <Virtuoso
      style={{ height: 400 }}
      totalCount={100}
      components={{ Footer: Footer }}
      itemContent={(index) => ( <div>Item {index}</div>)}
    />
  )
}

render(<App />)
```
