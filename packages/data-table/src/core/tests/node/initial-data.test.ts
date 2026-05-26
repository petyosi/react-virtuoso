import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { localModel } from '../../../model/local-model'
import { bridgeModelToEngine } from '../../../model/model-bridge'
import { data$, initialData$ } from '../../data'
import { EMPTY_LOADING_STATE, loadingState$ } from '../../loading'

import type { DataTableLoadingState, DataTableLoadingStatus } from '../../../interfaces'

interface Row {
  id: number
}

function initialLoadingState(status: DataTableLoadingStatus): DataTableLoadingState {
  return {
    ...EMPTY_LOADING_STATE,
    initial: { status, errorMessage: null },
  }
}

describe(String(initialData$), () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(data$)
    engine.register(loadingState$)
    engine.register(initialData$)
  })

  it('starts as null', () => {
    expect(engine.getValue(initialData$)).toBeNull()
  })

  it('stays null when data publishes an empty array', () => {
    engine.pub(data$, [])

    expect(engine.getValue(initialData$)).toBeNull()
  })

  it('stays null when non-empty data arrives while initial loading is active', () => {
    engine.pub(loadingState$, initialLoadingState('loading'))
    engine.pub(data$, [{ id: 1 }])

    expect(engine.getValue(initialData$)).toBeNull()
  })

  it('captures the exact data array reference when non-empty data arrives after loading', () => {
    const rows: Row[] = [{ id: 1 }, { id: 2 }]

    engine.pub(loadingState$, initialLoadingState('idle'))
    engine.pub(data$, rows)

    expect(engine.getValue(initialData$)).toBe(rows)
  })

  it('stays frozen after data changes', () => {
    const initialRows: Row[] = [{ id: 1 }, { id: 2 }]

    engine.pub(data$, initialRows)
    engine.pub(data$, [{ id: 3 }, { id: 4 }])

    expect(engine.getValue(initialData$)).toBe(initialRows)
  })

  it('stays frozen after loading state changes', () => {
    const initialRows: Row[] = [{ id: 1 }, { id: 2 }]

    engine.pub(data$, initialRows)
    engine.pub(loadingState$, initialLoadingState('loading'))
    engine.pub(loadingState$, initialLoadingState('idle'))
    engine.pub(loadingState$, initialLoadingState('error'))

    expect(engine.getValue(initialData$)).toBe(initialRows)
  })

  it('captures immediately for local-model handshake order', () => {
    const rows: Row[] = [{ id: 1 }, { id: 2 }]
    const model = localModel<Row>({ data: rows })

    bridgeModelToEngine(model, engine, 'default')

    expect(engine.getValue(initialData$)).toStrictEqual(rows)
  })

  it('captures when loading transitions before data arrives', () => {
    const rows: Row[] = [{ id: 1 }, { id: 2 }]

    engine.pub(loadingState$, initialLoadingState('loading'))
    engine.pub(loadingState$, initialLoadingState('idle'))
    engine.pub(data$, rows)

    expect(engine.getValue(initialData$)).toBe(rows)
  })

  it('captures when data arrives before loading transitions to idle', () => {
    const rows: Row[] = [{ id: 1 }, { id: 2 }]

    engine.pub(loadingState$, initialLoadingState('loading'))
    engine.pub(data$, rows)

    expect(engine.getValue(initialData$)).toBeNull()

    engine.pub(loadingState$, initialLoadingState('idle'))

    expect(engine.getValue(initialData$)).toBe(rows)
  })

  it('captures after an initial error when non-empty data later arrives', () => {
    const rows: Row[] = [{ id: 1 }, { id: 2 }]

    engine.pub(loadingState$, initialLoadingState('loading'))
    engine.pub(loadingState$, initialLoadingState('error'))
    engine.pub(data$, rows)

    expect(engine.getValue(initialData$)).toBe(rows)
  })

  it('stays null after an initial error when no non-empty data exists', () => {
    engine.pub(loadingState$, initialLoadingState('loading'))
    engine.pub(data$, [])
    engine.pub(loadingState$, initialLoadingState('error'))

    expect(engine.getValue(initialData$)).toBeNull()
  })
})
