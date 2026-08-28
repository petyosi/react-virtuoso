import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

import { data$, dataOperation$, groupIndices$ } from '../../../core/data'
import { loadingState$ } from '../../../core/loading'
import { dispatchModelAction$, modelActionState$ } from '../../../core/model-actions'
import { ranges$, sizeState$ } from '../../../resize/sizes'
import { localModel } from '../../local-model'
import { bridgeModelToEngine, dataModel$, dataModelViewId$ } from '../../model-bridge'

import type { PipelineHandler, SourceMutator } from '../../local-model'
import type { DataModelHandle, DataResult, MessageEnvelope } from '../../types'

interface Item {
  id: number
  status: string
}

const ITEMS: Item[] = [
  { id: 1, status: 'open' },
  { id: 2, status: 'done' },
]

const appendHandler: SourceMutator<Item> = ({ source, payload }) => [...source, payload as Item]

const groupHandler: PipelineHandler<Item> = ({ data, payload }) => ({
  data,
  groups: payload === 'status' ? [{ index: 0, level: 0 }] : [],
})

function createEngine() {
  const engine = new Engine()
  engine.register(data$)
  engine.register(dataOperation$)
  engine.register(groupIndices$)
  engine.register(loadingState$)
  engine.register(dataModel$)
  engine.register(dataModelViewId$)
  engine.register(dispatchModelAction$)
  engine.register(modelActionState$)
  engine.register(sizeState$)
  return engine
}

function createActionModel() {
  return localModel<Item>({
    data: ITEMS,
    pipeline: ['group'],
    actions: {
      append: {
        handler: appendHandler,
      },
      group: {
        stage: 'group',
        handler: groupHandler,
      },
    },
  })
}

