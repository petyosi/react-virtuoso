import * as React from 'react'

import { useEngine, useIsomorphicLayoutEffect } from '@virtuoso.dev/reactive-engine-react'

import { dataModel$, dataModelViewId$ } from '../../model/model-bridge'

import type { DataModelHandle, ModelPersistenceState } from '../../model/types'
import type { Engine } from '@virtuoso.dev/reactive-engine-core'

/**
 * Persisted data-table state envelope. Individual feature adapters own the
 * shape of their entries under `features`.
 *
 * @group State Persistence
 */
export interface DataTablePersistenceState {
  version: 1
  features: Record<string, unknown>
}

/**
 * Storage interface used by {@link DataTableStatePersistence}. It matches the
 * browser `localStorage` / `sessionStorage` API.
 *
 * @group State Persistence
 */
export interface DataTableStatePersistenceStorage {
  getItem(key: string): null | string
  removeItem(key: string): void
  setItem(key: string, value: string): void
}

/**
 * Context passed to state persistence feature adapters.
 *
 * @group State Persistence
 */
export interface DataTableStatePersistenceContext {
  engine: Engine
  model: DataModelHandle | null
  viewId: string
}

/**
 * Feature adapter consumed by {@link DataTableStatePersistence}.
 *
 * @group State Persistence
 */
export interface DataTableStatePersistenceAdapter<State = unknown> {
  key: string
  capture(context: DataTableStatePersistenceContext, previous: State | null): State
  restore(context: DataTableStatePersistenceContext, state: State | null): void
  subscribe(context: DataTableStatePersistenceContext, onChange: () => void): () => void
  subscribeRestore?: (context: DataTableStatePersistenceContext, onChange: () => void) => () => void
}

/**
 * Props for {@link DataTableStatePersistence}.
 *
 * @group State Persistence
 */
export interface DataTableStatePersistenceProps {
  adapters: DataTableStatePersistenceAdapter[]
  debounceMs?: number
  onStateChange?: (state: DataTablePersistenceState) => void
  resetKey?: unknown
  storage?: DataTableStatePersistenceStorage
  storageKey: string
}

function defaultStorage(): DataTableStatePersistenceStorage | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

function emptyState(): DataTablePersistenceState {
  return { version: 1, features: {} }
}

function parseState(raw: null | string): DataTablePersistenceState {
  if (!raw) {
    return emptyState()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DataTablePersistenceState>
    if (parsed.version !== 1 || typeof parsed.features !== 'object' || parsed.features === null) {
      return emptyState()
    }
    return { version: 1, features: parsed.features }
  } catch {
    return emptyState()
  }
}

function readState(storage: DataTableStatePersistenceStorage | null, storageKey: string): DataTablePersistenceState {
  return parseState(storage?.getItem(storageKey) ?? null)
}

function writeState(storage: DataTableStatePersistenceStorage | null, storageKey: string, state: DataTablePersistenceState) {
  storage?.setItem(storageKey, JSON.stringify(state))
}

function removeState(storage: DataTableStatePersistenceStorage | null, storageKey: string) {
  storage?.removeItem(storageKey)
}

function noop() {
  // empty
}

function emptyModelPersistenceState(previous?: ModelPersistenceState | null): ModelPersistenceState {
  return previous?.version === 1 && typeof previous.actions === 'object' && previous.actions !== null
    ? { version: 1, actions: { ...previous.actions } }
    : { version: 1, actions: {} }
}

/**
 * Creates a state persistence adapter for the active data model rendered by
 * the table.
 *
 * @group State Persistence
 */
export function modelStatePersistenceAdapter(): DataTableStatePersistenceAdapter<ModelPersistenceState> {
  return {
    key: 'model',
    capture({ model, viewId }, previous) {
      return model?.persistence?.capture(viewId, previous) ?? emptyModelPersistenceState(previous)
    },
    restore({ model, viewId }, state) {
      model?.persistence?.restore(viewId, state ?? null)
    },
    subscribe({ model, viewId }, onChange) {
      return model?.persistence?.subscribe(viewId, onChange) ?? noop
    },
  }
}

