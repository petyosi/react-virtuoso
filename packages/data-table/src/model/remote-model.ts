import { createActionStateTracker } from './action-state'
import { createModel } from './model-core'
import {
  capturePersistedAction,
  emptyModelPersistenceState,
  isModelPersistenceState,
  notifyModelPersistenceSubscribers,
  persistedActionIsEmpty,
  persistenceKeyForAction,
} from './persistence'
import { warnModelActionInDev } from './reserved-actions'

import type { InitialModelAction } from './action-state'
import type { ModelActionPersistenceConfig } from './persistence'
import type {
  AsyncErrorEmitter,
  AsyncResultEmitter,
  ConcurrencyStrategy,
  DataModelHandle,
  DataResult,
  EventEmitter,
  FrameAdapter,
  ModelPersistenceState,
} from './types'

/**
 * Parameters for an offset-based fetch request.
 *
 * @group Data Models
 */
export interface FetchParams<Params = Record<string, unknown>> {
  offset: number
  limit: number
  params: Params
  signal: AbortSignal
}

/**
 * Result for an offset-based fetch request.
 *
 * @group Data Models
 */
export interface FetchResult<T> {
  groups?: { index: number; level: number }[]
  rows: T[]
  totalCount: number
}

/**
 * Parameters for an append-mode fetch request.
 *
 * @group Data Models
 */
export interface AppendFetchParams<Params = Record<string, unknown>> {
  cursor: unknown
  limit: number
  params: Params
  signal: AbortSignal
}

/**
 * Result for an append-mode fetch request.
 *
 * @group Data Models
 */
export interface AppendFetchResult<T> {
  rows: T[]
  hasMore: boolean
  cursor: unknown
  groups?: { index: number; level: number }[]
}

/**
 * Loading reasons emitted by `remoteModel()`.
 *
 * @group Data Models
 */
export type RemoteModelLoadingReason = 'initial' | 'refresh' | 'end' | 'viewport'

/**
 * Loading lifecycle phase emitted by `remoteModel()`.
 *
 * @group Data Models
 */
export type RemoteModelLoadingPhase = 'start' | 'success' | 'error' | 'cancel'

/**
 * Event payload emitted by `remoteModel()` through the model event channel.
 *
 * @group Data Models
 */
export interface RemoteModelLoadingEvent {
  kind: 'loading'
  reason: RemoteModelLoadingReason
  phase: RemoteModelLoadingPhase
  errorMessage?: string
}

/**
 * Transforms action payloads into remote query params.
 *
 * @group Data Models
 */
export type ParamTransformer<Params> = (ctx: { payload: unknown; params: Params }) => Params

/**
 * Configuration for a remote action.
 *
 * @group Data Models
 */
export interface RemoteActionConfig<Params> {
  handler: ParamTransformer<Params>
  persistence?: ModelActionPersistenceConfig<unknown, Params>
  strategy?: ConcurrencyStrategy
}

/**
 * Context passed to an offset viewport handler.
 *
 * @group Data Models
 */
export interface OffsetViewportContext<Params = Record<string, unknown>> {
  startIndex: number
  endIndex: number
  totalCount: number
  loadedRanges: { offset: number; limit: number }[]
  params: Params
  pageSize: number
}

/**
 * Action returned by an offset viewport handler.
 *
 * @group Data Models
 */
export type OffsetViewportAction = { fetch: { offset: number; limit: number }[] } | void

/**
 * Context passed to an append viewport handler.
 *
 * @group Data Models
 */
export interface AppendViewportContext<Params = Record<string, unknown>> {
  startIndex: number
  endIndex: number
  loadedCount: number
  hasMore: boolean
  fetching: boolean
  params: Params
  pageSize: number
}

/**
 * Action returned by an append viewport handler.
 *
 * @group Data Models
 */
export type AppendViewportAction = { loadMore: true } | void