function createSendSpyModel(model: DataModelHandle<Item>) {
  const sendSpy = vi.fn((msg: Parameters<DataModelHandle<Item>['send']>[0]) => {
    model.send(msg)
  })
  const bridgedModel: DataModelHandle<Item> = {
    destroy: () => model.destroy(),
    getActionState: () => model.getActionState?.() ?? {},
    send: sendSpy,
    subscribe: (listener) => model.subscribe(listener),
    subscribeToActionState: (handler) => model.subscribeToActionState?.(handler) ?? (() => {}),
  }
  if (model.persistence) {
    bridgedModel.persistence = model.persistence
  }
  if (model.setData) {
    bridgedModel.setData = (data, groups) => model.setData?.(data, groups)
  }

  return { model: bridgedModel, sendSpy }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('model action bridge', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = createEngine()
  })

  it('publishes initial model action state into the engine', () => {
    const model = localModel<Item>({
      data: ITEMS,
      pipeline: ['group'],
      initialActions: [{ action: 'group', payload: 'status' }],
      actions: {
        group: {
          stage: 'group',
          handler: groupHandler,
        },
      },
    })

    bridgeModelToEngine(model, engine, 'default')

    expect(engine.getValue(modelActionState$)).toStrictEqual({
      group: { payload: 'status', viewId: 'default' },
    })
  })

  it('publishes direct model action updates into the engine cell', () => {
    const model = createActionModel()
    bridgeModelToEngine(model, engine, 'default')

    model.send({ action: 'group', payload: 'status', viewId: 'default' })

    expect(engine.getValue(modelActionState$)).toStrictEqual({
      group: { payload: 'status', viewId: 'default' },
    })
  })

  it('dispatches engine publications to model.send and mirrors accepted state', () => {
    const { model, sendSpy } = createSendSpyModel(createActionModel())
    bridgeModelToEngine(model, engine, 'default')
    sendSpy.mockClear()

    engine.pub(dispatchModelAction$, { action: 'group', payload: 'status' })

    expect(sendSpy).toHaveBeenCalledWith({ action: 'group', payload: 'status', viewId: 'default' })
    expect(engine.getValue(modelActionState$)).toStrictEqual({
      group: { payload: 'status', viewId: 'default' },
    })
  })

  it('blocks bridge-owned reserved actions from dispatch', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { model, sendSpy } = createSendSpyModel(createActionModel())
    bridgeModelToEngine(model, engine, 'default')
    sendSpy.mockClear()

    engine.pub(dispatchModelAction$, { action: 'handshake' })

    expect(sendSpy).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledOnce()
    expect(engine.getValue(modelActionState$)).toStrictEqual({})
  })

  it('dispatches command-like actions without tracking them as state', () => {
    const { model, sendSpy } = createSendSpyModel(createActionModel())
    bridgeModelToEngine(model, engine, 'default')
    sendSpy.mockClear()

    engine.pub(dispatchModelAction$, { action: 'refresh' })
    engine.pub(dispatchModelAction$, { action: 'cancel', payload: { requestId: 'missing' } })
    engine.pub(dispatchModelAction$, { action: 'append', payload: { id: 3, status: 'open' } })

    expect(sendSpy).toHaveBeenCalledWith({ action: 'refresh', payload: undefined, viewId: 'default' })
    expect(sendSpy).toHaveBeenCalledWith({ action: 'cancel', payload: { requestId: 'missing' }, viewId: 'default' })
    expect(sendSpy).toHaveBeenCalledWith({ action: 'append', payload: { id: 3, status: 'open' }, viewId: 'default' })
    expect(engine.getValue(modelActionState$)).toStrictEqual({})
  })

  it('cleanup unsubscribes action-state and dispatch listeners', () => {
    const model = createActionModel()
    const cleanup = bridgeModelToEngine(model, engine, 'default')

    cleanup()
    model.send({ action: 'group', payload: 'status', viewId: 'default' })
    engine.pub(dispatchModelAction$, { action: 'group', payload: 'category' })

    expect(engine.getValue(modelActionState$)).toStrictEqual({})
  })

  it('supports dispatching to custom models without action-state methods', () => {
    const send = vi.fn()
    const model: DataModelHandle<Item> = {
      destroy: vi.fn(),
      send,
      subscribe(listener: (msg: MessageEnvelope) => void) {
        listener({
          action: 'result',
          payload: { data: ITEMS, groups: [] } satisfies DataResult<Item>,
          requestId: 'initial',
          type: 'result',
          viewId: 'default',
        })
        return vi.fn()
      },
    }

    bridgeModelToEngine(model, engine, 'default')
    send.mockClear()

    engine.pub(dispatchModelAction$, { action: 'refresh' })

    expect(send).toHaveBeenCalledWith({ action: 'refresh', payload: undefined, viewId: 'default' })
    expect(engine.getValue(modelActionState$)).toStrictEqual({})
  })

  it('downgrades an update result to replace when the row count changes, resetting sizes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let listener: ((msg: MessageEnvelope) => void) | null = null
    const model: DataModelHandle<Item> = {
      destroy: vi.fn(),
      send: vi.fn((msg: Parameters<DataModelHandle<Item>['send']>[0]) => {
        if (msg.action === 'grow') {
          listener?.({
            action: 'result',
            payload: { data: [...ITEMS, { id: 3, status: 'open' }], groups: [], operation: 'update' } satisfies DataResult<Item>,
            requestId: 'grow',
            type: 'result',
            viewId: 'default',
          })
        }
      }),
      subscribe(nextListener) {
        listener = nextListener
        nextListener({
          action: 'result',
          payload: { data: ITEMS, groups: [] } satisfies DataResult<Item>,
          requestId: 'initial',
          type: 'result',
          viewId: 'default',
        })
        return vi.fn()
      },
    }

    bridgeModelToEngine(model, engine, 'default')
    engine.pub(ranges$, [{ size: 20, startIndex: 0, endIndex: 0 }])
    expect(engine.getValue(sizeState$).offsetTree).toMatchObject([{ size: 20, index: 0, offset: 0 }])

    model.send({ action: 'grow', viewId: 'default' })

    expect(engine.getValue(dataOperation$)).toBe('replace')
    expect(engine.getValue(sizeState$).offsetTree).toHaveLength(0)
    expect(warn).toHaveBeenCalledOnce()
  })

  it('updateData sets dataOperation$ to update and preserves the offset tree', () => {
    const model = localModel<Item>({ data: ITEMS })
    bridgeModelToEngine(model, engine, 'default')

    engine.pub(ranges$, [{ size: 20, startIndex: 0, endIndex: 0 }])
    const offsetTreeBefore = engine.getValue(sizeState$).offsetTree
    expect(offsetTreeBefore).toMatchObject([{ size: 20, index: 0, offset: 0 }])

    model.updateData?.([
      { id: 1, status: 'closed' },
      { id: 2, status: 'done' },
    ])

    expect(engine.getValue(dataOperation$)).toBe('update')
    expect(engine.getValue(sizeState$).offsetTree).toStrictEqual(offsetTreeBefore)
  })

  it('replays lastKnownGood as replace after an action error, even if it was tagged update', () => {
    const model = localModel<Item>({
      data: ITEMS,
      actions: {
        boom: {
          handler: () => {
            throw new Error('boom')
          },
        },
      },
    })
    bridgeModelToEngine(model, engine, 'default')

    model.updateData?.([
      { id: 1, status: 'closed' },
      { id: 2, status: 'done' },
    ])
    expect(engine.getValue(dataOperation$)).toBe('update')

    model.send({ action: 'boom', viewId: 'default' })

    expect(engine.getValue(dataOperation$)).toBe('replace')
  })
})
