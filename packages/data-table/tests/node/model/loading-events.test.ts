import { describe, expect, it, vi } from 'vitest'

import { remoteSource } from '../../../src/model/remote-source'
import { delay } from '../../../src/tests/utils'

import type { AppendFetchParams, FetchParams, RemoteSourceLoadingEvent } from '../../../src/model/remote-source'
import type { MessageEnvelope } from '../../../src/model/types'

interface Item {
  id: number
}

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }) {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

function loadingEvents(messages: MessageEnvelope[]) {
  return messages
    .filter((msg) => msg.type === 'event')
    .map((msg) => msg.payload as RemoteSourceLoadingEvent)
    .filter((payload) => payload.kind === 'loading')
}

describe('remoteSource loading events', () => {
  it('emits initial start and success events for offset mode handshake', async () => {
    const fetch = vi.fn(async (params: FetchParams) => {
      await delay(5)
      return {
        rows: Array.from({ length: params.limit }, (_, index) => ({ id: params.offset + index })),
        totalCount: 40,
      }
    })

    const model = remoteSource<Item>({
      fetch,
      initialParams: {},
      pageSize: 10,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(loadingEvents(messages)).toEqual(
        expect.arrayContaining([
          { kind: 'loading', reason: 'initial', phase: 'start' },
          { kind: 'loading', reason: 'initial', phase: 'success' },
        ])
      )
    })
  })

  it('emits cancel for the superseded initial fetch and starts refresh for action-driven re-fetch', async () => {
    const fetch = vi.fn(async (params: FetchParams<{ sort?: string }>) => {
      await delay(20)
      if (params.signal.aborted) {
        throw new Error('aborted')
      }
      return {
        rows: Array.from({ length: params.limit }, (_, index) => ({ id: params.offset + index })),
        totalCount: 40,
      }
    })

    const model = remoteSource<Item, { sort?: string }>({
      fetch,
      initialParams: {},
      pageSize: 10,
      actions: {
        sort: {
          handler: ({ payload, params }) => ({ ...params, sort: payload as string }),
        },
      },
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'sort', payload: 'name', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(loadingEvents(messages)).toEqual(
        expect.arrayContaining([
          { kind: 'loading', reason: 'initial', phase: 'start' },
          { kind: 'loading', reason: 'initial', phase: 'cancel' },
          { kind: 'loading', reason: 'refresh', phase: 'start' },
          { kind: 'loading', reason: 'refresh', phase: 'success' },
        ])
      )
    })
  })

  it('keeps the last resolved result visible while an append refresh is in flight', async () => {
    const fetch = vi.fn(async (params: AppendFetchParams<{ filter?: string }>) => {
      await delay(20)
      return {
        rows: Array.from({ length: params.limit }, (_, index) => ({
          id: index,
          name: params.params.filter ? `${params.params.filter}-${index}` : `item-${index}`,
        })),
        hasMore: false,
        cursor: null,
      }
    })

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
      const results = messages.filter((msg) => msg.type === 'result')
      expect(results).toHaveLength(2)
    })

    const resultsBeforeRefresh = messages.filter((msg) => msg.type === 'result').length
    model.send({ action: 'filter', payload: 'books', viewId: 'v1' })

    await delay(1)
    expect(messages.filter((msg) => msg.type === 'result')).toHaveLength(resultsBeforeRefresh)

    await vi.waitFor(() => {
      const lastResult = messages.findLast((msg) => msg.type === 'result')!.payload as { data: { name: string }[] }
      expect(lastResult.data[0]?.name).toBe('books-0')
    })
  })

  it('emits end loading error for failed append loadMore', async () => {
    let callCount = 0
    const fetch = vi.fn(async (params: AppendFetchParams) => {
      await delay(5)
      callCount++
      if (callCount === 1) {
        return {
          rows: Array.from({ length: params.limit }, (_, index) => ({ id: index })),
          hasMore: true,
          cursor: params.limit,
        }
      }
      throw new Error('transient failure')
    })

    const model = remoteSource<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(loadingEvents(messages)).toEqual(expect.arrayContaining([{ kind: 'loading', reason: 'initial', phase: 'success' }]))
    })

    model.send({ action: 'loadMore', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(loadingEvents(messages)).toEqual(
        expect.arrayContaining([
          { kind: 'loading', reason: 'end', phase: 'start' },
          { kind: 'loading', reason: 'end', phase: 'error', errorMessage: 'transient failure' },
        ])
      )
    })
  })
})
