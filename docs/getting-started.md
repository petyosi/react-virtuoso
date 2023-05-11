---
id: getting-started
title: Getting Started with React Virtuoso
sidebar_label: Getting Started 
sidebar_position: 1
slug: /
---

**React Virtuoso** is a family of powerful, easy-to-use React components that display large data sets using **virtualized rendering**. Unlike other virtualization solutions, the Virtuoso components automatically handle items with variable sizes and changes in items' sizes. The package includes a flat list (`Virtuoso` ), a grouped list with sticky headers (`GroupedVirtuoso`),  a grid with a responsive layout (`VirtuosoGrid`), and a table (`TableVirtuoso`). The package is tree-shakeable, so your bundle should not be inflated by the components you don't refer to.

## Feature Overview&#x20;

The Virtuoso components support the automatic handling of **items with variable heights**. There's no need for you to hard-code or manually measure item sizes. In addition to automatic handling of the item sizes, the components monitor any changes in the item's sizes (for example, due to content load) and re-adjust the scroll area size. The component container size itself is also monitored, so that the list reacts to browser resizing or sibling elements changing the layout.&#x20;

A common use case that's thoroughly covered by the components' API is the **bi-directional endless scrolling** or the **press to load** UI patterns. The components can be configured to **start from an initial location**, thus skipping the initial rendering (and the potential need of data loading) of the topmost list items. The components expose `startReached` and `endReached`  callback properties, suitable for loading data on demand. After the data has been loaded, You can **append** or **prepend** additional items, while retaining the current scroll location.&#x20;

The list components can **autoscroll to bottom** when new items are appended, making it easy to build interfaces like **chats** or **live log output**.&#x20;

The markup of the components is customizable by passing custom components as props, supporting optional **Header** and **Footer**, or even swapping the **scroller element with a custom one** (usually done for the sake of integrating a third party scrollbar library). The customization API makes it easy to combine the components with your UI library of choice (e.g. Material UI), style the items with css-in-js, or even integrate drag-and-drop through a third party library.&#x20;

To get a better impression of what's possible, examine the examples in the scenarios section of the documentation, and skim through the API reference.&#x20;

## Installation

React virtuoso is distributed as an NPM package, with `react` and `react-dom` being the only peer dependencies. Install `react-virtuoso` in your React project. The package exports the `Virtuoso`,  `TableVirtuoso`, `GroupedVirtuoso`, and `VirtuosoGrid` components.

```bash
npm install react-virtuoso
```

Add the Component to your application.

```jsx
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from 'react-virtuoso'

const App = () => (
  <Virtuoso
    style={{ height: '400px' }}
    totalCount={200}
    itemContent={index => <div>Item {index}</div>}
  />
)

ReactDOM.render(<App />, document.getElementById('root'))
```

Here's how it looks (live editor):

```jsx live
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  return <Virtuoso
    style={{ height: "400px", }}
    totalCount={200}
    itemContent={(index) => <div>Item {index}</div>}
  />
}
```

### Grouping

The `GroupedVirtuoso` component is similar to the "flat" `Virtuoso`, with the following differences:

* Instead of `totalCount`, the Component accepts `groupedCounts: number[]`, which specifies the amount of items in each group.
  For example, passing `[20, 30]` will render two groups with 20 and 30 items each;
* In addition the `item` render prop, the Component requires an additional `group` render prop,
  which renders the **group header**. The `group` callback receives the zero-based group index as a parameter;
* The `itemContent` render prop gets called with an additional second parameter, `groupIndex: number`.

```jsx live
import { GroupedVirtuoso } from 'react-virtuoso'

  const groupCounts = []
  for (let index = 0; index < 1000; index++) {
    groupCounts.push(10)
  }

export default function App() {

  return (
    <GroupedVirtuoso
    style={{ height: "400px" }}
      groupCounts={groupCounts}
      groupContent={index => {
        return (
          <div style={{ backgroundColor: 'white' }}>
            Group {index * 10} &ndash; {index * 10 + 10}
          </div>
        )
      }}
      itemContent={(index, groupIndex) => {
        return (
              <div>Item {groupIndex}.{index}</div>
        )
      }}
    />
  )
}
```