/**
 * Configuration for an offset-mode remote model.
 *
 * @group Data Models
 */
export interface OffsetRemoteModelConfig<T, Params = Record<string, unknown>> {
  mode?: 'offset'
  fetch: (params: FetchParams<Params>) => Promise<FetchResult<T>>
  initialParams: Params
  pageSize?: number
  actions?: Record<string, RemoteActionConfig<Params>>
  placeholder?: T
  initialActions?: InitialModelAction[]
  onViewportChange?: (context: OffsetViewportContext<Params>) => OffsetViewportAction
  onError?: (error: Error) => void
}

/**
 * Configuration for an append-mode remote model.
 *
 * @group Data Models
 */
export interface AppendRemoteModelConfig<T, Params = Record<string, unknown>> {
  mode: 'append'
  fetch: (params: AppendFetchParams<Params>) => Promise<AppendFetchResult<T>>
  initialParams: Params
  pageSize?: number
  actions?: Record<string, RemoteActionConfig<Params>>
  initialActions?: InitialModelAction[]
  onViewportChange?: (context: AppendViewportContext<Params>) => AppendViewportAction
  onError?: (error: Error) => void
}

/**
 * Configuration for `remoteModel()`.
 *
 * @group Data Models
 */
export type RemoteModelConfig<T, Params = Record<string, unknown>> = OffsetRemoteModelConfig<T, Params> | AppendRemoteModelConfig<T, Params>

interface LoadedRange {
  offset: number
  limit: number
}

interface OffsetViewData<T> {
  sparseData: (T | undefined)[]
  groups: { index: number; level: number }[]
  totalCount: number
  loadedRanges: LoadedRange[]
  abortController: AbortController | null
  abortReason: RemoteModelLoadingReason | null
  viewportAbortControllers: Set<AbortController>
  pendingViewportFetches: Set<string>
}

interface AppendViewData<T> {
  data: T[]
  groups: { index: number; level: number }[]
  cursor: unknown
  hasMore: boolean
  fetching: boolean
  abortController: AbortController | null
  abortReason: RemoteModelLoadingReason | null
}

function isRangeLoaded<T>(vd: OffsetViewData<T>, offset: number, limit: number): boolean {
  for (const range of vd.loadedRanges) {
    if (range.offset <= offset && range.offset + range.limit >= offset + limit) {
      return true
    }
  }
  return false
}

function invalidateOffsetRanges<T>(vd: OffsetViewData<T>) {
  vd.loadedRanges = []
  vd.sparseData = []
  vd.groups = []
  vd.totalCount = 0
}

function abortOffsetInFlight<T>(vd: OffsetViewData<T>) {
  if (vd.abortController) {
    vd.abortController.abort()
    vd.abortController = null
  }
  for (const controller of vd.viewportAbortControllers) {
    controller.abort()
  }
  vd.viewportAbortControllers.clear()
  vd.pendingViewportFetches.clear()
}

function buildAppendResult<T>(vd: AppendViewData<T>): DataResult<T> {
  return { data: [...vd.data], groups: vd.groups }
}

function abortAppendInFlight<T>(vd: AppendViewData<T>) {
  if (vd.abortController) {
    vd.abortController.abort()
    vd.abortController = null
  }
  vd.fetching = false
}

function emitLoadingEvent(
  emit: EventEmitter | null,
  viewId: string,
  reason: RemoteModelLoadingReason,
  phase: RemoteModelLoadingPhase,
  errorMessage?: string
) {
  emit?.(viewId, {
    kind: 'loading',
    reason,
    phase,
    ...(errorMessage ? { errorMessage } : {}),
  } satisfies RemoteModelLoadingEvent)
}

/**
 * Default viewport strategy for offset mode.
 *
 * @group Data Models
 */