/**
 * Zero-render child component that persists data-table state through opt-in
 * feature adapters.
 *
 * @group State Persistence
 */
export function DataTableStatePersistence({
  adapters,
  debounceMs = 250,
  onStateChange,
  resetKey,
  storage: storageProp,
  storageKey,
}: DataTableStatePersistenceProps) {
  const engine = useEngine()
  const storage = storageProp ?? defaultStorage()
  const pendingSaveKeysRef = React.useRef(new Set<string>())
  const resetKeyRef = React.useRef(resetKey)
  const skipSaveKeysRef = React.useRef(new Set<string>())
  const writeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  useIsomorphicLayoutEffect(() => {
    const createContext = (): DataTableStatePersistenceContext => ({
      engine,
      model: engine.getValue(dataModel$),
      viewId: engine.getValue(dataModelViewId$),
    })
    const pendingSaveKeys = pendingSaveKeysRef.current
    const shouldReset = resetKeyRef.current !== resetKey
    resetKeyRef.current = resetKey

    if (shouldReset) {
      pendingSaveKeys.clear()
      removeState(storage, storageKey)
    }

    const persistedState = readState(storage, storageKey)
    onStateChange?.(persistedState)

    const restoreAdapter = <State,>(adapter: DataTableStatePersistenceAdapter<State>, state: DataTablePersistenceState) => {
      adapter.restore(createContext(), (state.features[adapter.key] ?? null) as State | null)
    }

    const captureAdapter = <State,>(adapter: DataTableStatePersistenceAdapter<State>, state: DataTablePersistenceState) => {
      return adapter.capture(createContext(), (state.features[adapter.key] ?? null) as State | null)
    }

    const adapterByKey = new Map(adapters.map((adapter) => [adapter.key, adapter]))

    for (const adapter of adapters) {
      restoreAdapter(adapter, persistedState)
    }

    const writeFeatureState = <State,>(adapter: DataTableStatePersistenceAdapter<State>) => {
      if (skipSaveKeysRef.current.has(adapter.key)) {
        skipSaveKeysRef.current.delete(adapter.key)
        return
      }

      pendingSaveKeys.add(adapter.key)

      if (writeTimerRef.current !== null) {
        clearTimeout(writeTimerRef.current)
      }

      writeTimerRef.current = setTimeout(() => {
        writeTimerRef.current = null
        const previous = readState(storage, storageKey)
        const next: DataTablePersistenceState = {
          version: 1,
          features: {
            ...previous.features,
          },
        }

        for (const key of pendingSaveKeys) {
          const pendingAdapter = adapterByKey.get(key)
          if (pendingAdapter) {
            next.features[key] = captureAdapter(pendingAdapter, previous)
          }
        }

        pendingSaveKeys.clear()
        writeState(storage, storageKey, next)
        onStateChange?.(next)
      }, debounceMs)
    }

    const restoreFeatureState = <State,>(adapter: DataTableStatePersistenceAdapter<State>) => {
      const nextState = readState(storage, storageKey)
      skipSaveKeysRef.current.add(adapter.key)
      adapter.restore(createContext(), (nextState.features[adapter.key] ?? null) as State | null)
      onStateChange?.(nextState)
    }

    const unsubscribes = adapters.flatMap((adapter) => {
      const context = createContext()
      const unsubscribeSave = adapter.subscribe(context, () => writeFeatureState(adapter))
      const unsubscribeRestore = adapter.subscribeRestore?.(context, () => restoreFeatureState(adapter))
      return unsubscribeRestore ? [unsubscribeSave, unsubscribeRestore] : [unsubscribeSave]
    })

    return () => {
      if (writeTimerRef.current !== null) {
        clearTimeout(writeTimerRef.current)
        writeTimerRef.current = null
      }
      pendingSaveKeys.clear()
      for (const unsubscribe of unsubscribes) {
        unsubscribe()
      }
    }
  }, [adapters, debounceMs, engine, onStateChange, resetKey, storage, storageKey])

  return null
}
