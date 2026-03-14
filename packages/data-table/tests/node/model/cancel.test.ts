import { describe, expect, it, vi } from 'vitest'

import { createModel } from '../../../src/model/model-core'
import { remoteSource } from '../../../src/model/remote-source'

import type { FrameAdapter, MessageEnvelope } from '../../../src/model/types'

function collectMessages(model: { subscribe: (fn: (msg: MessageEnvelope) => void) => () => void }): MessageEnvelope[] {
  const messages: MessageEnvelope[] = []
  model.subscribe((msg) => messages.push(msg))
  return messages
}

function cancelsOf(messages: MessageEnvelope[]) {
  return messages.filter((m) => m.type === 'cancel')
}

describe('cancel', () => {
  describe('subscriber-initiated cancel', () => {
    it('emits cancel confirmation for in-flight request', () => {
      const adapter: FrameAdapter<number> = {
        handleHandshake: () => ({ data: [1], groups: [] }),
        handleAction: () => null,
        handleCancel: vi.fn(),
      }

      const model = createModel(adapter)
      const messages = collectMessages(model)

      model.send({ action: 'handshake', viewId: 'v1' })
      model.send({ action: 'fetch', viewId: 'v1', requestId: 'req-1' })
      model.send({ action: 'cancel', viewId: 'v1', payload: { requestId: 'req-1' } })

      const cancels = cancelsOf(messages)
      expect(cancels).toHaveLength(1)
      expect(cancels[0]!.requestId).toBe('req-1')
      expect(cancels[0]!.viewId).toBe('v1')
      expect(adapter.handleCancel).toHaveBeenCalledWith('v1', 'req-1')
    })

    it('cancel for unknown requestId is a no-op', () => {
      const handleCancel = vi.fn()
      const adapter: FrameAdapter<number> = {
        handleHandshake: () => ({ data: [1], groups: [] }),
        handleCancel,
      }

      const model = createModel(adapter)
      const messages = collectMessages(model)

      model.send({ action: 'handshake', viewId: 'v1' })
      model.send({ action: 'cancel', viewId: 'v1', payload: { requestId: 'nonexistent' } })

      expect(cancelsOf(messages)).toHaveLength(0)
      expect(handleCancel).not.toHaveBeenCalled()
    })

    it('cancel without requestId payload is a no-op', () => {
      const adapter: FrameAdapter<number> = {
        handleHandshake: () => ({ data: [1], groups: [] }),
      }

      const model = createModel(adapter)
      const messages = collectMessages(model)

      model.send({ action: 'handshake', viewId: 'v1' })
      model.send({ action: 'cancel', viewId: 'v1' })

      expect(cancelsOf(messages)).toHaveLength(0)
    })
  })

  describe('model-initiated cancel (supersede)', () => {
    it('superseding an async in-flight request emits cancel for the old request', () => {
      const adapter: FrameAdapter<number> = {
        handleHandshake: () => ({ data: [1], groups: [] }),
        handleAction: () => null,
      }

      const model = createModel(adapter)
      const messages = collectMessages(model)

      model.send({ action: 'handshake', viewId: 'v1' })
      model.send({ action: 'sort', viewId: 'v1', requestId: 'sort-1' })
      model.send({ action: 'sort', viewId: 'v1', requestId: 'sort-2' })

      const cancels = cancelsOf(messages)
      expect(cancels).toHaveLength(1)
      expect(cancels[0]!.requestId).toBe('sort-1')
      expect(cancels[0]!.action).toBe('sort')
    })

    it('supersede cancel does not fire when previous request already completed', () => {
      const adapter: FrameAdapter<number> = {
        handleHandshake: () => ({ data: [1], groups: [] }),
        handleAction: () => ({ data: [2], groups: [] }),
      }

      const model = createModel(adapter)
      const messages = collectMessages(model)

      model.send({ action: 'handshake', viewId: 'v1' })
      model.send({ action: 'sort', viewId: 'v1', requestId: 'sort-1' })
      model.send({ action: 'sort', viewId: 'v1', requestId: 'sort-2' })

      expect(cancelsOf(messages)).toHaveLength(0)
    })
  })

  describe('cancel with remote source', () => {
    it('param-changing action aborts in-flight fetch', () => {
      const fetchFn = vi.fn(({ signal }: { signal: AbortSignal }) => {
        const { promise, resolve, reject } = Promise.withResolvers<{ rows: { id: number }[]; totalCount: number }>()
        const timeout = setTimeout(() => resolve({ rows: [{ id: 1 }], totalCount: 1 }), 100)
        signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject(new Error('aborted'))
        })
        return promise
      })

      const model = remoteSource<{ id: number }, { sort?: string }>({
        fetch: fetchFn,
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

      expect(fetchFn).toHaveBeenCalledOnce()
      const firstSignal = fetchFn.mock.calls[0]![0].signal

      model.send({ action: 'sort', viewId: 'v1', payload: 'name', requestId: 'sort-1' })

      expect(firstSignal.aborted).toBe(true)

      model.destroy()
    })
  })
})
