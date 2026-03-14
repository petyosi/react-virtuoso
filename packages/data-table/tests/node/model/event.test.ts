import { describe, expect, it } from 'vitest'

import { createModel } from '../../../src/model/model-core'

import type { EventEmitter, FrameAdapter, MessageEnvelope } from '../../../src/model/types'

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

function eventsOf(messages: MessageEnvelope[]) {
  return messages.filter((m) => m.type === 'event')
}

function resultsOf(messages: MessageEnvelope[]) {
  return messages.filter((m) => m.type === 'result')
}

describe('event emission', () => {
  it('adapter can emit events via setEventEmitter', () => {
    let emitEvent: EventEmitter | null = null

    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
      setEventEmitter(emitter) {
        emitEvent = emitter
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })

    emitEvent!('v1', { kind: 'row-updated', rowId: 42 })

    const events = eventsOf(messages)
    expect(events).toHaveLength(1)
    expect(events[0]!.type).toBe('event')
    expect(events[0]!.viewId).toBe('v1')
    expect(events[0]!.payload).toEqual({ kind: 'row-updated', rowId: 42 })
  })

  it('event has no requestId', () => {
    let emitEvent: EventEmitter | null = null

    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
      setEventEmitter(emitter) {
        emitEvent = emitter
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    emitEvent!('v1', { update: true })

    const events = eventsOf(messages)
    expect(events[0]!.requestId).toBe('')
  })

  it('event increments dataVersion but not operationVersion', () => {
    let emitEvent: EventEmitter | null = null

    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
      handleAction: () => ({ data: [2], groups: [] }),
      setEventEmitter(emitter) {
        emitEvent = emitter
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })

    const resultBeforeEvent = resultsOf(messages)[0]!
    const dataVersionBefore = resultBeforeEvent.dataVersion!

    emitEvent!('v1', { update: true })

    const events = eventsOf(messages)
    expect(events[0]!.dataVersion).toBe(dataVersionBefore + 1)

    // Now send an action -- operationVersion should still be 0 before this action increments it
    model.send({ action: 'doSomething', viewId: 'v1' })

    const lastResult = resultsOf(messages).at(-1)!
    expect(lastResult.operationVersion).toBe(1)
    expect(lastResult.dataVersion).toBe(dataVersionBefore + 2)
  })

  it('event for nonexistent view is a no-op', () => {
    let emitEvent: EventEmitter | null = null

    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
      setEventEmitter(emitter) {
        emitEvent = emitter
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    emitEvent!('nonexistent', { update: true })

    expect(eventsOf(messages)).toHaveLength(0)
  })

  it('event is not emitted after destroy', () => {
    let emitEvent: EventEmitter | null = null

    const adapter: FrameAdapter<number> = {
      handleHandshake: () => ({ data: [1], groups: [] }),
      setEventEmitter(emitter) {
        emitEvent = emitter
      },
    }

    const model = createModel(adapter)
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.destroy()

    emitEvent!('v1', { update: true })
    expect(eventsOf(messages)).toHaveLength(0)
  })
})
