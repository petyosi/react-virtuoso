---
"@virtuoso.dev/reactive-engine-react": minor
---

Add remote hooks for accessing engine state from anywhere in the app

- Add `engineId` prop to `EngineProvider` to register engine in global registry
- Add `useRemoteCellValue(cell$, engineId)` - returns cell value or `undefined` if engine not available
- Add `useRemotePublisher(node$, engineId)` - returns publisher function (noop if no engine)
- Add `useRemoteCell(cell$, engineId)` - combines value and publisher
- Add `useRemoteCellValues({ cells, engineId })` - multi-cell variant with options object form

These hooks enable components anywhere in the app to access engine state without being inside an `EngineProvider`, useful for sibling components or components in different parts of the tree.
