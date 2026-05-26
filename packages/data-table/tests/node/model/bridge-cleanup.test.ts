import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it, vi } from 'vitest'

import { localModel } from '../../../src/model/local-model'
import { bridgeModelToEngine } from '../../../src/model/model-bridge'
import { createModel } from '../../../src/model/model-core'
import { viewportRange$ } from '../../../src/rows/row-state'

import type { DataResult, FrameAdapter, MessageEnvelope } from '../../../src/model/types'

interface Item {
  id: number
  name: string
  category: string
}

const ITEMS: Item[] = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  name: `item-${i}`,
  category: i % 2 === 0 ? 'A' : 'B',
}))

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

function resultsOf(messages: MessageEnvelope[]) {
  return messages.filter((m) => m.type === 'result')
}

describe('bridgeModelToEngine cleanup on engine disposal', () => {
  it('sends disconnect to the model when the engine is disposed', () => {
    const handleDisconnect = vi.fn()
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1, 2, 3], groups: [] }),
      handleDisconnect,
    }

    const model = createModel(adapter)
    const engine = new Engine()
    engine.register(viewportRange$)

    // This mirrors VirtuosoDataTable.tsx:109 — the return value is discarded
    bridgeModelToEngine(model, engine, 'default')

    // Simulate unmount: EngineProvider calls engine.dispose()
    engine.dispose()

    // The bridge should have sent 'disconnect' so the model cleans up view state.
    // This FAILS because the cleanup function was never registered with engine.onDispose().
    expect(handleDisconnect).toHaveBeenCalledWith('default')
  })

  it('cleans up per-view pipeline state when the engine is disposed', () => {
    const model = localModel<Item>({
      data: ITEMS,
      pipeline: ['filter'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }: { data: Item[]; payload: unknown }) => data.filter((item) => item.category === (payload as string)),
        },
      },
    })

    const engine = new Engine()
    engine.register(viewportRange$)

    // Bridge the model and apply a filter — only category 'A' items (5 out of 10)
    bridgeModelToEngine(model, engine, 'default')
    model.send({ action: 'filter', payload: 'A', viewId: 'default' })

    // Dispose engine (simulates component unmount)
    engine.dispose()

    // Reconnect with a fresh handshake on the same viewId.
    // If disconnect was sent, the view's pipeline state (including the filter payload)
    // would have been cleared, and this handshake returns all 10 items.
    // Without disconnect, the stale filter payload persists in localModel's viewStates Map,
    // so handshake re-runs the pipeline with the old filter and returns only 5 items.
    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'default' })

    const results = resultsOf(messages)
    const reconnectData = (results.at(-1)!.payload as DataResult<Item>).data

    expect(reconnectData).toHaveLength(10)
  })
})
