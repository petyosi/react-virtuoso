<img src="https://user-images.githubusercontent.com/13347/57673110-85aab180-7623-11e9-97b4-27bbdcf8cf40.png" width="292">

[![npm version](https://badge.fury.io/js/react-virtuoso.svg)](https://badge.fury.io/js/react-virtuoso)

**React Virtuoso** is a simple, easy to use React component made to render huge data lists. Out of the box, Virtuoso:

- Handles gracefully variable sized items; no manual measurements or hard-coding of item heights;
- Supports grouping with sticky group headers;
- Automatically handles content resizing;
- Can render footer at the end of the list;
- Can pin the first `N` items to the top of the list.

To see live examples, check the [website](//virtuoso.dev).

## Get Started

Install the package in your React project:

```sh
npm install react-virtuoso
```

Or, if yarn is your thing:

```sh
yarn add react-virtuoso
```

Then, put the component somewhere in your tree:

```jsx
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from 'react-virtuoso'

const App = () => {
  return (
    <Virtuoso style={{ width: '200px', height: '400px' }} totalCount={200} item={index => <div>Item {index}</div>} />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
```

### Add a Footer

The component accepts an optional `footer` [render property](https://reactjs.org/docs/render-props.html), the contents of which are rendered at the bottom of the list. The footer can be used to host a "load more" button or an indicator that the user has reached the end of the list.

```jsx
return (
  <Virtuoso
    style={{ height: '300px', width: '500px' }}
    totalCount={100}
    item={index => <div>Item {index}</div>}
    footer={() => <div>-- end reached --</div>}
  />
)
```

Check the [footer](//virtuoso.dev/footer), [load more](//virtuoso.dev/press-to-load-more) and [endless scrolling](//virtuoso.dev/endless-scrolling) examples for practical applications of the footer.

### Pinned Items

The component accepts an optional `topItems` property, that specifies how many of the items to keep "pinned" at the top of the list.

```jsx
return (
  <Virtuoso
    style={{ height: '500px', width: '500px' }}
    topItems={2}
    totalCount={100000}
    item={index => <div>Item {index}</div>}
  />
)
```

Check the [fixed top items](//virtuoso.dev/top-items) example for a live version of the above.

### Grouping

The package exports two components - `Virtuoso` and `GroupedVirtuoso`.

The grouped component is similar to the flat one, with the following differences:

- Instead of `totalCount`, the component accepts `groupedCounts: number[]`, which specifies the amount of items in each group.
  For example, passing `[20, 30]` will cause the component to render two groups with 20 and 30 items respectively;
- In addition the `item` render prop, the component requires an additional `group` render prop,
  which renders the group header. The property receives the zero-based group index as a parameter;
- The `item` render prop gets called with an additional second parameter, `groupIndex: number`.

```jsx
// generate 100 groups with 10 items each
const groupCounts = []
for (let index = 0; index < 100; index++) {
  groupCounts.push(10)
}

return (
  <GroupedVirtuoso
    style={{ height: '500px', width: '500px' }}
    groupCounts={groupCounts}
    group={index => (
      <div>
        Group {index * 10} - {index * 10 + 10}
      </div>
    )}
    item={(index, groupIndex) => (
      <div>
        Item {index} from group {groupIndex}
      </div>
    )}
  />
)
```

Check the
[grouped numbers](//virtuoso.dev/grouped-numbers),
[grouped by first letter](//virtuoso.dev/grouped-by-first-letter) and
[groups with load on demand](//virtuoso.dev/grouped-with-load-on-demand)
examples for working examples.

## Tweaking Performance

Several factors affect the component performance, the most important being the _size of the visible area_. Redrawing large items takes more time and reduces the frame rate. To see if this affects your case, change the component `style` property to something like `{{width: '200px'}}` and see if the frame rate gets better.

Next, if the content in the item prop is complex / large, use [React.memo](https://reactjs.org/docs/react-api.html#reactmemo).

You can experiment with the `overscan` property which specifies how much more to render in addition to the viewport visible height. For example, if the component is `100px` tall, setting the `overscan` to `150` will cause the list to render **at least** `250px` tall content. In a nutshell, increasing the `overscan` causes less frequent re-renders, but makes each re-render more expensive (because more items will get replaced).

Loading images and displaying complex components while scrolling can cause hiccups and frame skips. To fix that, you can hook to the `scrollingStateChange` callback and replace the complex content in the item render prop with a simplified one. Check the [scroll handling example](//virtuoso.dev/?path=/story/features-overview--scroll-handling) for a possible implementation.

Finally, as a last resort, you can speed up things by hard-coding the size of the items using the `itemHeight` property. This will cause the component to stop measuring and observing the item sizes. Be careful with that option; ensure that the items won't change size on different resolutions.

## Properties of the `Virtuoso` Component

### `total: number`

Mandatory. Specifies the total amount of items to be displayed by the list.

### `item: (index: number) => ReactElement`

Mandatory. Specifies how each item gets rendered. The callback receives the zero-based index of the item.

### `style?: CSSProperties`

Optional; most often, you will need to tweak the size of the component by setting `width` and `height`.
The style is passed to the outermost `div` element of the component.

### `footer?: () => ReactElement`

Optional. Defines content to be rendered at the bottom of the list.

### `overscan?: number`

Optional. Causes the component to render extra content in addition to the necessary one to fill in the visible viewport.
Check the Tweaking Performance section.

### `endReached?: (index: number) => void`

Gets called when the user scrolls to the end of the list.
Receives the last item index as an argument. Can be used to implement [endless scrolling](//virtuoso.dev/endless-scrolling).

### `scrollingStateChange?: (isScrolling: boolean) => void`

Gets called when the user starts / stops scrolling. Can be used to hide complex item contents during scrolling.

### `itemHeight?: number`

Can be used to improve performance if the rendered items are of known size. Setting it causes the component to skip item measurements. See the Tweaking Performance section for more details.

## Properties of the `GroupedVirtuoso` Component

### `groupCounts: number[]`

Mandatory. Specifies the amount of items in each group (and, actually, how many groups are there). For example, passing `[20, 30]` will display 2 groups with 20 and 30 items each.

### `item: (index: number, groupIndex: number) => ReactElement`

Mandatory. Specifies how each item gets rendered. The callback receives the zero-based index of the item and the index of the group of the item.

### `group: (groupIndex: number) => ReactElement`

Mandatory. Specifies how each each group header gets rendered. The callback receives the zero-based index of the group.

### `style?: CSSProperties`

Works just like the `style` property of the flat component.

### `footer?: () => ReactElement`

Works just like the `footer` property of the flat component.

### `overscan?: number`

Works just like the `overscan` property of the flat component.

### `endReached?: (index: number) => void`

Works just like the `endReached` callback of the flat component.

### `scrollingStateChange?: (isScrolling: boolean) => void`

Works just like the `scrollingStateChange` callback of the flat component.

## Gotchas

CSS margins in the content are the Kryptonite of Virtuoso's content measuring mechanism - the [`contentRect` measurement](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) does not include them.

If this affects you, the total scroll height will be miscalculated, and the user won't be able to scroll all the way down to the list.

To avoid that, if you are putting paragraphs and headings inside the `item`, make sure that the top / bottom elements' margins do not protrude outside of the item container.

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

## Browser Support

Virtuoso uses `position: sticky` to keep the virtual viewport at top of the scroller.
[This does not work in IE 11](https://caniuse.com/#feat=css-sticky).
Please open an issue (or even, PR) if you need this - it should be possible to implement a fallback mechanism using `position: absolute`.

## Author

Petyo Ivanov [@petyosi](https://twitter.com/petyosi)

## License

MIT License.
