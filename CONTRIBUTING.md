# Contributing to React Virtuoso

Want to contribute to React Virtuoso? You will encounter a state management you are not familiar with - it's implemented using [URX](https://urx.virtuoso.dev).
Check the examples and the conceptual docs to get the gist of it.

### How to add fixes and new features

Virtuoso has an extensive unit/e2e test suite. To run the unit tests, use `pnpm run test`. An end-to-end browser-based test suite is runnable with `pnpm run e2e`.

A convenient way to debug something is to preview the test cases in the browser.
To do that, run `pnpm run dev` - it will open a simple UI that lets you browse the components in the `examples` folder.

### How to add to the docs

The documentation site is built with docusaurus and the content is available in the `site/docs` directory.
The API reference is generated from the doc comments in `src/components.tsx`.
