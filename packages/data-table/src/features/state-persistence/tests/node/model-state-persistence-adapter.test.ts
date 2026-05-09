import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it, vi } from 'vitest'

import { modelStatePersistenceAdapter } from '../../index'

import type { DataModelHandle, ModelPersistenceState } from '../../../../model/types'

function modelWithPersistence() {
  const capture = vi.fn((_viewId: string, previous: ModelPersistenceState | null) => ({
    version: 1 as const,
    actions: {
      ...previous?.actions,
      sort: 'name',
    },
  }))
  const restore = vi.fn()
  const subscribe = vi.fn((_viewId: string, _onChange: () => void) => vi.fn())
  const model: DataModelHandle = {
    destroy: vi.fn(),
    send: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    persistence: {
      capture,
      restore,
      subscribe,
    },
  }

  return { capture, model, restore, subscribe }
}

describe('model state persistence adapter', () => {
  it('captures through the active table model persistence capability', () => {
    const engine = new Engine()
    const { capture, model } = modelWithPersistence()
    const adapter = modelStatePersistenceAdapter()

    expect(adapter.capture({ engine, model, viewId: 'table-view' }, { version: 1, actions: { filter: 'open' } })).toStrictEqual({
      version: 1,
      actions: {
        filter: 'open',
        sort: 'name',
      },
    })
    expect(capture).toHaveBeenCalledWith('table-view', { version: 1, actions: { filter: 'open' } })
  })

  it('restores through the active table model persistence capability', () => {
    const engine = new Engine()
    const { model, restore } = modelWithPersistence()
    const adapter = modelStatePersistenceAdapter()
    const state: ModelPersistenceState = { version: 1, actions: { sort: 'name' } }

    adapter.restore({ engine, model, viewId: 'table-view' }, state)

    expect(restore).toHaveBeenCalledWith('table-view', state)
  })

  it('is a no-op when the model has no persistence capability', () => {
    const engine = new Engine()
    const adapter = modelStatePersistenceAdapter()
    const model: DataModelHandle = {
      destroy: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    }

    expect(adapter.capture({ engine, model, viewId: 'default' }, null)).toStrictEqual({ version: 1, actions: {} })
    expect(() => adapter.restore({ engine, model, viewId: 'default' }, { version: 1, actions: { sort: 'name' } })).not.toThrow()
    expect(adapter.subscribe({ engine, model, viewId: 'default' }, vi.fn())).toBeInstanceOf(Function)
  })
})
