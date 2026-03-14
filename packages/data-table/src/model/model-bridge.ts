import { data$, groupIndices$ } from '../core/data'
import { viewportRange$ } from '../rows/row-state'

import type { DataModelHandle, DataResult, MessageEnvelope } from './types'
import type { Engine } from '@virtuoso.dev/reactive-engine-core'

export function bridgeModelToEngine(model: DataModelHandle, engine: Engine, viewId: string): () => void {
  const unsub = model.subscribe((msg: MessageEnvelope) => {
    if (msg.type === 'result' && msg.viewId === viewId) {
      const result = msg.payload as DataResult
      engine.pubIn({
        [data$]: [...result.data],
        [groupIndices$]: result.groups,
      })
    }
  })

  const unsubViewport = engine.sub(viewportRange$, (range) => {
    if (range !== null) {
      model.send({ action: 'viewportChange', payload: range, viewId })
    }
  })

  model.send({ action: 'handshake', viewId })

  return () => {
    model.send({ action: 'disconnect', viewId })
    unsub()
    unsubViewport()
  }
}