Check the
[grouped numbers](/grouped-numbers),
[grouped by first letter](/grouped-by-first-letter) and
[groups with load on demand](/grouped-with-load-on-demand)
examples.

### Table

The `TableVirtuoso` component works like the `Virtuoso` one, but with HTML tables. It supports window scrolling, sticky headers, and fixed columns.

Check the [Basic Table](/hello-table) example for a sample implementation.

### Grid

The `VirtuosoGrid` component displays **same sized items** in multiple columns.
The layout and item sizing is controlled CSS class properties or styled containers,
which allows you to use media queries, min-width, percentage, etc.

Check the [responsive grid columns](/grid-responsive-columns) example for a sample implementation.

### Footer

The Component accepts an optional
`footer` [render property](https://reactjs.org/docs/render-props.html),
which is rendered after all items.
The footer can be used to host a "load more" button
or an indicator that the user has reached the end of the list.

Check the [footer](/footer), [press load more](/press-to-load-more) and [endless scrolling](/endless-scrolling) examples for practical applications of the footer.

### Pinned Items

The `Virtuoso` component accepts an optional `topItems` property that specifies
how many items must remain "pinned" at the top of the list.
Check the [top items](/top-items) example.

### Scroll to Index

The Virtuoso components provide an imperative `scrollToIndex` method with an optional `align` that scrolls the specified item into view.
`GroupedVirtuoso` exports convenience callback to obtain the group item indices to scroll to a given group.

Check the
[scroll to index](/scroll-to-index) and
[scroll to group](/scroll-to-group)
examples for possible usage of the method.

### Customize the Scroll Container

You can swap the Virtuoso scroller implementation to add custom scroll logic or to integrate a custom scrolling library (like [React scrollbars](https://github.com/malte-wessel/react-custom-scrollbars)).

Check the [custom scroll container](/custom-scroll-container) example for a starting point.

## Performance

Several factors affect the component's performance.
The first and most important one is the *size of the visible area*.
Redrawing more items takes more time and reduces the frame rate.
To see if this affects you, reduce the component width or height;
Set the `style` property to something like `{{width: '200px'}}`.

Next, if the items are complex or slow to render, use [React.memo](https://reactjs.org/docs/react-api.html#reactmemo) for the `itemContent` contents.

```jsx
// Item contents are cached properly with React.memo
const InnerItem = React.memo(({ index }) => {
  React.useEffect(() => {
    console.log('inner mounting', index)
    return () => {
      console.log('inner unmounting', index)
    }
  }, [index])
  return <div style={{ height: 30 }}>Item {index}</div>
})

// The callback is executed often - don't inline complex components in here.
const itemContent = (index) => {
  console.log('providing content', index)
  return <InnerItem index={index} />
}

const App = () => {
  return <Virtuoso totalCount={100} itemContent={itemContent} style={{ height: 300 }} />
}

ReactDOM.render(<App />, document.getElementById('root'))
```

You can experiment with the `overscan` property that specifies
how much more to render in addition to the viewport's visible height.
For example, if the component is `100px` tall, setting the `overscan`
to `150` will cause the list to render **at least** `250px` of content.

In a nutshell, increasing the `overscan` causes less frequent re-renders,
but makes each re-render more expensive (because more items will get replaced).

Loading images and displaying complex components while scrolling can cause jank.
To fix that, you can hook to the `isScrolling` callback and replace
the problematic content in the item with a simplified one.
Check the [scroll handling example](/scroll-handling) for a possible implementation.

## Gotchas

Setting **CSS margins** to the content or the item elements is the Kryptonite of Virtuoso's content measuring mechanism - the [`contentRect` measurement](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) does not include them.

If this affects you, the total scroll height will be miscalculated, and the user won't be able to scroll all the way down to the list.

To avoid that, if you are putting paragraphs and headings inside the `item`, make sure that the top/bottom elements' margins do not protrude outside of the item container.

```jsx
<Virtuoso
  totalCount={100}
  item={index => (
    <div>
      <p style={{ margin: 0 }}>Item {index}</p>
    </div>
  )}
/>
```

A few more common problems are present in the [troubleshooting section](/troubleshooting).

## Browser Support

Virtuoso uses `position: sticky` to keep the virtual viewport at the top of the scroller when in grouped mode. [This does not work in IE 11](https://caniuse.com/#feat=css-sticky).
