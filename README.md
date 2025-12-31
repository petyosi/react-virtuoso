# React Virtuoso

[![NPM version](https://img.shields.io/npm/v/react-virtuoso.svg?style=flat)](//badge.fury.io/js/react-virtuoso)

The most complete React virtualization rendering family of components.

- Variable sized items out of the box; no manual measurements or hard-coding item heights is necessary;
- [Chat message list UI](https://virtuoso.dev/message-list);
- [Grouped mode with sticky headers](https://virtuoso.dev/react-virtuoso/grouped-virtuoso/grouped-by-first-letter);
- [Responsive grid layout](https://virtuoso.dev/react-virtuoso/virtuoso-grid/grid-responsive-columns);
- [Masonry layout](https://virtuoso.dev/masonry);
- [Table Support](https://virtuoso.dev/react-virtuoso/table-virtuoso/basic-table);
- [Automatic handling of content resize](https://virtuoso.dev/react-virtuoso/virtuoso/auto-resizing);
- [Custom Header, Footer, and empty list components](https://virtuoso.dev/react-virtuoso/virtuoso/customize-rendering);
- [Pinned top items](https://virtuoso.dev/react-virtuoso/virtuoso/top-items);
- [Endless scrolling](https://virtuoso.dev/react-virtuoso/virtuoso/endless-scrolling), [press to load more](https://virtuoso.dev/react-virtuoso/virtuoso/press-to-load-more);
- [Initial top most item index](https://virtuoso.dev/react-virtuoso/virtuoso/initial-index);
- [Scroll to index method](https://virtuoso.dev/react-virtuoso/virtuoso/scroll-to-index).

## Get Started

```sh
npm install react-virtuoso
```

```jsx import * as React from 'react' import * as ReactDOM from 'react-dom'
import { Virtuoso } from 'react-virtuoso'

const App = () => {
  return <Virtuoso style={{ height: '400px' }} totalCount={200} itemContent={(index) => <div>Item {index}</div>} />
}

ReactDOM.render(<App />, document.getElementById('root'))
```

## Documentation

For in-depth documentation and live examples of all supported features, check the [documentation website](https://virtuoso.dev).

## Components

### [Message List](https://virtuoso.dev/message-list)

The Virtuoso message list component is built specifically for human/chatbot conversations. In addition to the virtualized rendering, the component exposes an imperative data management API that gives you the necessary control over the scroll position when older messages are loaded, new messages arrive, and when the user submits a message. The scroll position can update instantly or with a smooth scroll animation.

### [Grouped Mode](https://virtuoso.dev/react-virtuoso/grouped-virtuoso/grouped-by-first-letter)

The `GroupedVirtuoso` component is a variant of the flat `Virtuoso` component, with the following differences:

- Instead of `totalCount`, the component exposes `groupCounts: number[]` property, which specifies the amount of items in each group.
  For example, passing `[20, 30]` will render two groups with 20 and 30 items each;
- In addition the `itemContent` property, the component requires an additional `groupContent` property,
  which renders the **group header**. The `groupContent` callback receives the zero-based group index as a parameter.

### [Grid](https://virtuoso.dev/react-virtuoso/virtuoso-grid/grid-responsive-columns)

The `VirtuosoGrid` component displays **same sized items** in multiple columns.
The layout and item sizing is controlled through CSS class properties, which allows you to use media queries, min-width, percentage, etc.

### [Masonry](https://virtuoso.dev/masonry)

The `Masonry` component renders columns from varying-height items, suitable for product listings, image galleries, etc.

### [Table](https://virtuoso.dev/react-virtuoso/table-virtuoso/basic-table)

The `TableVirtuoso` component works just like `Virtuoso`, but with HTML tables.
It supports window scrolling, sticky headers, sticky columns, and works with Tanstack Table and MUI Table.

### Works With Your UI Library

You can customize the markup up to your requirements - check [the Material UI list demo](https://virtuoso.dev/react-virtuoso/third-party-integration/material-ui-endless-scrolling).

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing guidelines, and pull request process.

## Sponsors

If you find Virtuoso valuable for your work, please consider [sponsoring the project](https://github.com/sponsors/petyosi). Your support helps ensure continued development and maintenance.

## Author

Petyo Ivanov [@petyosi](//twitter.com/petyosi).

## License

MIT License.
