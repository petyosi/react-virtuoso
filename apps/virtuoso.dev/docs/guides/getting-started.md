---
id: getting-started
title: Getting Started with React Virtuoso
sidebar_label: Getting Started
sidebar_position: 1
slug: /
---

**React Virtuoso** is a family of React components that display large data sets using **virtualized rendering**, automatically handling variable item sizes and changes in items' sizes.

| Component         | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `Virtuoso`        | Flat lists                                   |
| `GroupedVirtuoso` | Groups of items with sticky group headers    |
| `VirtuosoGrid`    | Same-sized items in a responsive grid layout |
| `TableVirtuoso`   | Tables with virtualized rows                 |
| `MessageList`     | Human/AI chat interfaces                     |
| `Masonry`         | Photos/Product listings                      |

:::info

<h2 className="newLabel">Virtuoso Message List</h2>

The `VirtuosoMessageList` component is a newly released React component built **specifically for human and AI chatbot conversations**. [Check out the live example](/virtuoso-message-list/).
:::

## License

The `react-virtuoso` package is distributed under the MIT license. The `VirtuosoMessageList` component and the contents of the `@virtuoso.dev/message-list` package are distributed under a commercial license. See [pricing](/pricing) for more details.

## Feature Highlights

The Virtuoso components automatically handle **items with variable heights**. You don't have to hard-code or manually measure item sizes. The components observe changes of the items' sizes (for example, due to content load) and automatically readjust the scroll area size. The component container size itself is observed and list readjusts its display automatically when the browser or its parent container changes sizes. You can safely use the Virtuoso components in responsive flexbox layouts.

A common use case covered by the components' API is the **bi-directional endless scrolling** and the **press to load more** UI patterns. The components can be configured to **start from an initial location**, thus skipping the initial rendering (and the potential need of data loading) of earlier items. The components expose `startReached` and `endReached` callback properties, suitable for loading data on demand. After the data has been loaded, You can **append** or **prepend** additional items, while retaining the current scroll location.

The markup of the components is customizable by passing custom components as props, supporting optional **Header** and **Footer**, or even replacing the **Scroller element with a custom one** (usually when integrating third party scrollbar library).
The custom components props allow the easy integration of your UI library of choice (e.g. shadcn/ui, MUI, Mantine), or even integrate drag-and-drop through a third-party library.

To get a better impression of what's possible, examine the various examples in the documentation, and skim through the API reference.

## Installation (react-virtuoso)

The Virtuoso components are distributed as NPM packages.

To use the `Virtuoso`, `TableVirtuoso`, `GroupedVirtuoso`, and `VirtuosoGrid` components, install `react-virtuoso` in your React project.

```bash
npm install react-virtuoso
```

Install the `@virtuoso.dev/message-list` package to use the `VirtuosoMessageList` component.

```bash
npm install @virtuoso.dev/message-list
```

## Hello World

### Virtuoso

Add the `Virtuoso` Component to your React project. The bare minimum it needs is a height for its container (either explicitly set, or adjusted through a parent flexbox), the number of items to display, and a callback to render the item content.

```tsx live
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  return <Virtuoso style={{ height: '100%' }} totalCount={200} itemContent={(index) => <div>Item {index}</div>} />
}
```

### VirtuosoMessageList

The Message List component is specifically built for human and/or AI chatbot conversations. Follow the instructions in the [Virtuoso Message List](/virtuoso-message-list) guide to install and use the `VirtuosoMessageList` component.

```tsx live
import { VirtuosoMessageListLicense, VirtuosoMessageList } from '@virtuoso.dev/message-list'
import { useMemo } from 'react'

export default function App() {
  const data = useMemo(() => Array.from({ length: 100 }, (_, index) => index), [])
  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList
        ItemContent={({ data }) => <div>Message {data}</div>}
        style={{ height: '100%' }}
        data={{
          data: data,
          scrollModifier: {
            type: 'item-location',
            location: {
              index: 'LAST',
              align: 'end',
            },
          },
        }}
      />
    </VirtuosoMessageListLicense>
  )
}
```

### GroupedVirtuoso

The `GroupedVirtuoso` component is similar to the "flat" `Virtuoso`, with the following differences:

- Instead of `totalCount`, the Component accepts `groupedCounts: number[]`, which specifies the amount of items in each group.
  For example, passing `[20, 30]` will render two groups with 20 and 30 items each;
