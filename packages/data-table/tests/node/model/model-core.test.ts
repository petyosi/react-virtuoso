import { describe, expect, it } from 'vitest'

import { createModel } from '../../../src/model/model-core'

import type { DataResult, FrameAdapter, MessageEnvelope } from '../../../src/model/types'

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

function resultsOf(messages: MessageEnvelope[]) {
  return messages.filter((m) => m.type === 'result')
}

function acksOf(messages: MessageEnvelope[]) {
  return messages.filter((m) => m.type === 'ack')
}

describe('model-core', () => {
  it('handshake emits a result message', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1, 2, 3], groups: [] }),
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })

    const results = resultsOf(messages)
    expect(results).toHaveLength(1)
    expect(results[0]!.type).toBe('result')
    expect(results[0]!.viewId).toBe('v1')
    expect(results[0]!.operationVersion).toBe(0)
    expect(results[0]!.dataVersion).toBe(1)
    expect((results[0]!.payload as DataResult<number>).data).toEqual([1, 2, 3])
    expect((results[0]!.payload as DataResult<number>).groups).toEqual([])
  })

  it('increments requestId across messages', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [], groups: [] }),
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'handshake', viewId: 'v1' })

    const results = resultsOf(messages)
    expect(results).toHaveLength(2)
    expect(Number(results[1]!.requestId)).toBeGreaterThan(Number(results[0]!.requestId))
  })

  it('increments dataVersion on each result', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [], groups: [] }),
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'handshake', viewId: 'v1' })

    const results = resultsOf(messages)
    expect(results[0]!.dataVersion).toBe(1)
    expect(results[1]!.dataVersion).toBe(2)
  })

  it('disconnect decrements subscriber count and cleans up on zero', () => {
    let disconnected = false
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [], groups: [] }),
      handleDisconnect: () => {
        disconnected = true
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'disconnect', viewId: 'v1' })

    expect(disconnected).toBe(true)

    // no further emissions after disconnect + re-handshake on same view
    model.send({ action: 'handshake', viewId: 'v1' })
    const results = resultsOf(messages)
    expect(results).toHaveLength(2)
  })

  it('does not emit after destroy', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [], groups: [] }),
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.destroy()
    model.send({ action: 'handshake', viewId: 'v1' })

    expect(messages).toHaveLength(0)
  })

  it('unsubscribe stops delivering messages', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [], groups: [] }),
    }

    const model = createModel(adapter)
    const messages: MessageEnvelope[] = []
    const unsub = model.subscribe((msg) => messages.push(msg))

    model.send({ action: 'handshake', viewId: 'v1' })
    expect(resultsOf(messages)).toHaveLength(1)

    unsub()
    model.send({ action: 'handshake', viewId: 'v1' })
    expect(resultsOf(messages)).toHaveLength(1)
  })

  it('routes actions to the adapter', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1, 2, 3], groups: [] }),
      handleAction: (_viewId, action, payload) => {
        if (action === 'filter') {
          const threshold = payload as number
          return { data: [1, 2, 3].filter((n) => n > threshold), groups: [] }
        }
        return null
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'filter', payload: 1, viewId: 'v1' })

    const results = resultsOf(messages)
    expect(results).toHaveLength(2)
    expect((results[1]!.payload as DataResult<number>).data).toEqual([2, 3])
    expect(results[1]!.operationVersion).toBe(1)

    const acks = acksOf(messages)
    expect(acks).toHaveLength(1)
    expect(acks[0]!.action).toBe('filter')
    expect(acks[0]!.viewId).toBe('v1')
  })

  it('uses default viewId when not specified', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake' })

    const results = resultsOf(messages)
    expect(results[0]!.viewId).toBe('default')
  })

  it('ack shares requestId with its terminal result', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
      handleAction: () => ({ data: [2], groups: [] }),
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'doSomething', viewId: 'v1' })

    const acks = acksOf(messages)
    const results = resultsOf(messages)
    expect(acks).toHaveLength(1)
    expect(acks[0]!.requestId).toBe(results[1]!.requestId)
  })

  it('caller-provided requestId is preserved through ack and result', () => {
    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
      handleAction: () => ({ data: [2], groups: [] }),
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'doSomething', viewId: 'v1', requestId: 'my-req-1' })

    const acks = acksOf(messages)
    const results = resultsOf(messages)
    expect(acks[0]!.requestId).toBe('my-req-1')
    expect(results[1]!.requestId).toBe('my-req-1')
  })
})
