import type { Engine } from './Engine'
import type { CellDefinition, NodeInit, NodeRef, ResourceDefinition, StreamDefinition } from './types'

import { SetMap } from './SetMap'

export const CELL_TYPE = 'cell'

export const STREAM_TYPE = 'stream'

export const RESOURCE_TYPE = 'resource'

// biome-ignore lint/suspicious/noExplicitAny: needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeDefs$$ = new Map<symbol, CellDefinition<any> | StreamDefinition<any>>()
// biome-ignore lint/suspicious/noExplicitAny: needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resourceDefs$$ = new Map<symbol, ResourceDefinition<any>>()
export const nodeDebugLabels$$ = new Map<symbol, string>()
export const nodeInits$$ = new SetMap<NodeInit<unknown>>()
export const nodeInitSubscriptions$$ = new Set<(nodes$: NodeRef[], init: NodeInit<unknown>) => void>()

let currentEngine$$: Engine | null = null

export function getCurrentEngine() {
  return currentEngine$$
}

export function inEngineContext<T>(engine: Engine, fn: () => T) {
  const prevEngine = currentEngine$$
  currentEngine$$ = engine
  try {
    return fn()
  } finally {
    currentEngine$$ = prevEngine
  }
}
