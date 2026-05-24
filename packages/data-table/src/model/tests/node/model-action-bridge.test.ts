import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

import { data$, groupIndices$ } from '../../../core/data'
import { loadingState$ } from '../../../core/loading'
import { dispatchModelAction$, modelActionState$ } from '../../../core/model-actions'
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
  engine.register(groupIndices$)
  engine.register(loadingState$)
  engine.register(dataModel$)
  engine.register(dataModelViewId$)
  engine.register(dispatchModelAction$)
  engine.register(modelActionState$)
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
})
