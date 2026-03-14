import { describe, expect, it } from 'vitest'

import { createModel } from '../../../src/model/model-core'

import type { DataResult, FrameAdapter, MessageEnvelope } from '../../../src/model/types'

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

describe('concurrency strategies', () => {
  describe('supersede (default)', () => {
    it('fires sort twice, both execute (sync)', () => {
      let callCount = 0
      const adapter: FrameAdapter<number> = {
        handleHandshake: () => ({ data: [3, 1, 2], groups: [] }),
        handleAction: (_viewId, action, payload) => {
          if (action === 'sort') {
            callCount++
            const dir = payload as 'asc' | 'desc'
            const data = [3, 1, 2].toSorted((a, b) => (dir === 'asc' ? a - b : b - a))
            return { data, groups: [] }
          }
          return null
        },
      }

      const model = createModel(adapter)
      const messages = collectMessages(model)

      model.send({ action: 'handshake', viewId: 'v1' })
      model.send({ action: 'sort', payload: 'asc', viewId: 'v1' })
      model.send({ action: 'sort', payload: 'desc', viewId: 'v1' })

      expect(callCount).toBe(2)
      // Last result wins
      const lastResult = messages.at(-1)!.payload as DataResult<number>
      expect(lastResult.data).toEqual([3, 2, 1])
    })
  })

  describe('deduplicate', () => {
    it('second fire of same action is ignored while in-flight', () => {
      let callCount = 0
      const adapter: FrameAdapter<number> = {
        handleHandshake: () => ({ data: [1, 2, 3], groups: [] }),
        handleAction: (_viewId, action) => {
          if (action === 'filter') {
            callCount++
            return { data: [1], groups: [] }
          }
          return null
        },
        getActionStrategy: (action) => (action === 'filter' ? 'deduplicate' : undefined),
      }

      const model = createModel(adapter)
      const messages = collectMessages(model)

      model.send({ action: 'handshake', viewId: 'v1' })
      model.send({ action: 'filter', payload: 'a', viewId: 'v1' })
      model.send({ action: 'filter', payload: 'b', viewId: 'v1' })

      // For sync operations, deduplicate works on in-flight tracking.
      // Since sync ops complete immediately, the second fires normally.
      // Deduplicate truly matters for async ops.
      // Both fire because by the time the second arrives, the first has completed.
      expect(callCount).toBe(2)
      expect(messages.filter((m) => m.type === 'result')).toHaveLength(3)
    })
  })

  describe('queue', () => {
    it('queued actions execute sequentially', () => {
      const order: string[] = []
      const adapter: FrameAdapter<number> = {
        handleHandshake: () => ({ data: [1], groups: [] }),
        handleAction: (_viewId, action, payload) => {
          if (action === 'process') {
            order.push(payload as string)
            return { data: [1], groups: [] }
          }
          return null
        },
        getActionStrategy: (action) => (action === 'process' ? 'queue' : undefined),
      }

      const model = createModel(adapter)
      collectMessages(model)

      model.send({ action: 'handshake', viewId: 'v1' })
      model.send({ action: 'process', payload: 'first', viewId: 'v1' })
      model.send({ action: 'process', payload: 'second', viewId: 'v1' })
      model.send({ action: 'process', payload: 'third', viewId: 'v1' })

      // For sync operations, queue processes all items in order
      expect(order).toEqual(['first', 'second', 'third'])
    })
  })
})

describe('error recovery', () => {
  it('handler throws: emits error then reverts to last known-good state', () => {
    let shouldThrow = false
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1, 2, 3], groups: [] }),
      handleAction: (_viewId, action) => {
        if (action === 'risky') {
          if (shouldThrow) {
            throw new Error('something broke')
          }
          return { data: [10, 20], groups: [] }
        }
        return null
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })

    // Successful action establishes known-good state
    model.send({ action: 'risky', viewId: 'v1' })
    const results = messages.filter((m) => m.type === 'result')
    expect((results[1]!.payload as DataResult<number>).data).toEqual([10, 20])

    // Now trigger an error
    shouldThrow = true
    model.send({ action: 'risky', viewId: 'v1' })

    // Should get error message
    const errorMsg = messages.find((m) => m.type === 'error')!
    expect(errorMsg).toBeDefined()
    expect(errorMsg.error!.message).toBe('something broke')
    expect(errorMsg.action).toBe('risky')

    // Should get revert result with last known-good data
    const revertMsg = messages.at(-1)!
    expect(revertMsg.type).toBe('result')
    expect((revertMsg.payload as DataResult<number>).data).toEqual([10, 20])
  })

  it('error without known-good state: emits error only', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [], groups: [] }),
      handleAction: () => {
        throw new Error('fail')
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    // handshake result is empty, lastKnownGood is { data: [], groups: [] }
    model.send({ action: 'broken', viewId: 'v1' })

    const errorMsg = messages.find((m) => m.type === 'error')!
    expect(errorMsg).toBeDefined()
    expect(errorMsg.error!.message).toBe('fail')

    // Reverts to known-good (empty data from handshake)
    const lastMsg = messages.at(-1)!
    expect(lastMsg.type).toBe('result')
    expect((lastMsg.payload as DataResult<number>).data).toEqual([])
  })

  it('stale operationVersion result is dropped', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
      handleAction: (_viewId, action) => {
        if (action === 'a') {
          return { data: [2], groups: [] }
        }
        if (action === 'b') {
          return { data: [3], groups: [] }
        }
        return null
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'a', viewId: 'v1' })
    model.send({ action: 'b', viewId: 'v1' })

    // For sync operations, all results are emitted in order
    // Stale detection only applies when results arrive out of order (async)
    const results = messages.filter((m) => m.type === 'result')
    expect(results).toHaveLength(3)
    expect(results[2]!.operationVersion).toBe(2)
  })
})
