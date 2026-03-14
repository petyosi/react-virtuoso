import { createModel } from './model-core'

import type { ConcurrencyStrategy, DataModelHandle, DataResult, FrameAdapter } from './types'

export type PipelineResult<T, G = never> = (T | G)[] | DataResult<T, G>

export type PipelineHandler<T, G = never> = (params: { data: (T | G)[]; payload: unknown }) => PipelineResult<T, G>

export type SourceMutator<T> = (params: { source: T[]; payload: unknown }) => T[]

export interface PipelineActionConfig<T, G = never> {
  stage: string
  handler: PipelineHandler<T, G>
  strategy?: ConcurrencyStrategy
}

export interface SourceMutatorConfig<T> {
  handler: SourceMutator<T>
  strategy?: ConcurrencyStrategy
}

export interface LocalSourceConfig<T, G = never> {
  data: T[]
  groups?: { index: number; level: number }[]
  pipeline?: string[]
  actions?: Record<string, PipelineActionConfig<T, G> | SourceMutatorConfig<T>>
}

function isPipelineAction<T, G>(config: PipelineActionConfig<T, G> | SourceMutatorConfig<T>): config is PipelineActionConfig<T, G> {
  return 'stage' in config
}

interface ViewPipelineState<T, G = never> {
  stageCache: ((T | G)[] | null)[]
  stagePayloads: unknown[]
  lastPipelineResult: DataResult<T, G> | null
}

export function localSource<T, G = never>(config: LocalSourceConfig<T, G>): DataModelHandle<T | G> {
  let sourceData = config.data
  let currentGroups = config.groups ?? []
  const pipeline = config.pipeline ?? []
  const actions = config.actions ?? {}

  const viewStates = new Map<string, ViewPipelineState<T, G>>()

  function getViewState(viewId: string): ViewPipelineState<T, G> {
    let state = viewStates.get(viewId)
    if (!state) {
      state = {
        stageCache: pipeline.map(() => null),
        // oxlint-disable-next-line unicorn/no-useless-undefined this is intentional
        stagePayloads: pipeline.map(() => undefined),
        lastPipelineResult: null,
      }
      viewStates.set(viewId, state)
    }
    return state
  }

  function runPipeline(viewId: string, fromStageIndex: number): DataResult<T, G> {
    const state = getViewState(viewId)
    let data: (T | G)[] = fromStageIndex === 0 ? sourceData : (state.stageCache[fromStageIndex - 1] ?? sourceData)

    for (let i = fromStageIndex; i < pipeline.length; i++) {
      const stageName = pipeline[i]!
      const payload = state.stagePayloads[i]

      if (payload === undefined) {
        state.stageCache[i] = data
        continue
      }

      const actionConfig = findPipelineActionForStage(stageName)
      if (!actionConfig) {
        state.stageCache[i] = data
        continue
      }

      const result = actionConfig.handler({ data, payload })
      if (Array.isArray(result)) {
        data = result
        state.stageCache[i] = data
      } else {
        data = result.data
        state.stageCache[i] = data
        state.lastPipelineResult = result
        if (i === pipeline.length - 1) {
          return result
        }
      }
    }

    if (state.lastPipelineResult && !Array.isArray(state.lastPipelineResult)) {
      return { data, groups: state.lastPipelineResult.groups }
    }
    return { data, groups: currentGroups }
  }

  function findPipelineActionForStage(stageName: string): PipelineActionConfig<T, G> | undefined {
    for (const actionConfig of Object.values(actions)) {
      if (isPipelineAction(actionConfig) && actionConfig.stage === stageName) {
        return actionConfig
      }
    }
    return undefined
  }

  function getStageIndex(stageName: string): number {
    return pipeline.indexOf(stageName)
  }

  function computeResult(viewId: string): DataResult<T, G> {
    if (pipeline.length === 0) {
      return { data: sourceData, groups: currentGroups }
    }
    return runPipeline(viewId, 0)
  }

  function invalidateAllStages(viewId: string) {
    const state = getViewState(viewId)
    for (let i = 0; i < state.stageCache.length; i++) {
      state.stageCache[i] = null
    }
  }

  function invalidateAllViewStages() {
    for (const [viewId] of viewStates) {
      invalidateAllStages(viewId)
    }
  }

  const adapter: FrameAdapter<T, G> = {
    handleHandshake(viewId: string): DataResult<T, G> {
      return computeResult(viewId)
    },

    getActionStrategy(action: string) {
      return actions[action]?.strategy
    },

    handleAction(viewId: string, action: string, payload: unknown, _requestId?: string): DataResult<T, G> | null {
      const actionConfig = actions[action]
      if (!actionConfig) {
        return null
      }

      if (isPipelineAction(actionConfig)) {
        const stageIndex = getStageIndex(actionConfig.stage)
        if (stageIndex === -1) {
          return null
        }

        const state = getViewState(viewId)
        state.stagePayloads[stageIndex] = payload
        const result = runPipeline(viewId, stageIndex)
        state.lastPipelineResult = result
        return result
      }

      // Source mutator affects all views
      sourceData = actionConfig.handler({ source: sourceData, payload })
      invalidateAllViewStages()
      return runPipeline(viewId, 0)
    },

    handleDisconnect(viewId: string) {
      viewStates.delete(viewId)
    },
  }

  const model = createModel(adapter)

  model.setData = (data: T[], groups?: { index: number; level: number }[]) => {
    sourceData = data
    if (groups !== undefined) {
      currentGroups = groups
    }
    invalidateAllViewStages()
    model.send({ action: 'refresh', viewId: 'default' })
  }

  return model
}
