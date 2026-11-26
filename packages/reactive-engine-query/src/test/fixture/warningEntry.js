// oxlint-disable typescript/no-unsafe-return -- untyped JavaScript fixture for distWarning.test.ts
// Bundled by distWarning.test.ts with different NODE_ENV settings, then run in a sandbox without `process`.
import { Engine } from '@virtuoso.dev/reactive-engine-core'

import { Mutation } from '../../../dist/index.js'

const mutation = Mutation({ key: (params) => params.id, mutationFn: () => new Promise(() => {}) })
const engine = new Engine()
engine.pub(mutation.mutate$, { id: 1 })
engine.pub(mutation.mutate$, { id: 1 })
globalThis.fixtureDone = true