- In addition the `item` render prop, the Component requires an additional `group` render prop,
  which renders the **group header**. The `group` callback receives the zero-based group index as a parameter;
- The `itemContent` render prop gets called with an additional second parameter, `groupIndex: number`.

```tsx live
import { GroupedVirtuoso } from 'react-virtuoso'

const groupCounts = []

for (let index = 0; index < 1000; index++) {
  groupCounts.push(10)
}

export default function App() {
  return (
    <GroupedVirtuoso
      style={{ height: '100%' }}
      groupCounts={groupCounts}
      groupContent={(index) => {
        return (
          // add background to the element to avoid seeing the items below it
          <div>
            Group {index * 10} &ndash; {index * 10 + 10}
          </div>
        )
      }}
      itemContent={(index, groupIndex) => {
        return (
          <div>
            Item {groupIndex}.{index}
          </div>
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

### TableVirtuoso

The `TableVirtuoso` component works like the `Virtuoso` one, but with HTML tables. It supports window scrolling, sticky headers, and fixed columns.

```tsx live
import { TableVirtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <TableVirtuoso
      style={{ height: '100%' }}
      data={Array.from({ length: 100 }, (_, index) => ({
        name: `User ${index}`,
        description: `${index} description`,
      }))}
      itemContent={(index, user) => (
        <>
          <td style={{ width: 150 }}>{user.name}</td>
          <td>{user.description}</td>
        </>
      )}
    />
  )
}
```

### VirtuosoGrid

The `VirtuosoGrid` component displays **same sized items** in multiple columns.
The layout and item sizing is controlled CSS class properties or styled containers,
which allows you to use media queries, min-width, percentage, etc.

```tsx live
import { VirtuosoGrid, VirtuosoGridProps } from 'react-virtuoso'
import { forwardRef } from 'react'

// Ensure that the component definitions are not declared inline in the component function,
// Otherwise the grid will remount with each render due to new component instances.
const gridComponents: VirtuosoGridProps<undefined, undefined>['components'] = {
  List: forwardRef(({ style, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {children}
    </div>
  )),
  Item: ({ children, ...props }) => (
    <div
      {...props}
      style={{
        padding: '0.5rem',
        width: '33%',
        display: 'flex',
        flex: 'none',
        alignContent: 'stretch',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  ),
}

const ItemWrapper = ({ children, ...props }) => (
  <div
    {...props}
    style={{
      display: 'flex',
      flex: 1,
      textAlign: 'center',
      padding: '1rem 1rem',
      border: '1px solid gray',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
)

export default function App() {
  return (
    <>
      <VirtuosoGrid
        style={{ height: '100%' }}
        totalCount={1000}
        components={gridComponents}
        itemContent={(index) => <ItemWrapper>Item {index}</ItemWrapper>}
      />
      <style>{`html, body, #root { margin: 0; padding: 0 }`}</style>
    </>
  )
}
```

### Masonry

The masonry component renders columns from varying-height items, suitable for product listings, image galleries, etc. Check the examples in the [masonry section](/hello-masonry) for more details.

## Performance

Several factors affect the component's performance.
The first and most important one is the _size of the visible area_.
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
  return <Virtuoso totalCount={100} itemContent={itemContent} style={{ height: '100%' }} />
}

ReactDOM.render(<App />, document.getElementById('root'))
```

You can experiment with the `increaseViewportBy` property that specifies
how much more to render in addition to the viewport's visible height.
For example, if the component is `100px` tall, setting the `increaseViewportBy`
to `150` will cause the list to render **at least** `250px` of content.

Loading images and displaying complex components while scrolling can cause jank.
To fix that, you can hook to the `isScrolling` callback and replace
the problematic content in the item with a simplified one.
Check the [scroll handling example](/scroll-handling) for a possible implementation.

## Caveats

Setting **CSS margins** to the content or the item elements is the Kryptonite of Virtuoso's content measuring mechanism - the [`contentRect` measurement](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) does not include them.

If this affects you, the total scroll height will be miscalculated, and the user won't be able to scroll all the way down to the list.

To avoid that, if you are putting paragraphs and headings inside the `item`, make sure that the top/bottom elements' margins do not protrude outside of the item container.

```jsx
<Virtuoso
  totalCount={100}
  item={(index) => (
    <div>
      <p style={{ margin: 0 }}>Item {index}</p>
    </div>
  )}
/>
```

A few more common problems are present in the [troubleshooting section](/troubleshooting).
