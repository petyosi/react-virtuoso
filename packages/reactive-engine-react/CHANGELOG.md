# @virtuoso.dev/reactive-engine-react

## 0.2.0

### Minor Changes

- [`b2bcc42`](https://github.com/petyosi/react-virtuoso/commit/b2bcc426b78cd7d824977649a7f884041ef559b7) Thanks [@petyosi](https://github.com/petyosi)! - Add ref-based remote engine access via useEngineRef and EngineRef
  - Add `useEngineRef()` hook that returns a reactive `EngineRef` object
  - Add `engineRef` prop to `EngineProvider` for populating the ref
  - Extend all `useRemote*` hooks to accept `string | EngineRef` as the engine source
  - Rename `RemoteCellValuesOptions.engineId` to `engineSource` (breaking for `useRemoteCellValues` consumers)

## 0.1.0

### Minor Changes

- [`34097be`](https://github.com/petyosi/react-virtuoso/commit/34097bec6b2d69642ac6ff4c942ae457bbecce2d) Thanks [@petyosi](https://github.com/petyosi)! - Add remote hooks for accessing engine state from anywhere in the app
  - Add `engineId` prop to `EngineProvider` to register engine in global registry
  - Add `useRemoteCellValue(cell$, engineId)` - returns cell value or `undefined` if engine not available
  - Add `useRemotePublisher(node$, engineId)` - returns publisher function (noop if no engine)
  - Add `useRemoteCell(cell$, engineId)` - combines value and publisher
  - Add `useRemoteCellValues({ cells, engineId })` - multi-cell variant with options object form

  These hooks enable components anywhere in the app to access engine state without being inside an `EngineProvider`, useful for sibling components or components in different parts of the tree.

## 0.0.4

### Patch Changes

- [#1341](https://github.com/petyosi/react-virtuoso/pull/1341) [`93f476c`](https://github.com/petyosi/react-virtuoso/commit/93f476ccd43381d314f9d19035f69633f5eec013) Thanks [@petyosi](https://github.com/petyosi)! - Fix typing for useCellValues

## 0.0.3

### Patch Changes

- [#1337](https://github.com/petyosi/react-virtuoso/pull/1337) [`259eaf6`](https://github.com/petyosi/react-virtuoso/commit/259eaf6c057863c12c457ea6de2a16b91ab6ffbe) Thanks [@petyosi](https://github.com/petyosi)! - Re-write the props of the EngineProvider

- Updated dependencies [[`259eaf6`](https://github.com/petyosi/react-virtuoso/commit/259eaf6c057863c12c457ea6de2a16b91ab6ffbe)]:
  - @virtuoso.dev/reactive-engine-core@0.0.3

## 0.0.2

### Patch Changes

- [#1330](https://github.com/petyosi/react-virtuoso/pull/1330) [`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35) Thanks [@petyosi](https://github.com/petyosi)! - Initial release

- Updated dependencies [[`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35)]:
  - @virtuoso.dev/reactive-engine-core@0.0.2
