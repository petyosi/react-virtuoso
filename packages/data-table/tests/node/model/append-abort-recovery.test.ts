import { describe, expect, it, vi } from 'vitest'

import { remoteModel } from '../../../src/model/remote-model'
import { delay } from '../../../src/tests/utils'

import type { AppendFetchParams } from '../../../src/model/remote-model'
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

describe('append mode: abort recovery (bug 6.8)', () => {
  it('loadMore works after a cancelled fetch resolves with data', async () => {
    const resolvers: ((value: { rows: Item[]; hasMore: boolean; cursor: number }) => void)[] = []
    let callCount = 0

    const fetchFn = vi.fn((_params: AppendFetchParams) => {
      callCount++
      const { promise, resolve } = Promise.withResolvers<{ rows: Item[]; hasMore: boolean; cursor: number }>()
      resolvers.push(resolve)
      return promise
    })

    const model = remoteModel<Item>({
      mode: 'append',
      fetch: fetchFn,
      initialParams: {},
      pageSize: 5,
    })

    const messages = collectMessages(model)
    model.send({ action: 'handshake', viewId: 'v1' })

    // Resolve initial fetch (handshake triggers doFetch internally)
    resolvers[0]!({
      rows: Array.from({ length: 5 }, (_, i) => ({ id: i, name: `item-${i}` })),
      hasMore: true,
      cursor: 0,
    })

    await vi.waitFor(() => {
      expect(resultMessages(messages)).toHaveLength(2)
    })
    expect(callCount).toBe(1)

    // Start a loadMore with a known requestId so we can cancel it
    model.send({ action: 'loadMore', viewId: 'v1', requestId: 'lm-1' })
    expect(callCount).toBe(2)

    // Cancel the in-flight loadMore request.
    // handleCancel aborts the controller but does NOT reset vd.fetching.
    model.send({ action: 'cancel', viewId: 'v1', payload: { requestId: 'lm-1' } })

    // The fetch resolves AFTER abort (response was already in transit).
    // doFetch sees controller.signal.aborted → early return → vd.fetching stays true.
    resolvers[1]!({
      rows: Array.from({ length: 5 }, (_, i) => ({ id: i + 5, name: `item-${i + 5}` })),
      hasMore: true,
      cursor: 1,
    })

    await delay(10)

    // Now try another loadMore. This should trigger a real fetch (callCount → 3).
    // BUG: vd.fetching is stuck at true, so doFetch's guard blocks all future fetches.
    model.send({ action: 'loadMore', viewId: 'v1' })

    await vi.waitFor(() => {
      expect(callCount).toBe(3)
    })

    // Resolve the recovery fetch
    resolvers[2]!({
      rows: Array.from({ length: 3 }, (_, i) => ({ id: i + 10, name: `item-${i + 10}` })),
      hasMore: false,
      cursor: 2,
    })

    await vi.waitFor(() => {
      const results = resultMessages(messages)
      const lastResult = results.at(-1)!.payload as DataResult<Item>
      // Initial 5 + recovered 3 = 8
      // (the cancelled page's data should NOT be appended)
      expect(lastResult.data).toHaveLength(8)
    })

    model.destroy()
  })
})
