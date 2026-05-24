import { RESERVED_ACTION_NAMES } from './reserved-actions'

export interface ModelActionSnapshot {
  payload: unknown
  viewId: string
}

export interface DispatchModelActionPayload {
  action: string
  payload?: unknown
}

export type ModelActionState = Record<string, ModelActionSnapshot>

export interface InitialModelAction {
  action: string
  payload?: unknown
}

type ActionStateSubscriber = (state: ModelActionState) => void

function cloneActionState(actionState: Map<string, ModelActionSnapshot>): ModelActionState {
  return Object.fromEntries([...actionState].map(([action, snapshot]) => [action, { ...snapshot }]))
}

export function createActionStateTracker() {
  const actionState = new Map<string, ModelActionSnapshot>()
  const subscribers = new Set<ActionStateSubscriber>()

  function getState(): ModelActionState {
    return cloneActionState(actionState)
  }

  function notify() {
    if (subscribers.size === 0) {
      return
    }

    const snapshot = getState()
    for (const subscriber of subscribers) {
      subscriber(snapshot)
    }
  }

  function remove(action: string, notifySubscribers = true) {
    if (!actionState.delete(action)) {
      return false
    }

    if (notifySubscribers) {
      notify()
    }
    return true
  }

  function update(action: string, payload: unknown, viewId = 'default', notifySubscribers = true) {
    if (RESERVED_ACTION_NAMES.has(action)) {
      return false
    }

    const previous = actionState.get(action)
    if (previous && Object.is(previous.payload, payload) && previous.viewId === viewId) {
      return false
    }

    actionState.set(action, { payload, viewId })
    if (notifySubscribers) {
      notify()
    }
    return true
  }

  function subscribe(subscriber: ActionStateSubscriber) {
    subscribers.add(subscriber)
    return () => {
      subscribers.delete(subscriber)
    }
  }

  return { getState, remove, subscribe, update }
}