export function defaultOffsetViewportHandler<Params>(context: OffsetViewportContext<Params>): OffsetViewportAction {
  const { startIndex, endIndex, loadedRanges, pageSize } = context
  const pageStart = Math.floor(startIndex / pageSize) * pageSize
  const pageEnd = Math.ceil((endIndex + 1) / pageSize) * pageSize

  const gaps: { offset: number; limit: number }[] = []
  let cursor = pageStart

  for (const range of loadedRanges) {
    if (range.offset > cursor && cursor < pageEnd) {
      const gapEnd = Math.min(range.offset, pageEnd)
      gaps.push({ offset: cursor, limit: gapEnd - cursor })
    }
    cursor = Math.max(cursor, range.offset + range.limit)
  }

  if (cursor < pageEnd) {
    gaps.push({ offset: cursor, limit: pageEnd - cursor })
  }

  if (gaps.length > 0) {
    return { fetch: gaps }
  }
}

/**
 * Default viewport strategy for append mode.
 *
 * @group Data Models
 */
export function defaultAppendViewportHandler<Params>(context: AppendViewportContext<Params>): AppendViewportAction {
  const { endIndex, loadedCount, hasMore, fetching, pageSize } = context
  if (!fetching && hasMore && endIndex >= loadedCount - Math.floor(pageSize / 2)) {
    return { loadMore: true }
  }
}

