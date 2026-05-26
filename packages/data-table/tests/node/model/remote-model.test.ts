import { describe, expect, it, vi } from 'vitest'

import { remoteModel } from '../../../src/model/remote-model'
import { delay } from '../../../src/tests/utils'

import type { FetchParams } from '../../../src/model/remote-model'
import type { DataResult, MessageEnvelope } from '../../../src/model/types'

interface Item {
  id: number
  name: string
}

function makeItems(offset: number, count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: offset + i, name: `item-${offset + i}` }))
}

function createMockFetch(totalCount: number, delayMs = 0) {
  const calls: FetchParams[] = []
  const fetch = vi.fn(async (params: FetchParams) => {
    calls.push(params)
    if (delayMs > 0) {
      await delay(delayMs)
    }
    if (params.signal.aborted) {
      throw new Error('aborted')
    }
    const rows = makeItems(params.offset, Math.min(params.limit, totalCount - params.offset))
    return { rows, totalCount }
  })
  return { fetch, calls }
}

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

function resultMessages(messages: MessageEnvelope[]): MessageEnvelope[] {
  return messages.filter((m) => m.type === 'result')
}

describe(remoteModel, () => {
  it('handshake triggers initial fetch', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    // Handshake immediately returns empty result (sync)
    expect(resultMessages(messages)).toHaveLength(1)
    expect((resultMessages(messages).at(0)!.payload as DataResult<Item>).data).toHaveLength(0)

    // Wait for async fetch to complete
    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(2)
    })

    const asyncResult = resultMessages(messages).at(-1)!.payload as DataResult<Item>
    expect(asyncResult.data).toHaveLength(100)
    expect(asyncResult.data.at(0)!.id).toBe(0)
    expect(asyncResult.data.at(19)!.id).toBe(19)
    // Items beyond the first page are undefined (placeholder)
    expect(asyncResult.data.at(20)).toBeUndefined()

    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        offset: 0,
        limit: 20,
      })
    )
  })

  it('sort action updates params and re-fetches', async () => {
    const { fetch, calls } = createMockFetch(50)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 10,
      actions: {
        sort: {
          handler: ({ payload, params }) => ({ ...params, sortBy: payload as string }),
        },
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages).length).toBeGreaterThanOrEqual(2)
    })

    model.send({ action: 'sort', payload: 'name', viewId: 'v1' })

    await vi.waitFor(() => {
      const sortCalls = calls.filter((c) => (c.params as { sortBy?: string }).sortBy === 'name')
      expect(sortCalls).toHaveLength(1)
    })

    // Verify params were passed to fetch
    const lastCall = calls.at(-1)!
    expect((lastCall.params as { sortBy?: string }).sortBy).toBe('name')
  })

  it('filter action invalidates ranges and re-fetches', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 10,
      actions: {
        filter: {
          handler: ({ payload, params }) => ({ ...params, filter: payload as string }),
        },
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages).length).toBeGreaterThanOrEqual(2)
    })

    model.send({ action: 'filter', payload: 'test', viewId: 'v1' })

    // After filter, we get an immediate empty result (ranges invalidated)
    // followed by async fetch result
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('abort: param change aborts in-flight fetch', () => {
    const signals: AbortSignal[] = []
    const fetch = vi.fn(async (params: FetchParams) => {
      signals.push(params.signal)
      await delay(50)
      if (params.signal.aborted) {
        throw new Error('aborted')
      }
      return { rows: makeItems(0, 10), totalCount: 100 }
    })

    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 10,
      actions: {
        sort: {
          handler: ({ payload, params }) => ({ ...params, sort: payload as string }),
        },
      },
    })

    collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    // Immediately send sort while handshake fetch is in-flight
    model.send({ action: 'sort', payload: 'asc', viewId: 'v1' })

    // Both fetches should have been called
    expect(signals).toHaveLength(2)
    // First fetch's signal should be aborted (superseded by sort)
    expect(signals.at(0)!.aborted).toBe(true)
    // Second fetch's signal should not be aborted
    expect(signals.at(1)!.aborted).toBeFalsy()
  })

  it('loadRange fetches missing segments', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages).length).toBeGreaterThanOrEqual(2)
    })

    // Request a range beyond the initial page
    model.send({ action: 'loadRange', payload: { offset: 40, limit: 20 }, viewId: 'v1' })

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    await vi.waitFor(() => {
      const lastResult = resultMessages(messages).at(-1)!.payload as DataResult<Item>
      expect(lastResult.data.at(40)!.id).toBe(40)
    })
  })

  it('loadRange skips already-loaded ranges', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 50,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages).length).toBeGreaterThanOrEqual(2)
    })

    // Request a range within the already-loaded range
    model.send({ action: 'loadRange', payload: { offset: 10, limit: 20 }, viewId: 'v1' })

    // Should not trigger another fetch
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('placeholder fills unloaded entries', async () => {
    const { fetch } = createMockFetch(100)
    const PLACEHOLDER: Item = { id: -1, name: 'loading...' }
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 10,
      placeholder: PLACEHOLDER,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages).length).toBeGreaterThanOrEqual(2)
    })

    const result = resultMessages(messages).at(-1)!.payload as DataResult<Item>
    // Loaded entries have real data
    expect(result.data.at(0)!.id).toBe(0)
    // Unloaded entries have placeholder
    expect(result.data.at(50)).toEqual(PLACEHOLDER)
  })

  it('destroy aborts in-flight fetches', () => {
    const signals: AbortSignal[] = []
    const fetch = vi.fn(async (params: FetchParams) => {
      signals.push(params.signal)
      await delay(100)
      if (params.signal.aborted) {
        throw new Error('aborted')
      }
      return { rows: [], totalCount: 0 }
    })

    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
    })

    collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    expect(signals).toHaveLength(1)
    model.destroy()

    expect(signals.at(0)!.aborted).toBe(true)
  })
})
