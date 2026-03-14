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

export interface DataResult<T = unknown, G = never> {
  data: (T | G)[]
  groups: { index: number; level: number }[]
}

export interface DataModelHandle<T = unknown> {
  send(msg: { action: string; payload?: unknown; viewId?: string; requestId?: string }): void
  subscribe(listener: (msg: MessageEnvelope) => void): () => void
  destroy(): void
  setData?(data: T[], groups?: { index: number; level: number }[]): void
}

export type ConcurrencyStrategy = 'supersede' | 'queue' | 'deduplicate'

export type AsyncResultEmitter<T = unknown, G = never> = (viewId: string, result: DataResult<T, G>, requestId?: string) => void

export type EventEmitter = (viewId: string, payload: unknown) => void

export interface FrameAdapter<T = unknown, G = never> {
  handleHandshake(viewId: string): DataResult<T, G>
  handleAction?(viewId: string, action: string, payload: unknown, requestId?: string): DataResult<T, G> | null
  handleDisconnect?(viewId: string): void
  handleCancel?(viewId: string, requestId: string): void
  destroy?(): void
  getActionStrategy?(action: string): ConcurrencyStrategy | undefined
  setAsyncEmitter?(emitter: AsyncResultEmitter<T, G>): void
  setEventEmitter?(emitter: EventEmitter): void
}
