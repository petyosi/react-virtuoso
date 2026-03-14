import type { DataModelHandle, DataResult, FrameAdapter, MessageEnvelope } from './types'

interface InFlightRequest {
  requestId: string
  action: string
  viewId: string
}

interface ViewState {
  operationVersion: number
  dataVersion: number
  subscriberCount: number
  lastKnownGood: DataResult | null
  inFlightActions: Set<string>
  inFlightRequests: Map<string, InFlightRequest>
  lastRequestByAction: Map<string, string>
  actionQueues: Map<string, { payload: unknown; requestId: string }[]>
}

export function createModel<T, G = never>(adapter: FrameAdapter<T, G>): DataModelHandle<T | G> {
  let requestCounter = 0
  const listeners = new Set<(msg: MessageEnvelope) => void>()
  const views = new Map<string, ViewState>()
  let destroyed = false

  function nextRequestId(): string {
    return String(++requestCounter)
  }

  function emit(msg: MessageEnvelope) {
    for (const listener of listeners) {
      listener(msg)
    }
  }

  function getOrCreateView(viewId: string): ViewState {
    let view = views.get(viewId)
    if (!view) {
      view = {
        operationVersion: 0,
        dataVersion: 0,
        subscriberCount: 0,
        lastKnownGood: null,
        inFlightActions: new Set(),
        inFlightRequests: new Map(),
        lastRequestByAction: new Map(),
        actionQueues: new Map(),
      }
      views.set(viewId, view)
    }
    return view
  }

  function emitAck(requestId: string, viewId: string, action: string) {
    emit({
      type: 'ack',
      requestId,
      viewId,
      action,
    })
  }

  function emitResult(viewId: string, result: DataResult<T, G>, operationVersion: number, requestId?: string) {
    const view = views.get(viewId)
    if (!view) {
      return
    }

    if (operationVersion < view.operationVersion) {
      return
    }

    view.dataVersion++
    view.lastKnownGood = result as DataResult
    const rid = requestId ?? nextRequestId()
    emit({
      type: 'result',
      requestId: rid,
      viewId,
      operationVersion: view.operationVersion,
      dataVersion: view.dataVersion,
      action: 'result',
      payload: result,
    })

    if (requestId) {
      view.inFlightRequests.delete(requestId)
    }
  }

  function emitError(viewId: string, action: string, message: string, requestId?: string) {
    const rid = requestId ?? nextRequestId()
    emit({
      type: 'error',
      requestId: rid,
      viewId,
      action,
      error: { message },
    })

    if (requestId) {
      const view = views.get(viewId)
      view?.inFlightRequests.delete(requestId)
    }
  }

  function emitCancel(requestId: string, viewId: string, action: string) {
    emit({
      type: 'cancel',
      requestId,
      viewId,
      action,
    })
    const view = views.get(viewId)
    view?.inFlightRequests.delete(requestId)
  }

  function emitEvent(viewId: string, payload: unknown) {
    const view = views.get(viewId)
    if (!view) {
      return
    }
    view.dataVersion++
    emit({
      type: 'event',
      requestId: '',
      viewId,
      dataVersion: view.dataVersion,
      action: 'event',
      payload,
    })
  }

  function executeAction(viewId: string, action: string, payload: unknown, requestId: string) {
    const view = getOrCreateView(viewId)
    view.operationVersion++
    const opVersion = view.operationVersion

    try {
      const result = adapter.handleAction!(viewId, action, payload, requestId)
      if (result) {
        emitResult(viewId, result, opVersion, requestId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      emitError(viewId, action, message, requestId)

      if (view.lastKnownGood) {
        emitResult(viewId, view.lastKnownGood as DataResult<T, G>, view.operationVersion)
      }
    }
  }

  function handleSend(msg: { action: string; payload?: unknown; viewId?: string; requestId?: string }) {
    if (destroyed) {
      return
    }

    const viewId = msg.viewId ?? 'default'

    if (msg.action === 'handshake') {
      const view = getOrCreateView(viewId)
      view.subscriberCount++
      const requestId = msg.requestId ?? nextRequestId()
      const result = adapter.handleHandshake(viewId)
      emitResult(viewId, result, view.operationVersion, requestId)
      return
    }

    if (msg.action === 'refresh') {
      const view = getOrCreateView(viewId)
      const requestId = msg.requestId ?? nextRequestId()
      const result = adapter.handleHandshake(viewId)
      emitResult(viewId, result, view.operationVersion, requestId)
      return
    }

    if (msg.action === 'disconnect') {
      const view = views.get(viewId)
      if (view) {
        view.subscriberCount--
        if (view.subscriberCount <= 0) {
          adapter.handleDisconnect?.(viewId)
          views.delete(viewId)
        }
      }
      return
    }

    if (msg.action === 'cancel') {
      const cancelRequestId = (msg.payload as { requestId?: string })?.requestId
      if (!cancelRequestId) {
        return
      }

      const view = views.get(viewId)
      if (!view) {
        return
      }

      const inFlight = view.inFlightRequests.get(cancelRequestId)
      if (!inFlight) {
        return
      }

      adapter.handleCancel?.(viewId, cancelRequestId)
      emitCancel(cancelRequestId, viewId, inFlight.action)
      view.inFlightActions.delete(inFlight.action)
      return
    }

    if (!adapter.handleAction) {
      return
    }

    const strategy = adapter.getActionStrategy?.(msg.action) ?? 'supersede'
    const view = getOrCreateView(viewId)
    const requestId = msg.requestId ?? nextRequestId()

    if (strategy === 'deduplicate' && view.inFlightActions.has(msg.action)) {
      return
    }

    if (strategy === 'queue' && view.inFlightActions.has(msg.action)) {
      let queue = view.actionQueues.get(msg.action)
      if (!queue) {
        queue = []
        view.actionQueues.set(msg.action, queue)
      }
      queue.push({ payload: msg.payload, requestId })
      return
    }

    if (strategy === 'supersede') {
      const prevRequestId = view.lastRequestByAction.get(msg.action)
      if (prevRequestId && view.inFlightRequests.has(prevRequestId)) {
        emitCancel(prevRequestId, viewId, msg.action)
      }
    }

    const inFlight: InFlightRequest = { requestId, action: msg.action, viewId }
    view.inFlightRequests.set(requestId, inFlight)
    view.lastRequestByAction.set(msg.action, requestId)

    view.inFlightActions.add(msg.action)
    emitAck(requestId, viewId, msg.action)
    executeAction(viewId, msg.action, msg.payload, requestId)
    view.inFlightActions.delete(msg.action)

    // Process queued items (for queue strategy)
    const queue = view.actionQueues.get(msg.action)
    if (queue && queue.length > 0) {
      const next = queue.shift()!
      handleSend({ action: msg.action, payload: next.payload, viewId, requestId: next.requestId })
    }
  }

  // Provide async emitter so adapters can emit results from async operations
  adapter.setAsyncEmitter?.((viewId: string, result: DataResult<T, G>, requestId?: string) => {
    if (destroyed) {
      return
    }
    const view = getOrCreateView(viewId)
    emitResult(viewId, result, view.operationVersion, requestId)
  })

  // Provide event emitter for external data events
  adapter.setEventEmitter?.((viewId: string, payload: unknown) => {
    if (destroyed) {
      return
    }
    emitEvent(viewId, payload)
  })

  return {
    send: handleSend,

    subscribe(listener: (msg: MessageEnvelope) => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    destroy() {
      destroyed = true
      for (const [viewId] of views) {
        adapter.handleDisconnect?.(viewId)
      }
      views.clear()
      listeners.clear()
      adapter.destroy?.()
    },
  }
}
