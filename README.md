<img src="https://user-images.githubusercontent.com/13347/101237112-ec4c6000-36de-11eb-936d-4b6b7ec94976.png" width="229" />

[![npm version](https://img.shields.io/npm/v/react-virtuoso.svg?style=flat)](//badge.fury.io/js/react-virtuoso)

**React Virtuoso** is the most powerful React virtual list component, full stop. Here's why:

- Variable sized items out of the box; no manual measurements or hard-coding item heights is necessary;
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

## Sponsors

[![Stream](https://i.imgur.com/oU7XYkk.png)](https://getstream.io/chat/react-chat/tutorial/?utm_source=https://github.com/petyosi/react-virtuoso&utm_medium=github&utm_content=developer&utm_term=react)

React Virtuoso is proudly sponsored by [Stream](https://getstream.io/?utm_source=github&utm_medium=react-virtuoso&utm_campaign=sponsorship), the leading provider in enterprise grade [Feed](https://getstream.io/activity-feeds/?utm_source=github&utm_medium=react-virtuoso&utm_campaign=sponsorship) & [Chat](https://getstream.io/chat/?utm_source=github&utm_medium=react-virtuoso&utm_campaign=sponsorship) APIs. To learn more about Stream, [click here](https://getstream.io/?utm_source=github&utm_medium=react-virtuoso&utm_campaign=sponsorship).

If you are using Virtuoso for work, [sponsor it](https://www.patreon.com/react_virtuoso). Any donation helps a lot with the project development and maintenance.

## Get Started

```sh
npm install react-virtuoso
```

```jsx
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from 'react-virtuoso'

const App = () => {
  return <Virtuoso style={{ height: '400px' }} totalCount={200} itemContent={index => <div>Item {index}</div>} />
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

## Browser support

To support [legacy browsers](https://caniuse.com/resizeobserver), you might have to load a [ResizeObserver Polyfill](https://www.npmjs.com/package/resize-observer-polyfill) before using `react-virtuoso`:

```
import ResizeObserver from 'resize-observer-polyfill'
if (!window.ResizeObserver)
  window.ResizeObserver = ResizeObserver
```

## Author

Petyo Ivanov [@petyosi](//twitter.com/petyosi).

## Contributing

### Fixes and new Features

To run the tests, use `npm run test`.
An end-to-end browser-based test suite is runnable with `npm run e2e`, with the pages being `e2e/*.tsx` and the tests `e2e/*.test.ts`.

A convenient way to debug something is to preview the test cases in the browser.
To do that, run `npm run browse-examples` - it will open a crude UI that lets you browse the components in the `e2e` folder.

### Docs

The documentation site is built with docusaurus and the content is available in the `site/docs` directory.
The API reference is generated from the doc comments in `src/components.tsx`.

## License

MIT License.
