import { createModel } from './model-core'

import type { AsyncResultEmitter, ConcurrencyStrategy, DataModelHandle, DataResult, FrameAdapter } from './types'

export interface FetchParams<Params = Record<string, unknown>> {
  offset: number
  limit: number
  params: Params
  signal: AbortSignal
}

export interface FetchResult<T> {
  rows: T[]
  totalCount: number
}

export interface AppendFetchParams<Params = Record<string, unknown>> {
  cursor: unknown
  limit: number
  params: Params
  signal: AbortSignal
}

export interface AppendFetchResult<T> {
  rows: T[]
  hasMore: boolean
  cursor: unknown
}

export type ParamTransformer<Params> = (ctx: { payload: unknown; params: Params }) => Params

export interface RemoteActionConfig<Params> {
  handler: ParamTransformer<Params>
  strategy?: ConcurrencyStrategy
}

export interface OffsetViewportContext<Params = Record<string, unknown>> {
  startIndex: number
  endIndex: number
  totalCount: number
  loadedRanges: { offset: number; limit: number }[]
  params: Params
  pageSize: number
}

export type OffsetViewportAction = { fetch: { offset: number; limit: number }[] } | void

export interface AppendViewportContext<Params = Record<string, unknown>> {
  startIndex: number
  endIndex: number
  loadedCount: number
  hasMore: boolean
  fetching: boolean
  params: Params
  pageSize: number
}

export type AppendViewportAction = { loadMore: true } | void

export interface OffsetRemoteSourceConfig<T, Params = Record<string, unknown>> {
  mode?: 'offset'
  fetch: (params: FetchParams<Params>) => Promise<FetchResult<T>>
  initialParams: Params
  pageSize?: number
  actions?: Record<string, RemoteActionConfig<Params>>
  placeholder?: T
  onViewportChange?: (context: OffsetViewportContext<Params>) => OffsetViewportAction
}

export interface AppendRemoteSourceConfig<T, Params = Record<string, unknown>> {
  mode: 'append'
  fetch: (params: AppendFetchParams<Params>) => Promise<AppendFetchResult<T>>
  initialParams: Params
  pageSize?: number
  actions?: Record<string, RemoteActionConfig<Params>>
  onViewportChange?: (context: AppendViewportContext<Params>) => AppendViewportAction
}

export type RemoteSourceConfig<T, Params = Record<string, unknown>> =
  | OffsetRemoteSourceConfig<T, Params>
  | AppendRemoteSourceConfig<T, Params>

interface LoadedRange {
  offset: number
  limit: number
}

interface OffsetViewData<T> {
  sparseData: (T | undefined)[]
  totalCount: number
  loadedRanges: LoadedRange[]
  abortController: AbortController | null
  viewportAbortControllers: Set<AbortController>
  pendingViewportFetches: Set<string>
}

interface AppendViewData<T> {
  data: T[]
  cursor: unknown
  hasMore: boolean
  fetching: boolean
  abortController: AbortController | null
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
  return { data: [...vd.data], groups: [] }
}

function abortAppendInFlight<T>(vd: AppendViewData<T>) {
  if (vd.abortController) {
    vd.abortController.abort()
    vd.abortController = null
  }
  vd.fetching = false
}

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

export function defaultAppendViewportHandler<Params>(context: AppendViewportContext<Params>): AppendViewportAction {
  const { endIndex, loadedCount, hasMore, fetching, pageSize } = context
  if (!fetching && hasMore && endIndex >= loadedCount - Math.floor(pageSize / 2)) {
    return { loadMore: true }
  }
}

