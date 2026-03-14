import { describe, expect, it } from 'vitest'

import { localSource } from '../../../src/model/local-source'

import type { DataResult, MessageEnvelope } from '../../../src/model/types'

interface Item {
  id: number
  name: string
  category: string
}

const ITEMS: Item[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  name: `item-${i}`,
  category: i % 2 === 0 ? 'A' : 'B',
}))

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

function messagesForView(messages: MessageEnvelope[], viewId: string): MessageEnvelope[] {
  return messages.filter((m) => m.viewId === viewId && m.type === 'result')
}

describe('multi-view', () => {
  it('two views see the same initial data', () => {
    const model = localSource<Item>({ data: ITEMS })
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'handshake', viewId: 'v2' })

    const v1Results = messagesForView(messages, 'v1')
    const v2Results = messagesForView(messages, 'v2')

    expect(v1Results).toHaveLength(1)
    expect(v2Results).toHaveLength(1)

    const v1Data = (v1Results.at(0)!.payload as DataResult<Item>).data
    const v2Data = (v2Results.at(0)!.payload as DataResult<Item>).data

    expect(v1Data).toHaveLength(20)
    expect(v2Data).toHaveLength(20)
    expect(v1Data).toEqual(v2Data)
  })

  it('filter one view, other is unaffected', () => {
    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }: { data: Item[]; payload: unknown }) => data.filter((item) => item.category === (payload as string)),
        },
      },
    })

    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'handshake', viewId: 'v2' })

    // Filter v1 only
    model.send({ action: 'filter', payload: 'A', viewId: 'v1' })

    const v1Results = messagesForView(messages, 'v1')
    const v2Results = messagesForView(messages, 'v2')

    // v1 has handshake result + filter result
    expect(v1Results).toHaveLength(2)
    const v1Filtered = (v1Results.at(-1)!.payload as DataResult<Item>).data
    expect(v1Filtered).toHaveLength(10)
    expect(v1Filtered.every((item) => item.category === 'A')).toBe(true)

    // v2 only has handshake result, unfiltered
    expect(v2Results).toHaveLength(1)
    const v2Data = (v2Results.at(0)!.payload as DataResult<Item>).data
    expect(v2Data).toHaveLength(20)
  })

  it('disconnect last subscriber destroys view state', () => {
    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }: { data: Item[]; payload: unknown }) => data.filter((item) => item.category === (payload as string)),
        },
      },
    })

    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'filter', payload: 'A', viewId: 'v1' })
    model.send({ action: 'disconnect', viewId: 'v1' })

    // Reconnect: should get fresh state (no filter applied)
    model.send({ action: 'handshake', viewId: 'v1' })

    const v1Results = messagesForView(messages, 'v1')
    const lastResult = (v1Results.at(-1)!.payload as DataResult<Item>).data
    expect(lastResult).toHaveLength(20)
  })

  it('reconnect gives fresh state with no carryover', () => {
    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter', 'sort'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }: { data: Item[]; payload: unknown }) => data.filter((item) => item.category === (payload as string)),
        },
        sort: {
          stage: 'sort',
          handler: ({ data }: { data: Item[] }) => data.toSorted((a, b) => b.id - a.id),
        },
      },
    })

    const messages = collectMessages(model)

    // Setup view with filter and sort
    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'filter', payload: 'B', viewId: 'v1' })
    model.send({ action: 'sort', payload: 'desc', viewId: 'v1' })

    // Disconnect and reconnect
    model.send({ action: 'disconnect', viewId: 'v1' })
    model.send({ action: 'handshake', viewId: 'v1' })

    const v1Results = messagesForView(messages, 'v1')
    const lastResult = (v1Results.at(-1)!.payload as DataResult<Item>).data

    // Fresh state: all items, original order
    expect(lastResult).toHaveLength(20)
    expect(lastResult.at(0)!.id).toBe(0)
  })

  it('source mutator from one view re-runs pipeline for the acting view', () => {
    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }: { data: Item[]; payload: unknown }) => data.filter((item) => item.category === (payload as string)),
        },
        deleteItem: {
          handler: ({ source, payload }: { source: Item[]; payload: unknown }) => source.filter((item) => item.id !== (payload as number)),
        },
      },
    })

    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'handshake', viewId: 'v2' })

    // Filter v1
    model.send({ action: 'filter', payload: 'A', viewId: 'v1' })

    // Delete item from v2 (source mutator)
    model.send({ action: 'deleteItem', payload: 0, viewId: 'v2' })

    const v2Results = messagesForView(messages, 'v2')
    const v2Data = (v2Results.at(-1)!.payload as DataResult<Item>).data

    // v2 should see 19 items (one deleted), no filter applied to v2
    expect(v2Data).toHaveLength(19)
    expect(v2Data.find((item) => item.id === 0)).toBeUndefined()
  })

  it('independent dataVersions per view', () => {
    const model = localSource<Item>({ data: ITEMS })
    const messages = collectMessages(model)

    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'handshake', viewId: 'v2' })

    const v1Result = messagesForView(messages, 'v1').at(0)!
    const v2Result = messagesForView(messages, 'v2').at(0)!

    // Each view starts with dataVersion 1
    expect(v1Result.dataVersion).toBe(1)
    expect(v2Result.dataVersion).toBe(1)
  })
})
