import { describe, expect, it, vi } from 'vitest'

import { localSource } from '../../../src/model/local-source'

import type { DataResult, MessageEnvelope } from '../../../src/model/types'

interface Item {
  id: number
  name: string
  category: string
}

const ITEMS: Item[] = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `item-${i}`,
  category: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
}))

function lastPayload(messages: MessageEnvelope[]): DataResult<Item> {
  return messages.at(-1)!.payload as DataResult<Item>
}

describe('localSource pipeline', () => {
  it('filter: reduces items by predicate', () => {
    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }) => {
            const category = payload as string
            return data.filter((item) => item.category === category)
          },
        },
      },
    })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })

    // Before filter: all 100 items
    expect(lastPayload(messages).data).toHaveLength(100)

    model.send({ action: 'filter', payload: 'A', viewId: 'v1' })

    const filtered = lastPayload(messages).data
    expect(filtered).toHaveLength(34)
    expect(filtered.every((item) => item.category === 'A')).toBe(true)
  })

  it('sort: reorders items', () => {
    const items = [
      { id: 3, name: 'c', category: 'A' },
      { id: 1, name: 'a', category: 'A' },
      { id: 2, name: 'b', category: 'A' },
    ]

    const model = localSource<Item>({
      data: items,
      pipeline: ['sort'],
      actions: {
        sort: {
          stage: 'sort',
          handler: ({ data, payload }) => {
            const field = payload as keyof Item
            return data.toSorted((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
          },
        },
      },
    })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'sort', payload: 'name', viewId: 'v1' })

    const sorted = lastPayload(messages).data
    expect(sorted.map((i) => i.name)).toEqual(['a', 'b', 'c'])
  })

  it('filter then sort: pipeline executes in order', () => {
    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter', 'sort'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }) => data.filter((item) => item.category === (payload as string)),
        },
        sort: {
          stage: 'sort',
          handler: ({ data, payload }) => {
            const field = payload as keyof Item
            return data.toSorted((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
          },
        },
      },
    })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })

    model.send({ action: 'filter', payload: 'B', viewId: 'v1' })
    model.send({ action: 'sort', payload: 'id', viewId: 'v1' })

    const result = lastPayload(messages).data
    expect(result.every((item) => item.category === 'B')).toBe(true)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.id).toBeGreaterThan(result[i - 1]!.id)
    }
  })

  it('group: handler returns data and groups', () => {
    const items = [
      { id: 0, name: 'Group A', category: 'A' },
      { id: 1, name: 'item-1', category: 'A' },
      { id: 2, name: 'item-2', category: 'A' },
      { id: 3, name: 'Group B', category: 'B' },
      { id: 4, name: 'item-4', category: 'B' },
    ]

    const model = localSource<Item>({
      data: items,
      pipeline: ['group'],
      actions: {
        group: {
          stage: 'group',
          handler: ({ data }) => {
            const grouped: Item[] = []
            const groups: { index: number; level: number }[] = []
            const byCategory = new Map<string, Item[]>()

            for (const item of data) {
              let group = byCategory.get(item.category)
              if (!group) {
                group = []
                byCategory.set(item.category, group)
              }
              group.push(item)
            }

            let index = 0
            for (const [, categoryItems] of byCategory) {
              groups.push({ index, level: 0 })
              grouped.push(...categoryItems)
              index += categoryItems.length
            }

            return { data: grouped, groups }
          },
        },
      },
    })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })
    model.send({ action: 'group', payload: 'category', viewId: 'v1' })

    const result = lastPayload(messages)
    expect(result.data).toHaveLength(5)
    expect(result.groups).toHaveLength(2)
    expect(result.groups[0]).toEqual({ index: 0, level: 0 })
    expect(result.groups[1]).toEqual({ index: 3, level: 0 })
  })

  it('source mutator: removes items and re-runs pipeline', () => {
    const model = localSource<Item>({
      data: ITEMS.slice(0, 10),
      pipeline: ['filter'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }) => data.filter((item) => item.category === (payload as string)),
        },
        deleteItem: {
          handler: ({ source, payload }) => source.filter((item) => item.id !== (payload as number)),
        },
      },
    })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })

    // Apply filter first
    model.send({ action: 'filter', payload: 'A', viewId: 'v1' })
    const beforeDelete = lastPayload(messages).data.length

    // Delete an item that passes the filter (id=0, category='A')
    model.send({ action: 'deleteItem', payload: 0, viewId: 'v1' })
    const afterDelete = lastPayload(messages).data

    expect(afterDelete).toHaveLength(beforeDelete - 1)
    expect(afterDelete.every((item) => item.category === 'A')).toBe(true)
    expect(afterDelete.find((item) => item.id === 0)).toBeUndefined()
  })

  it('cache: triggering a later stage does not re-run earlier stages', () => {
    const filterHandler = vi.fn(({ data, payload }: { data: Item[]; payload: unknown }) =>
      data.filter((item) => item.category === (payload as string))
    )
    const sortHandler = vi.fn(({ data }: { data: Item[]; payload: unknown }) => data.toSorted((a, b) => a.id - b.id))

    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter', 'sort'],
      actions: {
        filter: { stage: 'filter', handler: filterHandler },
        sort: { stage: 'sort', handler: sortHandler },
      },
    })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })

    // Apply filter
    model.send({ action: 'filter', payload: 'A', viewId: 'v1' })
    expect(filterHandler).toHaveBeenCalledOnce()

    // Apply sort -- should NOT re-run filter
    model.send({ action: 'sort', payload: 'id', viewId: 'v1' })
    expect(filterHandler).toHaveBeenCalledOnce()
    expect(sortHandler).toHaveBeenCalledOnce()
  })

  it('full pipeline: filter + sort + group composition', () => {
    const model = localSource<Item>({
      data: ITEMS,
      pipeline: ['filter', 'sort', 'group'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }) => data.filter((item) => item.category !== (payload as string)),
        },
        sort: {
          stage: 'sort',
          handler: ({ data }) => data.toSorted((a, b) => b.id - a.id),
        },
        group: {
          stage: 'group',
          handler: ({ data }) => {
            const grouped: Item[] = []
            const groups: { index: number; level: number }[] = []
            const byCategory = new Map<string, Item[]>()

            for (const item of data) {
              let arr = byCategory.get(item.category)
              if (!arr) {
                arr = []
                byCategory.set(item.category, arr)
              }
              arr.push(item)
            }

            let index = 0
            for (const [, items] of byCategory) {
              groups.push({ index, level: 0 })
              grouped.push(...items)
              index += items.length
            }

            return { data: grouped, groups }
          },
        },
      },
    })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })

    // Filter out category C
    model.send({ action: 'filter', payload: 'C', viewId: 'v1' })
    // Sort descending by id
    model.send({ action: 'sort', payload: null, viewId: 'v1' })
    // Group by category
    model.send({ action: 'group', payload: null, viewId: 'v1' })

    const result = lastPayload(messages)
    expect(result.data.every((item) => item.category !== 'C')).toBe(true)
    expect(result.groups.length).toBeGreaterThan(0)
  })

  it('handshake without actions returns unprocessed data', () => {
    const model = localSource<Item>({
      data: ITEMS.slice(0, 5),
      pipeline: ['filter'],
      actions: {
        filter: {
          stage: 'filter',
          handler: ({ data, payload }) => data.filter((item) => item.category === (payload as string)),
        },
      },
    })

    const messages: MessageEnvelope[] = []
    model.subscribe((msg) => messages.push(msg))
    model.send({ action: 'handshake', viewId: 'v1' })

    // No filter action sent, so all items pass through
    expect(lastPayload(messages).data).toHaveLength(5)
  })
})
