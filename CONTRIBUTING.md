# Contributing to React Virtuoso

## Run the project locally

The repository uses NPM, [turborepo](https://turbo.build/), and [changesets](https://github.com/changesets/changesets) for its infrastructure. The `react-virtuoso` package has a [ladle](https://ladle.dev/) setup for examples, test cases, and bug reproductions. Run `npm run dev` inside `packages/react-virtuoso`.

## Add fixes and new features

Virtuoso has an extensive unit/E2E test suite. To run the unit tests, use `npm run test`. You can run the end-to-end browser-based test suite with `npm run e2e`, which executes a Playwright test suite against the ladle examples.
