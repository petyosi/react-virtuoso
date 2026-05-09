import type { ModelPersistenceState } from './types'

/**
 * Persistence configuration for a data model action.
 *
 * @group Data Models
 */
export type ModelActionPersistenceConfig<State = unknown, SourceState = unknown> =
  | boolean
  | {
      capture?: (context: { action: string; payload: unknown; state: SourceState }) => State
      isEmpty?: (state: State) => boolean
      key?: string
      restore?: (context: { action: string; persisted: State; state: SourceState }) => SourceState
    }

export function isModelPersistenceState(state: ModelPersistenceState | null | undefined): state is ModelPersistenceState {
  return state?.version === 1 && typeof state.actions === 'object' && state.actions !== null
}

export function emptyModelPersistenceState(previous?: ModelPersistenceState | null): ModelPersistenceState {
  return isModelPersistenceState(previous) ? { version: 1, actions: { ...previous.actions } } : { version: 1, actions: {} }
}

export function persistenceKeyForAction<SourceState>(
  action: string,
  persistence: ModelActionPersistenceConfig<unknown, SourceState> | undefined
): string | null {
  if (!persistence) {
    return null
  }
  return typeof persistence === 'object' && persistence.key ? persistence.key : action
}

export function capturePersistedAction<State>(
  action: string,
  payload: unknown,
  sourceState: State,
  persistence: ModelActionPersistenceConfig<unknown, State>
): unknown {
  if (typeof persistence === 'object' && persistence.capture) {
    return persistence.capture({ action, payload, state: sourceState })
  }
  return payload
}

export function persistedActionIsEmpty<SourceState>(
  value: unknown,
  persistence: ModelActionPersistenceConfig<unknown, SourceState> | undefined
): boolean {
  if (typeof persistence === 'object' && persistence.isEmpty) {
    return persistence.isEmpty(value)
  }
  return value === undefined
}

export function notifyModelPersistenceSubscribers(subscribers: Set<() => void>) {
  for (const subscriber of subscribers) {
    subscriber()
  }
}