// Offset mode implementation
function createOffsetModel<T, Params>(config: OffsetRemoteModelConfig<T, Params>): DataModelHandle<T> {
  let currentParams = config.initialParams
  const pageSize = config.pageSize ?? 50
  const actions = config.actions ?? {}
  const placeholder = config.placeholder

  const viewDataMap = new Map<string, OffsetViewData<T>>()
  const requestAbortMap = new Map<string, AbortController>()
  const persistedActionStates = new Map<string, unknown>()
  const actionState = createActionStateTracker()
  const persistenceSubscribers = new Set<() => void>()
  let asyncEmit: AsyncResultEmitter<T> | null = null
  let asyncErrorEmit: AsyncErrorEmitter | null = null
  let asyncEventEmit: EventEmitter | null = null

  function getViewData(viewId: string): OffsetViewData<T> {
    let vd = viewDataMap.get(viewId)
    if (!vd) {
      vd = {
        sparseData: [],
        groups: [],
        totalCount: 0,
        loadedRanges: [],
        abortController: null,
        abortReason: null,
        viewportAbortControllers: new Set(),
        pendingViewportFetches: new Set(),
      }
      viewDataMap.set(viewId, vd)
    }
    return vd
  }

  function addLoadedRange(vd: OffsetViewData<T>, offset: number, limit: number) {
    vd.loadedRanges = [...vd.loadedRanges, { offset, limit }].toSorted((a, b) => a.offset - b.offset)
    const merged: LoadedRange[] = []
    for (const range of vd.loadedRanges) {
      const last = merged.at(-1)
      if (last && last.offset + last.limit >= range.offset) {
        last.limit = Math.max(last.limit, range.offset + range.limit - last.offset)
      } else {
        merged.push({ ...range })
      }
    }
    vd.loadedRanges = merged
  }

  function buildResult(vd: OffsetViewData<T>): DataResult<T> {
    const data: T[] = Array.from({ length: vd.totalCount }, (_, i) => vd.sparseData[i] ?? (placeholder as T))
    return { data, groups: vd.groups }
  }

  function updatePersistedActionState(action: string, payload: unknown, params: Params) {
    const actionConfig = actions[action]
    const persistence = actionConfig?.persistence
    const key = persistenceKeyForAction(action, persistence)
    if (!key || !persistence) {
      return
    }

    const persisted = capturePersistedAction(action, payload, params, persistence)
    if (persistedActionIsEmpty(persisted, persistence)) {
      persistedActionStates.delete(key)
    } else {
      persistedActionStates.set(key, persisted)
    }
    notifyModelPersistenceSubscribers(persistenceSubscribers)
  }

  function capturePersistenceState(previous: ModelPersistenceState | null): ModelPersistenceState {
    const next = emptyModelPersistenceState(previous)
    for (const [action, actionConfig] of Object.entries(actions)) {
      const key = persistenceKeyForAction(action, actionConfig.persistence)
      if (key) {
        delete next.actions[key]
      }
    }

    for (const [key, value] of persistedActionStates) {
      next.actions[key] = value
    }

    return next
  }

  function restoreParamsFromPersistenceState(state: ModelPersistenceState | null): Params {
    if (!isModelPersistenceState(state)) {
      persistedActionStates.clear()
      return config.initialParams
    }

    let params = config.initialParams
    persistedActionStates.clear()

    for (const [action, actionConfig] of Object.entries(actions)) {
      const persistence = actionConfig.persistence
      const key = persistenceKeyForAction(action, persistence)
      if (!key || !persistence || !Object.hasOwn(state.actions, key)) {
        continue
      }

      const persisted = state.actions[key]
      if (typeof persistence === 'object' && persistence.restore) {
        params = persistence.restore({ action, persisted, state: params })
      } else {
        params = actionConfig.handler({ payload: persisted, params })
      }

      if (!persistedActionIsEmpty(persisted, persistence)) {
        persistedActionStates.set(key, persisted)
      }
    }

    return params
  }

  function restorePersistenceState(viewId: string, state: ModelPersistenceState | null) {
    currentParams = restoreParamsFromPersistenceState(state)

    if (viewDataMap.size === 0) {
      notifyModelPersistenceSubscribers(persistenceSubscribers)
      return
    }

    for (const [activeViewId, vd] of viewDataMap) {
      cancelMainFetch(activeViewId, vd)
      invalidateOffsetRanges(vd)
      void doFetch(activeViewId, 0, pageSize, activeViewId === viewId ? 'refresh' : 'initial')
    }

    notifyModelPersistenceSubscribers(persistenceSubscribers)
  }

  function applyInitialActions() {
    if (!config.initialActions) {
      return
    }

    for (const initialAction of config.initialActions) {
      const actionConfig = actions[initialAction.action]
      if (!actionConfig) {
        warnModelActionInDev(`Initial model action "${initialAction.action}" is not declared and was ignored.`)
        continue
      }

      currentParams = actionConfig.handler({ payload: initialAction.payload, params: currentParams })
      updatePersistedActionState(initialAction.action, initialAction.payload, currentParams)
      actionState.update(initialAction.action, initialAction.payload, 'default', false)
    }
  }

  applyInitialActions()

  function cancelMainFetch(viewId: string, vd: OffsetViewData<T>) {
    if (vd.abortController && vd.abortReason !== null) {
      emitLoadingEvent(asyncEventEmit, viewId, vd.abortReason, 'cancel')
    }
    abortOffsetInFlight(vd)
    vd.abortReason = null
  }

  async function doFetch(viewId: string, offset: number, limit: number, reason: RemoteModelLoadingReason, requestId?: string) {
    const vd = getViewData(viewId)
    cancelMainFetch(viewId, vd)

    const controller = new AbortController()
    vd.abortController = controller
    vd.abortReason = reason
    if (requestId) {
      requestAbortMap.set(requestId, controller)
    }
    emitLoadingEvent(asyncEventEmit, viewId, reason, 'start')

    try {
      const result = await config.fetch({
        offset,
        limit,
        params: currentParams,
        signal: controller.signal,
      })

      if (controller.signal.aborted) {
        return
      }

      vd.totalCount = result.totalCount
      if (result.groups) {
        vd.groups = result.groups
      }
      for (let i = 0; i < result.rows.length; i++) {
        vd.sparseData[offset + i] = result.rows[i]
      }
      addLoadedRange(vd, offset, result.rows.length)
      vd.abortController = null
      vd.abortReason = null

      emitLoadingEvent(asyncEventEmit, viewId, reason, 'success')
      asyncEmit?.(viewId, buildResult(vd), requestId)
    } catch (error) {
      if (!controller.signal.aborted) {
        const err = error instanceof Error ? error : new Error(String(error))
        vd.abortController = null
        vd.abortReason = null
        emitLoadingEvent(asyncEventEmit, viewId, reason, 'error', err.message)
        config.onError?.(err)
        asyncErrorEmit?.(viewId, err.message, requestId)
      }
    } finally {
      if (requestId) {
        requestAbortMap.delete(requestId)
      }
    }
  }

  async function doViewportFetch(viewId: string, offset: number, limit: number) {
    const vd = getViewData(viewId)
    const key = `${offset}:${limit}`
    if (vd.pendingViewportFetches.has(key)) {
      return
    }
    vd.pendingViewportFetches.add(key)

    const controller = new AbortController()
    vd.viewportAbortControllers.add(controller)

    try {
      const result = await config.fetch({
        offset,
        limit,
        params: currentParams,
        signal: controller.signal,
      })

      if (controller.signal.aborted) {
        return
      }

      vd.totalCount = result.totalCount
      if (result.groups) {
        vd.groups = result.groups
      }
      for (let i = 0; i < result.rows.length; i++) {
        vd.sparseData[offset + i] = result.rows[i]
      }
      addLoadedRange(vd, offset, result.rows.length)

      asyncEmit?.(viewId, buildResult(vd))
    } catch (error) {
      if (!controller.signal.aborted) {
        const err = error instanceof Error ? error : new Error(String(error))
        config.onError?.(err)
        asyncErrorEmit?.(viewId, err.message)
      }
    } finally {
      vd.viewportAbortControllers.delete(controller)
      vd.pendingViewportFetches.delete(key)
    }
  }

  const adapter: FrameAdapter<T> = {
    handleHandshake(viewId: string): DataResult<T> {
      const vd = getViewData(viewId)
      void doFetch(viewId, 0, pageSize, 'initial')
      return buildResult(vd)
    },

    setAsyncEmitter(emitter: AsyncResultEmitter<T>) {
      asyncEmit = emitter
    },

    setAsyncErrorEmitter(emitter: AsyncErrorEmitter) {
      asyncErrorEmit = emitter
    },

    setEventEmitter(emitter: EventEmitter) {
      asyncEventEmit = emitter
    },

    getActionStrategy(action: string) {
      return actions[action]?.strategy
    },

    handleAction(viewId: string, action: string, payload: unknown, requestId?: string): DataResult<T> | null {
      if (action === 'loadRange') {
        const { offset, limit } = payload as { offset: number; limit: number }
        const vd = getViewData(viewId)
        if (!isRangeLoaded(vd, offset, limit)) {
          void doFetch(viewId, offset, limit, 'viewport', requestId)
        }
        return null
      }

      if (action === 'viewportChange') {
        if (!config.onViewportChange) {
          return null
        }
        const { startIndex, endIndex } = payload as { startIndex: number; endIndex: number }
        const vd = getViewData(viewId)
        const context: OffsetViewportContext<Params> = {
          startIndex,
          endIndex,
          totalCount: vd.totalCount,
          loadedRanges: [...vd.loadedRanges],
          params: currentParams,
          pageSize,
        }
        const result = config.onViewportChange(context)
        if (result && 'fetch' in result) {
          for (const { offset, limit } of result.fetch) {
            if (!isRangeLoaded(vd, offset, limit)) {
              void doViewportFetch(viewId, offset, limit)
            }
          }
        }
        return null
      }

      const actionConfig = actions[action]
      if (!actionConfig) {
        return null
      }

      currentParams = actionConfig.handler({ payload, params: currentParams })
      updatePersistedActionState(action, payload, currentParams)
      actionState.update(action, payload, viewId)

      const vd = getViewData(viewId)
      cancelMainFetch(viewId, vd)
      invalidateOffsetRanges(vd)

      void doFetch(viewId, 0, pageSize, 'refresh', requestId)
      return null
    },

    handleCancel(_viewId: string, requestId: string) {
      const controller = requestAbortMap.get(requestId)
      if (controller) {
        for (const [viewId, vd] of viewDataMap) {
          if (vd.abortController === controller && vd.abortReason !== null) {
            emitLoadingEvent(asyncEventEmit, viewId, vd.abortReason, 'cancel')
            vd.abortController = null
            vd.abortReason = null
            break
          }
        }
        controller.abort()
        requestAbortMap.delete(requestId)
      }
    },

    handleDisconnect(viewId: string) {
      const vd = viewDataMap.get(viewId)
      if (vd) {
        cancelMainFetch(viewId, vd)
        viewDataMap.delete(viewId)
      }
    },

    destroy() {
      for (const [viewId, vd] of viewDataMap) {
        cancelMainFetch(viewId, vd)
      }
      viewDataMap.clear()
      for (const [, controller] of requestAbortMap) {
        controller.abort()
      }
      requestAbortMap.clear()
    },
  }

  const model = createModel(adapter)
  model.getActionState = actionState.getState
  model.subscribeToActionState = actionState.subscribe
  model.persistence = {
    capture(_viewId, previous) {
      return capturePersistenceState(previous)
    },
    restore(viewId, state) {
      restorePersistenceState(viewId, state)
    },
    subscribe(_viewId, onChange) {
      persistenceSubscribers.add(onChange)
      return () => {
        persistenceSubscribers.delete(onChange)
      }
    },
  }
  return model
}

