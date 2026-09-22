import { SetMap } from './SetMap'

import type { Engine } from './Engine'
import type { CellDefinition, ComputedCellDefinition, NodeInit, NodeRef, ResourceDefinition, StreamDefinition } from './types'

export const CELL_TYPE = 'cell'

export const STREAM_TYPE = 'stream'

export const TRIGGER_TYPE = 'trigger'

export const RESOURCE_TYPE = 'resource'

export const nodeDefs$$ = new Map<symbol, CellDefinition<any> | StreamDefinition<any>>()
export const resourceDefs$$ = new Map<symbol, ResourceDefinition<any>>()
export const computedCellDefs$$ = new Map<symbol, ComputedCellDefinition>()
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
