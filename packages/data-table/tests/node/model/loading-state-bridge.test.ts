import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it, vi } from 'vitest'

import { loadingState$ } from '../../../src/core/loading'
import { bridgeModelToEngine } from '../../../src/model/model-bridge'
import { remoteSource } from '../../../src/model/remote-source'
import { viewportRange$ } from '../../../src/rows/row-state'
import { delay } from '../../../src/tests/utils'

import type { AppendFetchParams } from '../../../src/model/remote-source'

interface Item {
  id: number
  name: string
}

function createEngine() {
  const engine = new Engine()
  engine.register(viewportRange$)
  engine.register(loadingState$)
  return engine
}

describe('bridgeModelToEngine loading state', () => {
  it('derives initial and refresh loading state from remote source events', async () => {
    const fetch = vi.fn(async (params: AppendFetchParams<{ filter?: string }>) => {
      await delay(20)
      const rows = Array.from({ length: params.limit }, (_, index) => ({
        id: index,
        name: params.params.filter ? `${params.params.filter}-${index}` : `item-${index}`,
      }))

      return {
        rows,
        hasMore: false,
        cursor: null,
      }
    })

    const model = remoteSource<Item, { filter?: string }>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
      actions: {
        filter: {
          handler: ({ payload, params }) => ({ ...params, filter: payload as string }),
        },
      },
    })

    const engine = createEngine()
    bridgeModelToEngine(model, engine, 'default')

    await vi.waitFor(() => {
      expect(engine.getValue(loadingState$).initial.status).toBe('loading')
    })

    await vi.waitFor(() => {
      expect(engine.getValue(loadingState$).initial.status).toBe('idle')
    })

    model.send({ action: 'filter', payload: 'books', viewId: 'default' })

    await vi.waitFor(() => {
      expect(engine.getValue(loadingState$).refresh.status).toBe('loading')
    })

    await vi.waitFor(() => {
      expect(engine.getValue(loadingState$).refresh.status).toBe('idle')
    })

    engine.dispose()
  })

  it('surfaces end-of-list loading failures on the end segment', async () => {
    const fetch = vi.fn(async (params: AppendFetchParams) => {
      await delay(20)
      const startIndex = (params.cursor as number | undefined) ?? 0

      if (startIndex > 0) {
        throw new Error('load more failed')
      }

      return {
        rows: Array.from({ length: params.limit }, (_, index) => ({
          id: index,
          name: `item-${index}`,
        })),
        hasMore: true,
        cursor: params.limit,
      }
    })

    const model = remoteSource<Item>({
      mode: 'append',
      fetch,
      initialParams: {},
      pageSize: 10,
    })

    const engine = createEngine()
    bridgeModelToEngine(model, engine, 'default')

    await vi.waitFor(() => {
      expect(engine.getValue(loadingState$).initial.status).toBe('idle')
    })

    model.send({ action: 'loadMore', viewId: 'default' })

    await vi.waitFor(() => {
      expect(engine.getValue(loadingState$).end.status).toBe('loading')
    })

    await vi.waitFor(() => {
      expect(engine.getValue(loadingState$).end).toStrictEqual({
        status: 'error',
        errorMessage: 'load more failed',
      })
    })

    engine.dispose()
  })
})
