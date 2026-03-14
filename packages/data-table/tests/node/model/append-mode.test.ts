import { describe, expect, it, vi } from 'vitest'

import { remoteSource } from '../../../src/model/remote-source'
import { delay } from '../../../src/tests/utils'

import type { AppendFetchParams } from '../../../src/model/remote-source'
import type { DataResult, MessageEnvelope } from '../../../src/model/types'

interface Item {
  id: number
  name: string
}

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

function resultMessages(messages: MessageEnvelope[]): MessageEnvelope[] {
  return messages.filter((m) => m.type === 'result')
}

function createMockAppendFetch(pages: Item[][], delayMs = 0) {
  let pageIndex = 0
  const calls: AppendFetchParams[] = []

  const fetch = vi.fn(async (params: AppendFetchParams) => {
    calls.push(params)
    if (delayMs > 0) {
      await delay(delayMs)
    }
    if (params.signal.aborted) {
      throw new Error('aborted')
    }

    const currentPage = pages[pageIndex] ?? []
    const cursor = pageIndex
    pageIndex++
    const hasMore = pageIndex < pages.length

    return { rows: currentPage, hasMore, cursor }
  })

  return { fetch, calls, resetPageIndex: () => (pageIndex = 0) }
}

describe('remoteSource append mode', () => {
  it('initial fetch with cursor=undefined', async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `item-${i}` }))
    const { fetch, calls } = createMockAppendFetch([page1, []])

    const model = remoteSource<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    // Sync handshake returns empty
    expect(resultMessages(messages)).toHaveLength(1)
    expect((resultMessages(messages).at(0)!.payload as DataResult<Item>).data).toHaveLength(0)

    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(2)
    })

    // First fetch uses cursor=undefined
    expect(calls.at(0)!.cursor).toBeUndefined()

    const result = resultMessages(messages).at(-1)!.payload as DataResult<Item>
    expect(result.data).toHaveLength(10)
    expect(result.data.at(0)!.id).toBe(0)
  })

  it('loadMore fetches next page with current cursor', async () => {
    const page1 = Array.from({ length: 5 }, (_, i) => ({ id: i, name: `item-${i}` }))
    const page2 = Array.from({ length: 5 }, (_, i) => ({ id: i + 5, name: `item-${i + 5}` }))
    const { fetch, calls } = createMockAppendFetch([page1, page2, []])

    const model = remoteSource<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 5,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(2)
    })

    // Send loadMore to fetch page 2
    model.send({ action: 'loadMore', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(3)
    })

    // Second fetch uses cursor from first fetch
    expect(calls.at(1)!.cursor).toBe(0)

    const result = resultMessages(messages).at(-1)!.payload as DataResult<Item>
    expect(result.data).toHaveLength(10)
    expect(result.data.at(9)!.id).toBe(9)
  })

  it('hasMore=false prevents further fetches', async () => {
    const page1 = [{ id: 0, name: 'only-item' }]
    const { fetch } = createMockAppendFetch([page1])

    const model = remoteSource<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(2)
    })

    // hasMore is false (only one page), loadMore should not fetch
    model.send({ action: 'loadMore', viewId: 'v1' })

    // Wait a tick to ensure no fetch fires
    await delay(10)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('param change resets cursor and re-fetches from beginning', async () => {
    const page1 = Array.from({ length: 5 }, (_, i) => ({ id: i, name: `item-${i}` }))
    const { fetch, calls, resetPageIndex } = createMockAppendFetch([page1, page1])

    const model = remoteSource<Item, { filter?: string }>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 5,
      actions: {
        filter: {
          handler: ({ payload, params }) => ({ ...params, filter: payload as string }),
        },
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(2)
    })

    resetPageIndex()
    model.send({ action: 'filter', payload: 'test', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    // After param change, cursor should be reset to undefined
    const lastCall = calls.at(-1)!
    expect(lastCall.cursor).toBeUndefined()
    expect((lastCall.params as { filter?: string }).filter).toBe('test')
  })

  it('rapid loadMore deduplication (fetching guard)', async () => {
    const page1 = Array.from({ length: 5 }, (_, i) => ({ id: i, name: `item-${i}` }))
    const page2 = Array.from({ length: 5 }, (_, i) => ({ id: i + 5, name: `item-${i + 5}` }))
    const { fetch } = createMockAppendFetch([page1, page2, []], 50)

    const model = remoteSource<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 5,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(2)
    })

    // Send multiple loadMore rapidly
    model.send({ action: 'loadMore', viewId: 'v1' })
    model.send({ action: 'loadMore', viewId: 'v1' })
    model.send({ action: 'loadMore', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(3)
    })

    // Only one additional fetch should have been made (deduplication via fetching guard)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
