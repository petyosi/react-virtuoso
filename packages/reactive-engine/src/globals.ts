import type { Engine } from './Engine'
import type { CellDefinition, NodeInit, StreamDefinition } from './types'

import { SetMap } from './SetMap'

export const CELL_TYPE = 'cell'

export const STREAM_TYPE = 'stream'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeDefs$$ = new Map<symbol, CellDefinition<any> | StreamDefinition<any>>()
export const nodeLabels$$ = new Map<symbol, string>()
export const nodeInits$$ = new SetMap<NodeInit<unknown>>()

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
