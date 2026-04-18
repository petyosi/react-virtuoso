import { describe, expect, it, vi } from 'vitest'

import { remoteSource } from '../../../src/model/remote-source'

import type { FetchParams } from '../../../src/model/remote-source'
import type { DataResult, MessageEnvelope } from '../../../src/model/types'

interface Item {
  id: number
  name: string
}

function makeItems(offset: number, count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: offset + i, name: `item-${offset + i}` }))
}

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

describe('remote source error propagation', () => {
  describe('offset mode', () => {
    it('emits an error message when initial fetch rejects', async () => {
      const fetch = vi.fn((_params: FetchParams) => {
        return Promise.reject(new Error('Network error: connection refused'))
      })

      const model = remoteSource<Item>({
        fetch,
        initialParams: {},
        pageSize: 20,
      })

      const messages = collectMessages(model)
      model.send({ action: 'handshake', viewId: 'v1' })

      await vi.waitFor(() => {
        const errorMessages = messages.filter((m) => m.type === 'error')
        expect(errorMessages).toHaveLength(1)
        expect(errorMessages[0]!.error!.message).toBe('Network error: connection refused')
      })
    })

    it('emits an error message when action-triggered re-fetch rejects', async () => {
      let callCount = 0
      const fetch = vi.fn((params: FetchParams) => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ rows: makeItems(params.offset, Math.min(params.limit, 100 - params.offset)), totalCount: 100 })
        }
        return Promise.reject(new Error('Server error: 500 Internal Server Error'))
      })

      const model = remoteSource<Item>({
        fetch,
        initialParams: {},
        pageSize: 20,
        actions: {
          sort: {
            handler: ({ payload, params }) => ({ ...params, sort: payload as string }),
          },
        },
      })

      const messages = collectMessages(model)
      model.send({ action: 'handshake', viewId: 'v1' })

      await vi.waitFor(() => {
        const results = messages.filter((m) => m.type === 'result')
        expect(results.length).toBeGreaterThanOrEqual(2)
      })

      model.send({ action: 'sort', payload: 'name', viewId: 'v1' })

      await vi.waitFor(() => {
        const errorMessages = messages.filter((m) => m.type === 'error')
        expect(errorMessages).toHaveLength(1)
        expect(errorMessages[0]!.error!.message).toBe('Server error: 500 Internal Server Error')
      })
    })

    it('reverts to last known-good data when loadRange fetch fails', async () => {
      let callCount = 0
      const fetch = vi.fn((params: FetchParams) => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ rows: makeItems(params.offset, Math.min(params.limit, 100 - params.offset)), totalCount: 100 })
        }
        return Promise.reject(new Error('fetch failed'))
      })

      const model = remoteSource<Item>({
        fetch,
        initialParams: {},
        pageSize: 50,
      })

      const messages = collectMessages(model)
      model.send({ action: 'handshake', viewId: 'v1' })

      await vi.waitFor(() => {
        const results = messages.filter((m) => m.type === 'result')
        expect(results.length).toBeGreaterThanOrEqual(2)
      })

      const preErrorResults = messages.filter((m) => m.type === 'result')
      const lastGoodData = (preErrorResults.at(-1)!.payload as DataResult<Item>).data

      // loadRange returns null (async-only), so lastKnownGood is preserved
      model.send({ action: 'loadRange', payload: { offset: 60, limit: 20 }, viewId: 'v1' })

      await vi.waitFor(() => {
        const errorMessages = messages.filter((m) => m.type === 'error')
        expect(errorMessages).toHaveLength(1)
      })

      // After the error, the model reverts to the last known-good state
      const postErrorResults = messages.filter((m) => m.type === 'result')
      const revertData = (postErrorResults.at(-1)!.payload as DataResult<Item>).data
      expect(revertData).toEqual(lastGoodData)
    })
  })

  describe('append mode', () => {
    it('emits an error message when append fetch rejects', async () => {
      const fetch = vi.fn(() => {
        return Promise.reject(new Error('Network timeout'))
      })

      const model = remoteSource<Item>({
        mode: 'append',
        fetch,
        initialParams: {},
        pageSize: 20,
      })

      const messages = collectMessages(model)
      model.send({ action: 'handshake', viewId: 'v1' })

      await vi.waitFor(() => {
        const errorMessages = messages.filter((m) => m.type === 'error')
        expect(errorMessages).toHaveLength(1)
        expect(errorMessages[0]!.error!.message).toBe('Network timeout')
      })
    })

    it('allows retry after a failed loadMore', async () => {
      let callCount = 0
      const fetch = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ rows: makeItems(0, 10), hasMore: true, cursor: 'page2' })
        }
        if (callCount === 2) {
          return Promise.reject(new Error('transient failure'))
        }
        return Promise.resolve({ rows: makeItems(10, 10), hasMore: false, cursor: null })
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
        const results = messages.filter((m) => m.type === 'result')
        const lastResult = results.at(-1)?.payload as DataResult<Item> | undefined
        expect(lastResult?.data).toHaveLength(10)
      })

      model.send({ action: 'loadMore', viewId: 'v1' })

      await vi.waitFor(() => {
        const errorMessages = messages.filter((m) => m.type === 'error')
        expect(errorMessages).toHaveLength(1)
      })

      // After error, fetching state is cleared so retry works
      model.send({ action: 'loadMore', viewId: 'v1' })

      await vi.waitFor(() => {
        const results = messages.filter((m) => m.type === 'result')
        const lastResult = results.at(-1)!.payload as DataResult<Item>
        expect(lastResult.data).toHaveLength(20)
      })
    })
  })

  describe('onError callback', () => {
    it('calls onError with the Error object for real failures', async () => {
      const onError = vi.fn()
      const fetch = vi.fn((_params: FetchParams) => {
        return Promise.reject(new Error('server down'))
      })

      const model = remoteSource<Item>({
        fetch,
        initialParams: {},
        onError,
      })

      collectMessages(model)
      model.send({ action: 'handshake', viewId: 'v1' })

      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalledOnce()
      })

      const receivedError = onError.mock.calls[0]![0] as Error
      expect(receivedError).toBeInstanceOf(Error)
      expect(receivedError.message).toBe('server down')
    })

    it('does NOT call onError when fetch is aborted', async () => {
      const onError = vi.fn()
      const fetch = vi.fn(async (params: FetchParams) => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50)
        })
        if (params.signal.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError')
        }
        return { rows: makeItems(0, 10), totalCount: 10 }
      })

      const model = remoteSource<Item>({
        fetch,
        initialParams: {},
        pageSize: 10,
        onError,
        actions: {
          sort: {
            handler: ({ payload, params }) => ({ ...params, sort: payload as string }),
          },
        },
      })

      const messages = collectMessages(model)
      model.send({ action: 'handshake', viewId: 'v1' })
      // Abort the handshake fetch by sending sort immediately
      model.send({ action: 'sort', payload: 'asc', viewId: 'v1' })

      await vi.waitFor(() => {
        const results = messages.filter((m) => m.type === 'result')
        expect(results.length).toBeGreaterThanOrEqual(2)
      })

      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('abort vs real error distinction', () => {
    it('does NOT emit an error message when fetch is aborted (abort is not a failure)', async () => {
      const fetch = vi.fn(async (params: FetchParams) => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50)
        })
        if (params.signal.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError')
        }
        return { rows: makeItems(0, 10), totalCount: 100 }
      })

      const model = remoteSource<Item>({
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

      // Immediately send sort, which aborts the handshake fetch
      model.send({ action: 'sort', payload: 'asc', viewId: 'v1' })

      // Wait for the sort fetch to complete
      await vi.waitFor(() => {
        const results = messages.filter((m) => m.type === 'result')
        expect(results.length).toBeGreaterThanOrEqual(2)
      })

      const errorMessages = messages.filter((m) => m.type === 'error')
      expect(errorMessages).toHaveLength(0)
    })
  })
})
