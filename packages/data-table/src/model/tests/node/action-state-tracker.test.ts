import { describe, expect, it, vi, afterEach } from 'vitest'

import { localModel } from '../../local-model'
import { remoteModel } from '../../remote-model'

import type { PipelineHandler, SourceMutator } from '../../local-model'
import type { DataResult } from '../../types'

interface Item {
  id: number
  name: string
  status: string
  value: number
}

interface ItemGroup {
  label: string
}

interface Params {
  category?: string
  query?: string
  sortBy?: string
  scopedQuery?: string
}

const ITEMS: Item[] = [
  { id: 1, name: 'Alpha', status: 'open', value: 2 },
  { id: 2, name: 'Beta', status: 'done', value: 1 },
]

const fetchResult = { rows: ITEMS, totalCount: ITEMS.length }

const passthroughHandler: PipelineHandler<Item> = ({ data }) => data

const filterHandler: PipelineHandler<Item> = ({ data, payload }) => {
  const status = payload as string | undefined
  if (!status) {
    return data
  }
  return data.filter((item) => item.status === status)
}

const appendHandler: SourceMutator<Item> = ({ source, payload }) => [...source, payload as Item]

function isItem(row: Item | ItemGroup): row is Item {
  return 'id' in row
}

const groupingHandler: PipelineHandler<Item, ItemGroup> = ({ data, payload }) => {
  const rows = data.filter(isItem)
  if (payload === 'none') {
    return rows
  }

  return {
    data: [{ label: 'Grouped items' }, ...rows],
    groups: [{ index: 0, level: 0 }],
  }
}

