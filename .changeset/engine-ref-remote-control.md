---
'@virtuoso.dev/reactive-engine-react': minor
---

Add ref-based remote engine access via useEngineRef and EngineRef

- Add `useEngineRef()` hook that returns a reactive `EngineRef` object
- Add `engineRef` prop to `EngineProvider` for populating the ref
- Extend all `useRemote*` hooks to accept `string | EngineRef` as the engine source
- Rename `RemoteCellValuesOptions.engineId` to `engineSource` (breaking for `useRemoteCellValues` consumers)
