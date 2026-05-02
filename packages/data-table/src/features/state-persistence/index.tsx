import * as React from 'react'

import { useEngine, useIsomorphicLayoutEffect } from '@virtuoso.dev/reactive-engine-react'

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
 * Feature adapter consumed by {@link DataTableStatePersistence}.
 *
 * @group State Persistence
 */
export interface DataTableStatePersistenceAdapter<State = unknown> {
  key: string
  capture(engine: Engine, previous: State | null): State
  restore(engine: Engine, state: State | null): void
  subscribe(engine: Engine, onChange: () => void): () => void
  subscribeRestore?: (engine: Engine, onChange: () => void) => () => void
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
      adapter.restore(engine, (state.features[adapter.key] ?? null) as State | null)
    }

    const captureAdapter = <State,>(adapter: DataTableStatePersistenceAdapter<State>, state: DataTablePersistenceState) => {
      return adapter.capture(engine, (state.features[adapter.key] ?? null) as State | null)
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
      adapter.restore(engine, (nextState.features[adapter.key] ?? null) as State | null)
      onStateChange?.(nextState)
    }

    const unsubscribes = adapters.flatMap((adapter) => {
      const unsubscribeSave = adapter.subscribe(engine, () => writeFeatureState(adapter))
      const unsubscribeRestore = adapter.subscribeRestore?.(engine, () => restoreFeatureState(adapter))
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
