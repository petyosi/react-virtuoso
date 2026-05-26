import { describe, expect, it, vi } from 'vitest'

import { remoteModel } from '../../../src/model/remote-model'
import { delay } from '../../../src/tests/utils'

import type { AppendFetchParams, AppendViewportContext, FetchParams, OffsetViewportContext } from '../../../src/model/remote-model'
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

describe('offset mode viewportChange', () => {
  it('handler receives correct context', async () => {
    const { fetch } = createMockFetch(100)
    const handlerCalls: unknown[] = []
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
      placeholder: { id: -1, name: 'loading' },
      onViewportChange: (ctx) => {
        handlerCalls.push(ctx)
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 9 }, viewId: 'v1' })

    expect(handlerCalls).toHaveLength(1)
    expect(handlerCalls[0]).toEqual({
      startIndex: 0,
      endIndex: 9,
      totalCount: 100,
      loadedRanges: [{ offset: 0, limit: 20 }],
      params: {},
      pageSize: 20,
    })
  })

  it('handler returning fetch triggers fetch calls', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
      placeholder: { id: -1, name: 'loading' },
      onViewportChange: () => ({ fetch: [{ offset: 40, limit: 20 }] }),
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 40, endIndex: 59 }, viewId: 'v1' })

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(fetch).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 40, limit: 20 }))
  })

  it('handler returning void does not fetch', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
      onViewportChange: () => {},
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 9 }, viewId: 'v1' })

    expect(fetch).toHaveBeenCalledOnce()
  })

  it('no handler means no-op', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 40, endIndex: 59 }, viewId: 'v1' })

    await delay(10)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('skips already-loaded ranges', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 50,
      onViewportChange: () => ({ fetch: [{ offset: 0, limit: 20 }] }),
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 19 }, viewId: 'v1' })

    await delay(10)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('fetches after param change invalidates ranges', async () => {
    const { fetch } = createMockFetch(100)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
      onViewportChange: () => ({ fetch: [{ offset: 0, limit: 20 }] }),
      actions: {
        sort: { handler: ({ payload, params }) => ({ ...params, sort: payload as string }) },
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'sort', payload: 'name', viewId: 'v1' })
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))

    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(3))

    model.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 19 }, viewId: 'v1' })

    await delay(10)
    // No additional fetch since sort already re-fetched [0,20]
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('fetches multiple gaps in parallel', async () => {
    const { fetch } = createMockFetch(200, 10)
    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
      placeholder: { id: -1, name: 'loading' },
      onViewportChange: () => ({
        fetch: [
          { offset: 20, limit: 20 },
          { offset: 60, limit: 20 },
        ],
      }),
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 20, endIndex: 79 }, viewId: 'v1' })

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

    await vi.waitFor(() => {
      const lastResult = resultMessages(messages).at(-1)!.payload as DataResult<Item>
      expect(lastResult.data[20]!.id).toBe(20)
      expect(lastResult.data[60]!.id).toBe(60)
    })
  })

  it('parallel viewport fetches do not cancel each other', async () => {
    const signals: AbortSignal[] = []
    const fetch = vi.fn(async (params: FetchParams) => {
      signals.push(params.signal)
      await delay(20)
      if (params.signal.aborted) {
        throw new Error('aborted')
      }
      return { rows: makeItems(params.offset, params.limit), totalCount: 200 }
    })

    const model = remoteModel<Item>({
      fetch,
      initialParams: {},
      pageSize: 20,
      placeholder: { id: -1, name: 'loading' },
      onViewportChange: (ctx: OffsetViewportContext) => {
        if (ctx.startIndex >= 20) {
          return { fetch: [{ offset: ctx.startIndex, limit: 20 }] }
        }
        // oxlint-disable-next-line no-useless-return -- required for noImplicitReturns
        return
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 20, endIndex: 39 }, viewId: 'v1' })
    model.send({ action: 'viewportChange', payload: { startIndex: 40, endIndex: 59 }, viewId: 'v1' })

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

    await vi.waitFor(() => {
      // viewport fetch signals (indices 1 and 2) should not be aborted
      expect(signals[1]!.aborted).toBeFalsy()
      expect(signals[2]!.aborted).toBeFalsy()
    })
  })
})

describe('append mode viewportChange', () => {
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
    return { fetch, calls }
  }

  it('handler receives correct context', async () => {
    const page1 = makeItems(0, 10)
    const { fetch } = createMockAppendFetch([page1, []])
    const handlerCalls: unknown[] = []

    const model = remoteModel<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
      onViewportChange: (ctx) => {
        handlerCalls.push(ctx)
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 9 }, viewId: 'v1' })

    expect(handlerCalls).toHaveLength(1)
    expect(handlerCalls[0]).toEqual({
      startIndex: 0,
      endIndex: 9,
      loadedCount: 10,
      hasMore: true,
      fetching: false,
      params: {},
      pageSize: 10,
    })
  })

  it('handler returning loadMore triggers fetch', async () => {
    const page1 = makeItems(0, 10)
    const page2 = makeItems(10, 10)
    const { fetch } = createMockAppendFetch([page1, page2, []])

    const model = remoteModel<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
      onViewportChange: () => ({ loadMore: true }),
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 5, endIndex: 9 }, viewId: 'v1' })

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  })

  it('handler returning void does not fetch', async () => {
    const page1 = makeItems(0, 10)
    const { fetch } = createMockAppendFetch([page1, []])

    const model = remoteModel<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
      onViewportChange: () => {},
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 9 }, viewId: 'v1' })

    await delay(10)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('no handler means no-op', async () => {
    const page1 = makeItems(0, 10)
    const { fetch } = createMockAppendFetch([page1, []])

    const model = remoteModel<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 5, endIndex: 9 }, viewId: 'v1' })

    await delay(10)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('handler receives fetching=true when fetch is in-flight', async () => {
    const page1 = makeItems(0, 10)
    const page2 = makeItems(10, 10)
    const { fetch } = createMockAppendFetch([page1, page2, []], 30)
    const handlerCalls: unknown[] = []

    const model = remoteModel<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
      onViewportChange: (ctx: AppendViewportContext) => {
        handlerCalls.push({ ...ctx })
        if (!ctx.fetching) {
          return { loadMore: true }
        }
        // oxlint-disable-next-line no-useless-return -- required for noImplicitReturns
        return
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 5, endIndex: 9 }, viewId: 'v1' })
    model.send({ action: 'viewportChange', payload: { startIndex: 5, endIndex: 9 }, viewId: 'v1' })

    expect(handlerCalls).toHaveLength(2)
    expect((handlerCalls[0] as { fetching: boolean }).fetching).toBeFalsy()
    expect((handlerCalls[1] as { fetching: boolean }).fetching).toBe(true)
  })

  it('handler receives hasMore=false after exhaustion', async () => {
    const page1 = makeItems(0, 5)
    const { fetch } = createMockAppendFetch([page1])
    const handlerCalls: unknown[] = []

    const model = remoteModel<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
      onViewportChange: (ctx) => {
        handlerCalls.push({ ...ctx })
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    await vi.waitFor(() => expect(resultMessages(messages)).toHaveLength(2))

    model.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 4 }, viewId: 'v1' })

    expect(handlerCalls).toHaveLength(1)
    expect((handlerCalls[0] as { hasMore: boolean }).hasMore).toBeFalsy()
  })
})
