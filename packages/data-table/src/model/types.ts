import type { ModelActionState } from './action-state'

/**
 * Message envelope used by data model protocols.
 *
 * @group Data Models
 */
export interface MessageEnvelope<P = unknown> {
  type: 'request' | 'ack' | 'result' | 'error' | 'cancel' | 'event'
  requestId: string
  viewId: string
  operationVersion?: number
  dataVersion?: number
  action: string
  payload?: P
  error?: { message: string }
}

/**
 * A normalized table data result returned by data models.
 *
 * @group Data Models
 */
export interface DataResult<T = unknown, G = never> {
  data: (T | G)[]
  groups: { index: number; level: number }[]
}

/**
 * Serializable model state used by model-backed persistence adapters.
 *
 * @group Data Models
 */
export interface ModelPersistenceState {
  version: 1
  actions: Record<string, unknown>
}

/**
 * Optional persistence capability exposed by data models.
 *
 * @group Data Models
 */
export interface DataModelPersistenceCapability<State = ModelPersistenceState> {
  capture(viewId: string, previous: State | null): State
  restore(viewId: string, state: State | null): void
  subscribe(viewId: string, onChange: () => void): () => void
}

/**
 * The handle exposed by local and remote data models.
 *
 * @group Data Models
 */
export interface DataModelHandle<T = unknown> {
  send(msg: { action: string; payload?: unknown; viewId?: string; requestId?: string }): void
  subscribe(listener: (msg: MessageEnvelope) => void): () => void
  destroy(): void
  getActionState?(): ModelActionState
  persistence?: DataModelPersistenceCapability
  subscribeToActionState?(handler: (state: ModelActionState) => void): () => void
  setData?(data: T[], groups?: { index: number; level: number }[]): void
}

/**
 * Concurrency strategies supported by model actions.
 *
 * @group Data Models
 */
export type ConcurrencyStrategy = 'supersede' | 'queue' | 'deduplicate'

export type AsyncResultEmitter<T = unknown, G = never> = (viewId: string, result: DataResult<T, G>, requestId?: string) => void

export type AsyncErrorEmitter = (viewId: string, message: string, requestId?: string) => void

export type EventEmitter = (viewId: string, payload: unknown) => void

export interface FrameAdapter<T = unknown, G = never> {
  handleHandshake(viewId: string): DataResult<T, G>
  handleAction?(viewId: string, action: string, payload: unknown, requestId?: string): DataResult<T, G> | null
  handleDisconnect?(viewId: string): void
  handleCancel?(viewId: string, requestId: string): void
  destroy?(): void
  getActionStrategy?(action: string): ConcurrencyStrategy | undefined
  setAsyncEmitter?(emitter: AsyncResultEmitter<T, G>): void
  setAsyncErrorEmitter?(emitter: AsyncErrorEmitter): void
  setEventEmitter?(emitter: EventEmitter): void
}
