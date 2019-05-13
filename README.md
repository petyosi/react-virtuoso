# React Virtuoso

React Virtuoso is a simple, minimal configuration React component tuned to render huge data lists. Virtuoso does the following for you:

- Automatic handling of dynamic sized items; no manual measurements or size hard-coding;
- Automatic handling of list / content resizing;
- Optional footer rendering at the end of the list;
- Pinning of the first `N` items to the top of the list.

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

```tsx
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/Virtuoso'

const App = () => {
  return (
    <Virtuoso
      style={{ width: '200px', height: '400px' }}
      totalCount={200}
      item={(index: number) => <div>Item {index}</div>}
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
```

To see more live examples of the component, browse the [storybook](//virtuoso.dev).

## Add a Footer

The component accepts an optional `footer` render callback property, that should return a react element rendered at the bottom of the list.
The property can be used to host a "load more" button or an indicator that the user has reached the end of the list.

```tsx
<Virtuoso
  style={{ height: '300px', width: '500px' }}
  totalCount={100}
  item={Item}
  footer={() => <div>-- end reached --</div>}
/>
```

Check the [footer](//virtuoso.dev/?path=/story/features-overview--footer), [load more](//virtuoso.dev/?path=/story/scenarios--press-to-load-more) and [endless scrolling](//virtuoso.dev/?path=/story/scenarios--endless-scrolling) examples for practical applications of the footer.

### Pinned Items

The component accepts an optional `topItems` property, that specifies how many of the items to keep "pinned" at the top of the list.

```tsx
<Virtuoso style={{ height: '500px', width: '500px' }} topItems={2} totalCount={100000} item={Item} />
```

Check the [fixed top items](//virtuoso.dev/?path=/story/features-overview--fixed-top-items) example for a live version of the above.

## Tweaking Performance

Few things can affect the component performance, the most important being the visible area.
Redrawing large items takes more time and reduces the frame rate.
To see if this works for you, you can set the component `style` property to something like `{{width: '200px'}}` and see if the frame rate gets better.

You can experiment with the `overscan` property which specifies how much more to render in addition to the viewport visible height.
For example, if the component is `100px` tall, setting the overscan to `150` will cause the list to render **at least** `250px` tall content.
In a nutshell, increasing the overscan causes less frequent re-renders, but makes each re-render more expensive (because more items will get replaced).

Loading images and displaying complex components while scrolling can cause hiccups and frame skips.
To fix that, you can hook to the `scrollingStateChange` callback and replace the complex content in the item render prop with a simplified one.
Check the [scroll handling example](//virtuoso.dev/?path=/story/features-overview--scroll-handling) for a possible implementation.

Finally, as a last resort, you can speed up things by hard-coding the size of the items using the `itemHeight` property.
This will cause the component to stop measuring and observing the item sizes. Be careful doing that;
ensure that the items won't change size on different resolutions.

## Properties

### `item: (index: number) => ReactElement`

### `total: number`

### `itemHeight?: number`

### `footer?: () => ReactElement`

### `overscan?: number`

### `endReached?: (index: number) => void`

### `scrollingStateChange?: (isScrolling: boolean) => void`

### `style?: CSSProperties`

## Gotchas

CSS Margins in the content are the kryptonite of Virtuoso's content measuring mechanism -
the [contentRect measurement](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) does not include them.

If this affects you, the total scroll height will get miscalculated, and the user won't be able to scroll all the way down to the list.

To avoid it, if you are putting paragraphs and headings inside the `item`, make sure that the top / bottom elements' margins do not
protrude outside of the item container.

```tsx
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
Please open an issue (or even, a PR) if you need this - it is possible to implement a fallback mechanism.

## Author

## License