// Append mode implementation
function createAppendModel<T, Params>(config: AppendRemoteModelConfig<T, Params>): DataModelHandle<T> {
  let currentParams = config.initialParams
  const pageSize = config.pageSize ?? 50
  const actions = config.actions ?? {}

  const viewDataMap = new Map<string, AppendViewData<T>>()
  const requestAbortMap = new Map<string, AbortController>()
  const persistedActionStates = new Map<string, unknown>()
  const actionState = createActionStateTracker()
  const persistenceSubscribers = new Set<() => void>()
  let asyncEmit: AsyncResultEmitter<T> | null = null
  let asyncErrorEmit: AsyncErrorEmitter | null = null
  let asyncEventEmit: EventEmitter | null = null

  function updatePersistedActionState(action: string, payload: unknown, params: Params) {
    const actionConfig = actions[action]
    const persistence = actionConfig?.persistence
    const key = persistenceKeyForAction(action, persistence)
    if (!key || !persistence) {
      return
    }

    const persisted = capturePersistedAction(action, payload, params, persistence)
    if (persistedActionIsEmpty(persisted, persistence)) {
      persistedActionStates.delete(key)
    } else {
      persistedActionStates.set(key, persisted)
    }
    notifyModelPersistenceSubscribers(persistenceSubscribers)
  }

  function capturePersistenceState(previous: ModelPersistenceState | null): ModelPersistenceState {
    const next = emptyModelPersistenceState(previous)

    for (const [action, actionConfig] of Object.entries(actions)) {
      const key = persistenceKeyForAction(action, actionConfig.persistence)
      if (key) {
        delete next.actions[key]
      }
    }

    for (const [key, value] of persistedActionStates) {
      next.actions[key] = value
    }

    return next
  }

  function restoreParamsFromPersistenceState(state: ModelPersistenceState | null): Params {
    if (!isModelPersistenceState(state)) {
      persistedActionStates.clear()
      return config.initialParams
    }

    let params = config.initialParams
    persistedActionStates.clear()

    for (const [action, actionConfig] of Object.entries(actions)) {
      const persistence = actionConfig.persistence
      const key = persistenceKeyForAction(action, persistence)
      if (!key || !persistence || !Object.hasOwn(state.actions, key)) {
        continue
      }

      const persisted = state.actions[key]
      if (typeof persistence === 'object' && persistence.restore) {
        params = persistence.restore({ action, persisted, state: params })
      } else {
        params = actionConfig.handler({ payload: persisted, params })
      }

      if (!persistedActionIsEmpty(persisted, persistence)) {
        persistedActionStates.set(key, persisted)
      }
    }

    return params
  }

  function getViewData(viewId: string): AppendViewData<T> {
    let vd = viewDataMap.get(viewId)
    if (!vd) {
      vd = { data: [], groups: [], cursor: undefined, hasMore: true, fetching: false, abortController: null, abortReason: null }
      viewDataMap.set(viewId, vd)
    }
    return vd
  }

  function cancelAppendFetch(viewId: string, vd: AppendViewData<T>) {
    if (vd.abortController && vd.abortReason !== null) {
      emitLoadingEvent(asyncEventEmit, viewId, vd.abortReason, 'cancel')
    }
    abortAppendInFlight(vd)
    vd.abortReason = null
  }

  function resetView(viewId: string, vd: AppendViewData<T>) {
    cancelAppendFetch(viewId, vd)
    vd.data = []
    vd.groups = []
    vd.cursor = undefined
    vd.hasMore = true
  }

  async function doFetch(viewId: string, reason: RemoteModelLoadingReason, requestId?: string) {
    const vd = getViewData(viewId)
    if (vd.fetching || !vd.hasMore) {
      if (requestId) {
        asyncEmit?.(viewId, buildAppendResult(vd), requestId)
      }
      return
    }

    vd.fetching = true
    const controller = new AbortController()
    vd.abortController = controller
    vd.abortReason = reason
    if (requestId) {
      requestAbortMap.set(requestId, controller)
    }
    emitLoadingEvent(asyncEventEmit, viewId, reason, 'start')

    try {
      const result = await config.fetch({
        cursor: vd.cursor,
        limit: pageSize,
        params: currentParams,
        signal: controller.signal,
      })

      if (controller.signal.aborted) {
        return
      }

      vd.data.push(...result.rows)
      if (result.groups) {
        vd.groups = result.groups
      }
      vd.cursor = result.cursor
      vd.hasMore = result.hasMore

      emitLoadingEvent(asyncEventEmit, viewId, reason, 'success')
      asyncEmit?.(viewId, buildAppendResult(vd), requestId)
    } catch (error) {
      if (!controller.signal.aborted) {
        const err = error instanceof Error ? error : new Error(String(error))
        emitLoadingEvent(asyncEventEmit, viewId, reason, 'error', err.message)
        config.onError?.(err)
        asyncErrorEmit?.(viewId, err.message, requestId)
      }
    } finally {
      vd.fetching = false
      vd.abortController = null
      vd.abortReason = null
      if (requestId) {
        requestAbortMap.delete(requestId)
      }
    }
  }

  function restorePersistenceState(viewId: string, state: ModelPersistenceState | null) {
    currentParams = restoreParamsFromPersistenceState(state)

    if (viewDataMap.size === 0) {
      notifyModelPersistenceSubscribers(persistenceSubscribers)
      return
    }

    for (const [activeViewId, vd] of viewDataMap) {
      resetView(activeViewId, vd)
      void doFetch(activeViewId, activeViewId === viewId ? 'refresh' : 'initial')
    }

    notifyModelPersistenceSubscribers(persistenceSubscribers)
  }

  function applyInitialActions() {
    if (!config.initialActions) {
      return
    }

    for (const initialAction of config.initialActions) {
      const actionConfig = actions[initialAction.action]
      if (!actionConfig) {
        warnModelActionInDev(`Initial model action "${initialAction.action}" is not declared and was ignored.`)
        continue
      }

      currentParams = actionConfig.handler({ payload: initialAction.payload, params: currentParams })
      updatePersistedActionState(initialAction.action, initialAction.payload, currentParams)
      actionState.update(initialAction.action, initialAction.payload, 'default', false)
    }
  }

  applyInitialActions()

  const adapter: FrameAdapter<T> = {
    handleHandshake(viewId: string): DataResult<T> {
      const vd = getViewData(viewId)
      void doFetch(viewId, 'initial')
      return buildAppendResult(vd)
    },

    setAsyncEmitter(emitter: AsyncResultEmitter<T>) {
      asyncEmit = emitter
    },

    setAsyncErrorEmitter(emitter: AsyncErrorEmitter) {
      asyncErrorEmit = emitter
    },

    setEventEmitter(emitter: EventEmitter) {
      asyncEventEmit = emitter
    },

    getActionStrategy(action: string) {
      if (action === 'loadMore') {
        return 'deduplicate'
      }
      return actions[action]?.strategy
    },

    handleAction(viewId: string, action: string, payload: unknown, requestId?: string): DataResult<T> | null {
      if (action === 'loadMore') {
        void doFetch(viewId, 'end', requestId)
        return null
      }

      if (action === 'viewportChange') {
        if (!config.onViewportChange) {
          return null
        }
        const { startIndex, endIndex } = payload as { startIndex: number; endIndex: number }
        const vd = getViewData(viewId)
        const context: AppendViewportContext<Params> = {
          startIndex,
          endIndex,
          loadedCount: vd.data.length,
          hasMore: vd.hasMore,
          fetching: vd.fetching,
          params: currentParams,
          pageSize,
        }
        const result = config.onViewportChange(context)
        if (result && 'loadMore' in result) {
          void doFetch(viewId, 'end')
        }
        return null
      }

      const actionConfig = actions[action]
      if (!actionConfig) {
        return null
      }

      currentParams = actionConfig.handler({ payload, params: currentParams })
      updatePersistedActionState(action, payload, currentParams)
      actionState.update(action, payload, viewId)

      const vd = getViewData(viewId)
      resetView(viewId, vd)
      void doFetch(viewId, 'refresh', requestId)
      return null
    },

    handleCancel(_viewId: string, requestId: string) {
      const controller = requestAbortMap.get(requestId)
      if (controller) {
        for (const [viewId, vd] of viewDataMap) {
          if (vd.abortController === controller && vd.abortReason !== null) {
            emitLoadingEvent(asyncEventEmit, viewId, vd.abortReason, 'cancel')
            vd.abortController = null
            vd.abortReason = null
            vd.fetching = false
            break
          }
        }
        controller.abort()
        requestAbortMap.delete(requestId)
      }
    },

    handleDisconnect(viewId: string) {
      const vd = viewDataMap.get(viewId)
      if (vd) {
        cancelAppendFetch(viewId, vd)
        viewDataMap.delete(viewId)
      }
    },

    destroy() {
      for (const [viewId, vd] of viewDataMap) {
        cancelAppendFetch(viewId, vd)
      }
      viewDataMap.clear()
      for (const [, controller] of requestAbortMap) {
        controller.abort()
      }
      requestAbortMap.clear()
    },
  }

  const model = createModel(adapter)
  model.getActionState = actionState.getState
  model.subscribeToActionState = actionState.subscribe
  model.persistence = {
    capture(_viewId, previous) {
      return capturePersistenceState(previous)
    },
    restore(viewId, state) {
      restorePersistenceState(viewId, state)
    },
    subscribe(_viewId, onChange) {
      persistenceSubscribers.add(onChange)
      return () => {
        persistenceSubscribers.delete(onChange)
      }
    },
  }
  return model
}

/**
 * Creates a remote reactive data model for the table.
 *
 * @group Data Models
 */
export function remoteModel<T, Params = Record<string, unknown>>(config: RemoteModelConfig<T, Params>): DataModelHandle<T> {
  if (config.mode === 'append') {
    return createAppendModel(config)
  }
  return createOffsetModel(config)
}
