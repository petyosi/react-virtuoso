import { describe, expect, it } from 'vitest'

import { localModel } from '../../../src/model/local-model'

import type { DataResult, MessageEnvelope } from '../../../src/model/types'

describe(localModel, () => {
  it('produces a result on handshake with the provided data', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i }))
    const model = localModel({ data: items })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })

    expect(messages).toHaveLength(1)
    const result = messages[0]!
    expect(result.type).toBe('result')
    expect(result.viewId).toBe('v1')
    expect(result.operationVersion).toBe(0)
    expect(result.dataVersion).toBe(1)

    const payload = result.payload as DataResult<{ id: number }>
    expect(payload.data).toHaveLength(10)
    expect(payload.data[0]).toEqual({ id: 0 })
    expect(payload.data[9]).toEqual({ id: 9 })
    expect(payload.groups).toEqual([])
  })

  it('passes through groups', () => {
    const groups = [
      { index: 0, level: 0 },
      { index: 5, level: 0 },
    ]
    const model = localModel({ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], groups })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })

    const payload = messages[0]!.payload as DataResult<number>
    expect(payload.groups).toEqual(groups)
  })

  it('setData triggers a new result with updated data', () => {
    const model = localModel({ data: [1, 2, 3] })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake' })

    model.setData!([4, 5])

    expect(messages).toHaveLength(2)
    const payload = messages[1]!.payload as DataResult<number>
    expect(payload.data).toEqual([4, 5])
  })

  it('disconnect stops further emissions for that view', () => {
    const model = localModel({ data: [1] })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'disconnect', viewId: 'v1' })

    // re-handshake creates a fresh view
    model.send({ action: 'handshake', viewId: 'v1' })
    expect(messages).toHaveLength(2)
    expect(messages[1]!.dataVersion).toBe(1)
  })

  it('destroy prevents further messages', () => {
    const model = localModel({ data: [1] })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))

    model.destroy()
    model.send({ action: 'handshake' })

    expect(messages).toHaveLength(0)
  })
})