function latestResult<T, G = never>(results: DataResult<T, G>[]) {
  return results.at(-1)!
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('model action state tracker', () => {
  it('tracks accepted local pipeline action payloads', () => {
    const model = localModel<Item>({
      data: ITEMS,
      pipeline: ['group', 'filter'],
      actions: {
        group: { stage: 'group', handler: passthroughHandler },
        filter: { stage: 'filter', handler: filterHandler },
      },
    })

    expect(model.getActionState?.()).toStrictEqual({})

    model.send({ action: 'group', payload: 'category' })
    expect(model.getActionState?.()).toStrictEqual({
      group: { payload: 'category', viewId: 'default' },
    })

    model.send({ action: 'group', payload: 'status' })
    expect(model.getActionState?.()).toStrictEqual({
      group: { payload: 'status', viewId: 'default' },
    })

    model.send({ action: 'filter', payload: 'open' })
    expect(model.getActionState?.()).toStrictEqual({
      filter: { payload: 'open', viewId: 'default' },
      group: { payload: 'status', viewId: 'default' },
    })
  })

  it('does not track bridge-owned reserved actions', () => {
    const model = localModel<Item>({
      data: ITEMS,
      pipeline: ['filter'],
      actions: {
        filter: { stage: 'filter', handler: filterHandler },
      },
    })

    model.send({ action: 'handshake', viewId: 'default' })
    model.send({ action: 'disconnect', viewId: 'default' })
    model.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 1 }, viewId: 'default' })

    expect(model.getActionState?.()).toStrictEqual({})
  })

  it('applies local initial actions to the first handshake result', () => {
    const results: DataResult<Item>[] = []
    const model = localModel<Item>({
      data: ITEMS,
      pipeline: ['filter'],
      initialActions: [{ action: 'filter', payload: 'open' }],
      actions: {
        filter: { stage: 'filter', handler: filterHandler },
      },
    })
    model.subscribe((message) => {
      if (message.type === 'result') {
        results.push(message.payload as DataResult<Item>)
      }
    })

    expect(model.getActionState?.()).toStrictEqual({
      filter: { payload: 'open', viewId: 'default' },
    })

    model.send({ action: 'handshake', viewId: 'default' })

    expect(latestResult(results).data).toStrictEqual([ITEMS[0]])
  })

  it('ignores invalid local initial actions with dev warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    localModel<Item>({
      data: ITEMS,
      pipeline: ['filter'],
      initialActions: [
        { action: 'missing', payload: 'open' },
        { action: 'append', payload: ITEMS[0] },
      ],
      actions: {
        append: {
          handler: appendHandler,
        },
        filter: { stage: 'filter', handler: filterHandler },
      },
    })

    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn.mock.calls[0]![0]).toContain('missing')
    expect(warn.mock.calls[1]![0]).toContain('source mutator')
  })

  it('keeps command-like local source mutators out of action state', () => {
    const results: DataResult<Item>[] = []
    const model = localModel<Item>({
      data: ITEMS,
      actions: {
        append: {
          handler: appendHandler,
        },
      },
    })
    model.subscribe((message) => {
      if (message.type === 'result') {
        results.push(message.payload as DataResult<Item>)
      }
    })

    model.send({ action: 'handshake', viewId: 'default' })
    model.send({ action: 'append', payload: { id: 3, name: 'Gamma', status: 'open', value: 3 } })

    expect(latestResult(results).data).toHaveLength(3)
    expect(model.getActionState?.()).toStrictEqual({})
  })

  it('clears local group markers when a grouped pipeline action returns plain rows', () => {
    const results: DataResult<Item, ItemGroup>[] = []
    const model = localModel<Item, ItemGroup>({
      data: ITEMS,
      pipeline: ['group'],
      actions: {
        group: {
          stage: 'group',
          handler: groupingHandler,
        },
      },
    })
    model.subscribe((message) => {
      if (message.type === 'result') {
        results.push(message.payload as DataResult<Item, ItemGroup>)
      }
    })

    model.send({ action: 'handshake', viewId: 'default' })
    model.send({ action: 'group', payload: 'status' })
    expect(latestResult(results).groups).toStrictEqual([{ index: 0, level: 0 }])

    model.send({ action: 'group', payload: 'none' })

    expect(latestResult(results)).toStrictEqual({
      data: ITEMS,
      groups: [],
    })
  })

  it('notifies action-state subscribers and supports unsubscribe', () => {
    const model = localModel<Item>({
      data: ITEMS,
      pipeline: ['filter', 'group'],
      actions: {
        filter: { stage: 'filter', handler: filterHandler },
        group: { stage: 'group', handler: passthroughHandler },
      },
    })
    const states: unknown[] = []

    const unsubscribe = model.subscribeToActionState?.((state) => {
      states.push(state)
    })

    model.send({ action: 'filter', payload: 'open' })
    model.send({ action: 'group', payload: 'status' })
    unsubscribe?.()
    model.send({ action: 'filter', payload: 'done' })

    expect(states).toStrictEqual([
      { filter: { payload: 'open', viewId: 'default' } },
      {
        filter: { payload: 'open', viewId: 'default' },
        group: { payload: 'status', viewId: 'default' },
      },
    ])
  })

  it('keeps persistence capture shape unchanged', () => {
    const model = localModel<Item>({
      data: ITEMS,
      pipeline: ['filter', 'group'],
      actions: {
        filter: { stage: 'filter', handler: filterHandler, persistence: true },
        group: { stage: 'group', handler: passthroughHandler },
      },
    })

    model.send({ action: 'filter', payload: 'open' })
    model.send({ action: 'group', payload: 'status' })

    expect(model.persistence?.capture('default', null)).toStrictEqual({
      version: 1,
      actions: { filter: 'open' },
    })
  })

  it('applies remote initial actions before the first offset fetch', () => {
    const fetch = vi.fn(() => Promise.resolve(fetchResult))
    const model = remoteModel<Item, Params>({
      initialParams: {},
      fetch,
      initialActions: [{ action: 'filter', payload: 'open' }],
      actions: {
        filter: {
          handler: ({ payload, params }) => ({ ...params, query: String(payload) }),
        },
      },
    })

    expect(model.getActionState?.()).toStrictEqual({
      filter: { payload: 'open', viewId: 'default' },
    })

    model.send({ action: 'handshake', viewId: 'default' })

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { query: 'open' },
      })
    )
  })

  it('applies remote initial actions in array order', () => {
    const fetch = vi.fn(() => Promise.resolve(fetchResult))
    const model = remoteModel<Item, Params>({
      initialParams: {},
      fetch,
      initialActions: [
        { action: 'category', payload: 'hardware' },
        { action: 'search', payload: 'desk' },
      ],
      actions: {
        category: {
          handler: ({ payload, params }) => ({ ...params, category: String(payload) }),
        },
        search: {
          handler: ({ payload, params }) => ({ ...params, scopedQuery: `${params.category}:${String(payload)}` }),
        },
      },
    })

    model.send({ action: 'handshake', viewId: 'default' })

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          category: 'hardware',
          scopedQuery: 'hardware:desk',
        },
      })
    )
  })

  it('applies remote initial actions before the first append fetch', () => {
    const fetch = vi.fn(() => Promise.resolve({ rows: ITEMS, cursor: null, hasMore: false }))
    const model = remoteModel<Item, Params>({
      mode: 'append',
      initialParams: {},
      fetch,
      initialActions: [{ action: 'sort', payload: 'name' }],
      actions: {
        sort: {
          handler: ({ payload, params }) => ({ ...params, sortBy: String(payload) }),
        },
      },
    })

    model.send({ action: 'handshake', viewId: 'default' })

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { sortBy: 'name' },
      })
    )
    expect(model.getActionState?.()).toStrictEqual({
      sort: { payload: 'name', viewId: 'default' },
    })
  })

  it('keeps built-in remote load commands out of action state', () => {
    const offsetModel = remoteModel<Item>({
      initialParams: {},
      fetch: vi.fn(() => Promise.resolve(fetchResult)),
    })
    const appendModel = remoteModel<Item>({
      mode: 'append',
      initialParams: {},
      fetch: vi.fn(() => Promise.resolve({ rows: ITEMS, cursor: null, hasMore: false })),
    })

    offsetModel.send({ action: 'loadRange', payload: { offset: 0, limit: 1 }, viewId: 'default' })
    appendModel.send({ action: 'loadMore', viewId: 'default' })
    offsetModel.send({ action: 'viewportChange', payload: { startIndex: 0, endIndex: 1 }, viewId: 'default' })

    expect(offsetModel.getActionState?.()).toStrictEqual({})
    expect(appendModel.getActionState?.()).toStrictEqual({})
  })

  it('ignores invalid remote initial actions with dev warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    remoteModel<Item, Params>({
      initialParams: {},
      fetch: vi.fn(() => Promise.resolve(fetchResult)),
      initialActions: [{ action: 'missing', payload: 'open' }],
      actions: {
        filter: {
          handler: ({ payload, params }) => ({ ...params, query: String(payload) }),
        },
      },
    })

    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]![0]).toContain('missing')
  })
})
