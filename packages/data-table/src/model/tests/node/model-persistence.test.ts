import { describe, expect, it, vi } from 'vitest'

import { localSource } from '../../local-source'
import { remoteSource } from '../../remote-source'

import type { DataResult } from '../../types'
import type { PipelineHandler } from '../../local-source'

interface Item {
  id: number
  name: string
  status: string
  value: number
}

interface Params {
  dataset?: string
  filterStatus?: string
  sortBy?: string
}

const ITEMS: Item[] = [
  { id: 1, name: 'Beta', status: 'open', value: 2 },
  { id: 2, name: 'Alpha', status: 'done', value: 1 },
]

const fetchResult = { rows: ITEMS, totalCount: ITEMS.length }

const sortHandler: PipelineHandler<Item> = ({ data, payload }) => {
  const field = payload as keyof Item | undefined
  if (!field) {
    return data
  }
  return data.toSorted((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
}

const filterHandler: PipelineHandler<Item> = ({ data, payload }) => {
  const status = payload as string | undefined
  if (!status) {
    return data
  }
  return data.filter((item) => item.status === status)
}

async function waitForResult<T>(results: DataResult<T>[]) {
  await expect.poll(() => results.length).toBeGreaterThan(0)
  return latestResult(results)
}

function latestResult<T>(results: DataResult<T>[]) {
  return results.at(-1)!
}

describe('model persistence', () => {
  it('captures only persisted remote actions', () => {
    const model = remoteSource<Item, Params>({
      initialParams: {},
      fetch: vi.fn(() => Promise.resolve(fetchResult)),
      actions: {
        dataset: {
          handler: ({ payload, params }) => ({ ...params, dataset: payload as string }),
        },
        sort: {
          handler: ({ payload, params }) => ({ ...params, sortBy: payload as string }),
          persistence: true,
        },
      },
    })

    model.send({ action: 'dataset', payload: 'archive' })
    model.send({ action: 'sort', payload: 'name' })

    expect(model.persistence?.capture('default', null)).toStrictEqual({
      version: 1,
      actions: {
        sort: 'name',
      },
    })
  })

  it('restores remote persisted actions by applying handlers to initial params', () => {
    const fetch = vi.fn(() => Promise.resolve(fetchResult))
    const model = remoteSource<Item, Params>({
      initialParams: { dataset: 'active' },
      fetch,
      actions: {
        sort: {
          handler: ({ payload, params }) => ({ ...params, sortBy: payload as string }),
          persistence: true,
        },
        status: {
          handler: ({ payload, params }) => ({ ...params, filterStatus: payload as string }),
          persistence: { key: 'filterStatus' },
        },
      },
    })

    model.persistence?.restore('default', {
      version: 1,
      actions: {
        filterStatus: 'open',
        sort: 'name',
      },
    })
    model.send({ action: 'handshake', viewId: 'default' })

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          dataset: 'active',
          filterStatus: 'open',
          sortBy: 'name',
        },
      })
    )
  })

  it('resets remote persisted actions to initial params', () => {
    const fetch = vi.fn(() => Promise.resolve(fetchResult))
    const model = remoteSource<Item, Params>({
      initialParams: { dataset: 'active' },
      fetch,
      actions: {
        sort: {
          handler: ({ payload, params }) => ({ ...params, sortBy: payload as string }),
          persistence: true,
        },
      },
    })

    model.send({ action: 'sort', payload: 'name' })
    expect(model.persistence?.capture('default', null).actions).toStrictEqual({ sort: 'name' })

    model.persistence?.restore('default', null)
    expect(model.persistence?.capture('default', null).actions).toStrictEqual({})

    model.send({ action: 'handshake', viewId: 'default' })
    expect(fetch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: { dataset: 'active' },
      })
    )
  })

  it('supports custom remote action capture and restore', () => {
    const fetch = vi.fn(() => Promise.resolve(fetchResult))
    const model = remoteSource<Item, Params>({
      initialParams: {},
      fetch,
      actions: {
        filter: {
          handler: ({ payload, params }) => ({ ...params, filterStatus: (payload as { status: string }).status }),
          persistence: {
            key: 'status',
            capture: ({ payload }) => (payload as { status: string }).status,
            restore: ({ persisted, state }) => ({ ...state, filterStatus: `restored:${String(persisted)}` }),
          },
        },
      },
    })

    model.send({ action: 'filter', payload: { status: 'open', transient: true } })

    expect(model.persistence?.capture('default', null)).toStrictEqual({
      version: 1,
      actions: { status: 'open' },
    })

    model.persistence?.restore('default', { version: 1, actions: { status: 'done' } })
    model.send({ action: 'handshake', viewId: 'default' })

    expect(fetch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: { filterStatus: 'restored:done' },
      })
    )
  })

  it('passes remote group metadata through model results', async () => {
    const model = remoteSource<Item>({
      initialParams: {},
      fetch: vi.fn(() =>
        Promise.resolve({
          rows: ITEMS,
          totalCount: ITEMS.length,
          groups: [{ index: 0, level: 0 }],
        })
      ),
    })
    const results: DataResult<Item>[] = []
    model.subscribe((message) => {
      if (message.type === 'result') {
        results.push(message.payload as DataResult<Item>)
      }
    })

    model.send({ action: 'handshake', viewId: 'default' })

    const result = await waitForResult(results)
    expect(result.groups).toStrictEqual([{ index: 0, level: 0 }])
  })

  it('captures and restores local pipeline action payloads', () => {
    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter', 'sort'],
      actions: {
        filter: { stage: 'filter', handler: filterHandler, persistence: true },
        sort: { stage: 'sort', handler: sortHandler, persistence: true },
      },
    })
    const results: DataResult<Item>[] = []
    model.subscribe((message) => {
      if (message.type === 'result') {
        results.push(message.payload as DataResult<Item>)
      }
    })
    model.send({ action: 'handshake', viewId: 'default' })
    model.send({ action: 'filter', payload: 'open' })

    expect(model.persistence?.capture('default', null)).toStrictEqual({
      version: 1,
      actions: {
        filter: 'open',
      },
    })

    model.persistence?.restore('default', {
      version: 1,
      actions: {
        sort: 'name',
      },
    })

    expect(latestResult(results).data.map((item) => item.name)).toStrictEqual(['Alpha', 'Beta'])
    expect(model.persistence?.capture('default', null)).toStrictEqual({
      version: 1,
      actions: {
        sort: 'name',
      },
    })
  })
})