// Offset mode implementation
function createOffsetSource<T, Params>(config: OffsetRemoteSourceConfig<T, Params>): DataModelHandle<T> {
  let currentParams = config.initialParams
  const pageSize = config.pageSize ?? 50
  const actions = config.actions ?? {}
  const placeholder = config.placeholder

  const viewDataMap = new Map<string, OffsetViewData<T>>()
  const requestAbortMap = new Map<string, AbortController>()
  let asyncEmit: AsyncResultEmitter<T> | null = null

  function getViewData(viewId: string): OffsetViewData<T> {
    let vd = viewDataMap.get(viewId)
    if (!vd) {
      vd = {
        sparseData: [],
        totalCount: 0,
        loadedRanges: [],
        abortController: null,
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
    return { data, groups: [] }
  }

  async function doFetch(viewId: string, offset: number, limit: number, requestId?: string) {
    const vd = getViewData(viewId)
    abortOffsetInFlight(vd)

    const controller = new AbortController()
    vd.abortController = controller
    if (requestId) {
      requestAbortMap.set(requestId, controller)
    }

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
      for (let i = 0; i < result.rows.length; i++) {
        vd.sparseData[offset + i] = result.rows[i]
      }
      addLoadedRange(vd, offset, result.rows.length)
      vd.abortController = null

      asyncEmit?.(viewId, buildResult(vd), requestId)
    } catch {
      // Fetch aborted or failed
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
      for (let i = 0; i < result.rows.length; i++) {
        vd.sparseData[offset + i] = result.rows[i]
      }
      addLoadedRange(vd, offset, result.rows.length)

      asyncEmit?.(viewId, buildResult(vd))
    } catch {
      // Fetch aborted or failed
    } finally {
      vd.viewportAbortControllers.delete(controller)
      vd.pendingViewportFetches.delete(key)
    }
  }

  const adapter: FrameAdapter<T> = {
    handleHandshake(viewId: string): DataResult<T> {
      const vd = getViewData(viewId)
      void doFetch(viewId, 0, pageSize)
      return buildResult(vd)
    },

    setAsyncEmitter(emitter: AsyncResultEmitter<T>) {
      asyncEmit = emitter
    },

    getActionStrategy(action: string) {
      return actions[action]?.strategy
    },

    handleAction(viewId: string, action: string, payload: unknown, requestId?: string): DataResult<T> | null {
      if (action === 'loadRange') {
        const { offset, limit } = payload as { offset: number; limit: number }
        const vd = getViewData(viewId)
        if (!isRangeLoaded(vd, offset, limit)) {
          void doFetch(viewId, offset, limit, requestId)
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

      const vd = getViewData(viewId)
      abortOffsetInFlight(vd)
      invalidateOffsetRanges(vd)

      void doFetch(viewId, 0, pageSize, requestId)
      return buildResult(vd)
    },

    handleCancel(_viewId: string, requestId: string) {
      const controller = requestAbortMap.get(requestId)
      if (controller) {
        controller.abort()
        requestAbortMap.delete(requestId)
      }
    },

    handleDisconnect(viewId: string) {
      const vd = viewDataMap.get(viewId)
      if (vd) {
        abortOffsetInFlight(vd)
        viewDataMap.delete(viewId)
      }
    },

    destroy() {
      for (const [, vd] of viewDataMap) {
        abortOffsetInFlight(vd)
      }
      viewDataMap.clear()
      for (const [, controller] of requestAbortMap) {
        controller.abort()
      }
      requestAbortMap.clear()
    },
  }

  return createModel(adapter)
}

// Append mode implementation
function createAppendSource<T, Params>(config: AppendRemoteSourceConfig<T, Params>): DataModelHandle<T> {
  let currentParams = config.initialParams
  const pageSize = config.pageSize ?? 50
  const actions = config.actions ?? {}

  const viewDataMap = new Map<string, AppendViewData<T>>()
  const requestAbortMap = new Map<string, AbortController>()
  let asyncEmit: AsyncResultEmitter<T> | null = null

  function getViewData(viewId: string): AppendViewData<T> {
    let vd = viewDataMap.get(viewId)
    if (!vd) {
      vd = { data: [], cursor: undefined, hasMore: true, fetching: false, abortController: null }
      viewDataMap.set(viewId, vd)
    }
    return vd
  }

  function resetView(vd: AppendViewData<T>) {
    abortAppendInFlight(vd)
    vd.data = []
    vd.cursor = undefined
    vd.hasMore = true
  }

  async function doFetch(viewId: string, requestId?: string) {
    const vd = getViewData(viewId)
    if (vd.fetching || !vd.hasMore) {
      return
    }

    vd.fetching = true
    const controller = new AbortController()
    vd.abortController = controller
    if (requestId) {
      requestAbortMap.set(requestId, controller)
    }

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
      vd.cursor = result.cursor
      vd.hasMore = result.hasMore
      vd.fetching = false
      vd.abortController = null

      asyncEmit?.(viewId, buildAppendResult(vd), requestId)
    } catch {
      vd.fetching = false
    } finally {
      if (requestId) {
        requestAbortMap.delete(requestId)
      }
    }
  }

  const adapter: FrameAdapter<T> = {
    handleHandshake(viewId: string): DataResult<T> {
      const vd = getViewData(viewId)
      void doFetch(viewId)
      return buildAppendResult(vd)
    },

    setAsyncEmitter(emitter: AsyncResultEmitter<T>) {
      asyncEmit = emitter
    },

    getActionStrategy(action: string) {
      return actions[action]?.strategy
    },

    handleAction(viewId: string, action: string, payload: unknown, requestId?: string): DataResult<T> | null {
      if (action === 'loadMore') {
        void doFetch(viewId, requestId)
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
          void doFetch(viewId)
        }
        return null
      }

      const actionConfig = actions[action]
      if (!actionConfig) {
        return null
      }

      currentParams = actionConfig.handler({ payload, params: currentParams })

      const vd = getViewData(viewId)
      resetView(vd)
      void doFetch(viewId, requestId)
      return buildAppendResult(vd)
    },

    handleCancel(_viewId: string, requestId: string) {
      const controller = requestAbortMap.get(requestId)
      if (controller) {
        controller.abort()
        requestAbortMap.delete(requestId)
      }
    },

    handleDisconnect(viewId: string) {
      const vd = viewDataMap.get(viewId)
      if (vd) {
        abortAppendInFlight(vd)
        viewDataMap.delete(viewId)
      }
    },

    destroy() {
      for (const [, vd] of viewDataMap) {
        abortAppendInFlight(vd)
      }
      viewDataMap.clear()
      for (const [, controller] of requestAbortMap) {
        controller.abort()
      }
      requestAbortMap.clear()
    },
  }

  return createModel(adapter)
}

export function remoteSource<T, Params = Record<string, unknown>>(config: RemoteSourceConfig<T, Params>): DataModelHandle<T> {
  if (config.mode === 'append') {
    return createAppendSource(config)
  }
  return createOffsetSource(config as OffsetRemoteSourceConfig<T, Params>)
}
