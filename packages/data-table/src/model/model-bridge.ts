import { Cell } from '@virtuoso.dev/reactive-engine-core'

import { data$, groupIndices$ } from '../core/data'
import { EMPTY_LOADING_STATE, loadingState$ } from '../core/loading'
import { viewportRange$ } from '../rows/row-state'

import type { DataTableLoadingState } from '../interfaces'
import type { RemoteModelLoadingEvent, RemoteModelLoadingReason } from './remote-model'
import type { DataModelHandle, DataResult, MessageEnvelope } from './types'
import type { Engine } from '@virtuoso.dev/reactive-engine-core'

/**
 * Active data model used by the table. Internal persistence adapters read this
 * instead of accepting a model instance directly.
 *
 * @group Data Models
 */
export const dataModel$ = Cell<DataModelHandle | null>(null)

/**
 * Active data model view id used by the table.
 *
 * @group Data Models
 */
export const dataModelViewId$ = Cell<string>('default')

function cloneLoadingState(): DataTableLoadingState {
  return {
    initial: { ...EMPTY_LOADING_STATE.initial },
    refresh: { ...EMPTY_LOADING_STATE.refresh },
    start: { ...EMPTY_LOADING_STATE.start },
    end: { ...EMPTY_LOADING_STATE.end },
  }
}

function segmentKeyForReason(reason: RemoteModelLoadingReason): keyof DataTableLoadingState | null {
  switch (reason) {
    case 'initial': {
      return 'initial'
    }
    case 'refresh': {
      return 'refresh'
    }
    case 'end': {
      return 'end'
    }
    case 'viewport': {
      return null
    }
  }
}

export function bridgeModelToEngine(model: DataModelHandle, engine: Engine, viewId: string): () => void {
  let loadingState = cloneLoadingState()

  const unsub = model.subscribe((msg: MessageEnvelope) => {
    if (msg.viewId !== viewId) {
      return
    }

    if (msg.type === 'event' && msg.payload && typeof msg.payload === 'object' && 'kind' in msg.payload) {
      const event = msg.payload as RemoteModelLoadingEvent
      if (event.kind === 'loading') {
        const segmentKey = segmentKeyForReason(event.reason)
        if (segmentKey !== null) {
          loadingState = {
            ...loadingState,
            [segmentKey]:
              event.phase === 'start'
                ? { status: 'loading', errorMessage: null }
                : event.phase === 'success' || event.phase === 'cancel'
                  ? { status: 'idle', errorMessage: null }
                  : { status: 'error', errorMessage: event.errorMessage ?? null },
          }
          engine.pub(loadingState$, loadingState)
        }
      }
      return
    }

    if (msg.type === 'result') {
      const result = msg.payload as DataResult
      engine.pubIn({
        [data$]: [...result.data],
        [groupIndices$]: result.groups,
      })
    }
  })

  const unsubViewport = engine.sub(viewportRange$, (range) => {
    if (range !== null) {
      model.send({ action: 'viewportChange', payload: range, viewId })
    }
  })

  engine.pub(loadingState$, loadingState)
  model.send({ action: 'handshake', viewId })

  const cleanup = () => {
    model.send({ action: 'disconnect', viewId })
    unsub()
    unsubViewport()
  }

  engine.onDispose(cleanup)
  return cleanup
}
