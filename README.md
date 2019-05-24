<img src="https://user-images.githubusercontent.com/13347/57673110-85aab180-7623-11e9-97b4-27bbdcf8cf40.png" width="292">

[![npm version](https://badge.fury.io/js/react-virtuoso.svg)](https://badge.fury.io/js/react-virtuoso)

**React Virtuoso** is a simple, easy to use React component made to render huge data lists. Out of the box, Virtuoso:

- Handles variable sized items; no manual measurements or hard-coding of item heights;
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

### Footer

The component accepts an optional `footer` [render property](https://reactjs.org/docs/render-props.html), rendered at the bottom of the list.
The footer can be used to host a "load more" button or an indicator that the user has reached the end of the list.

Check the [footer](//virtuoso.dev/footer), [load more](//virtuoso.dev/press-to-load-more) and [endless scrolling](//virtuoso.dev/endless-scrolling) examples for practical applications of the footer.

### Pinned Items

The component accepts an optional `topItems` property, that specifies how many of the items to keep "pinned" at the top of the list.

Check the [fixed top items](//virtuoso.dev/top-items) example for a live version of the above.

### Grouping

The package exports two components - `Virtuoso` and `GroupedVirtuoso`.
The Grouped component supports rendering sticky group headers at the beginning of each group.

Check the
[grouped numbers](//virtuoso.dev/grouped-numbers),
[grouped by first letter](//virtuoso.dev/grouped-by-first-letter) and
[groups with load on demand](//virtuoso.dev/grouped-with-load-on-demand)
examples for working examples.

## Documentation and Demos

For in-depth documentation and live examples of the supported features and live demos, check the [website](https://virtuoso.dev).

## Author

Petyo Ivanov [@petyosi](https://twitter.com/petyosi)

## License

MIT License.
