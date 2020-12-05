<img src="//user-images.githubusercontent.com/13347/101237112-ec4c6000-36de-11eb-936d-4b6b7ec94976.png" width="292" />

[![npm version](//badge.fury.io/js/react-virtuoso.svg)](//badge.fury.io/js/react-virtuoso)

**React Virtuoso** is the most powerful React virtual list component, full stop. Here's why in no particular order:

- Variable sized items out of the box; no manual measurements or hard-coded item heights is necessary;
- Support for [reverse (bottom up) scrolling and prepending items](//virtuoso.dev/prepend-items/) (chat, feeds, etc);
- [Grouped mode with sticky headers](//virtuoso.dev/grouped-by-first-letter/);
- [Responsive grid layout](//virtuoso.dev/grid-responsive-columns/);
- [Automatic handling of content resize](//virtuoso.dev/auto-resizing/);
- [Custom Header, Footer, and empty list components](//virtuoso.dev/customize-structure/);
- [Pinned top items](//virtuoso.dev/top-items/);
- [Endless scrolling](//virtuoso.dev/endless-scrolling/), [press to load more](//virtuoso.dev/press-to-load-more/);
- [Initial top most item index](//virtuoso.dev/initial-index/);
- [Scroll to index method](//virtuoso.dev/scroll-to-index/).

For live examples and documentation, check the [documentation website](//virtuoso.dev).

## Get Started

```sh
npm install react-virtuoso
```

```jsx
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from 'react-virtuoso'

const App = () => {
  return (
    <Virtuoso style={{ height: '400px' }} totalCount={200} itemContent={index => <div>Item {index}</div>} />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
```

## [Grouped Mode](//virtuoso.dev/grouped-by-first-letter/)

The `GroupedVirtuoso` component is a variant of the "flat" `Virtuoso`, with the following differences:

- Instead of `totalCount`, the component exposes `groupCounts: number[]` property, which specifies the amount of items in each group.
  For example, passing `[20, 30]` will render two groups with 20 and 30 items each;
- In addition the `itemContent` property, the component requires an additional `groupContent` property,
  which renders the **group header**. The `groupContent` callback receives the zero-based group index as a parameter.

## [Grid](//virtuoso.dev/grid-responsive-columns/)

The `VirtuosoGrid` component displays **same sized items** in multiple columns.
The layout and item sizing is controlled through CSS class properties, which allows you to use media queries, min-width, percentage, etc.

## Works With Your UI Library of Choice

You can customize the markup up to your requirements - check [the Material UI list demo](//virtuoso.dev/material-ui-endless-scrolling/).
If you need to support reordering, [check the React Sortable HOC example](//virtuoso.dev/react-sortable-hoc/).

## Documentation and Demos

For in-depth documentation and live examples of the supported features and live demos, check the [documentation website](//virtuoso.dev).

## Author

Petyo Ivanov [@petyosi](//twitter.com/petyosi).

## Contributing 

### Fixes and new Features

To run the tests, use `npm run test`. 
A holistic, "e2e" test suite is runnable with `npm run e2e`, with the pages being `e2e/*.tsx` and the tests `e2e/*.test.ts`. 

A convenient way to debug something is by previewing one of the e2e test cases. 
To do that, run `npm run preview e2e/hello.tsx`. There are several other examples in the `e2e` directory.

### Docs 

The documentation site is built with docusaurus and the content is available in the `site/docs` directory.
The API reference is generated from the doc comments in `src/components.tsx`.


## License

MIT License.
