import { CELL_TYPE, nodeDebugLabels$$, nodeDefs$$, resourceDefs$$, TRIGGER_TYPE } from './globals'

import type { NodeRef, UnsubscribeHandle } from './types'

export type DiagnosticPrimitive = boolean | null | number | string
export type DiagnosticValue = DiagnosticPrimitive | readonly DiagnosticValue[] | { readonly [key: string]: DiagnosticValue }

export interface DiagnosticCycleRef {
  readonly cycleId: number
  readonly engineInstanceId: string
}

export interface DiagnosticNodeIdentity {
  readonly id: string
  readonly kind: 'cell' | 'resource' | 'stream' | 'trigger'
  readonly label?: string
}

export interface DiagnosticRootPublication {
  readonly node: DiagnosticNodeIdentity
  readonly value?: DiagnosticValue
}

export interface DiagnosticCandidate {
  readonly error?: DiagnosticNodeError
  readonly next?: DiagnosticValue
  readonly outcome: 'accepted' | 'comparator-error' | 'distinct-suppressed'
  readonly previous?: DiagnosticValue
}

export interface DiagnosticProjectionAttempt {
  readonly candidates: readonly DiagnosticCandidate[]
  readonly error?: DiagnosticNodeError
  readonly outcome: 'completed' | 'errored' | 'no-candidate'
  readonly pulls: readonly DiagnosticNodeIdentity[]
  readonly source: 'projection' | 'root'
  readonly sources: readonly DiagnosticNodeIdentity[]
}

export interface DiagnosticNodeEvaluationEvent {
  readonly attempts: readonly DiagnosticProjectionAttempt[]
  readonly next?: DiagnosticValue
  readonly node: DiagnosticNodeIdentity
  readonly previous?: DiagnosticValue
  readonly result: 'aborted-before-emission' | 'emitted' | 'not-emitted'
  readonly type: 'evaluation'
}

export interface DiagnosticPruneEvent {
  readonly causedBy: DiagnosticNodeIdentity
  readonly node: DiagnosticNodeIdentity
  readonly type: 'prune'
}

export type DiagnosticCycleEvent = DiagnosticNodeEvaluationEvent | DiagnosticPruneEvent

interface DiagnosticErrorBase {
  readonly message?: string
  readonly name?: string
  readonly node?: DiagnosticNodeIdentity
}

export interface DiagnosticNodeError extends DiagnosticErrorBase {
  readonly node: DiagnosticNodeIdentity
  readonly phase: 'comparator' | 'projection' | 'subscriber'
}

export interface DiagnosticPropagationError extends DiagnosticErrorBase {
  readonly childCycle?: DiagnosticCycleRef
  readonly childEngineInstanceId: string
  readonly phase: 'child-propagation'
}

export type DiagnosticError = DiagnosticNodeError | DiagnosticPropagationError

export interface PropagationCycle {
  readonly cycleId: number
  readonly durationMs: number
  readonly engineInstanceId: string
  readonly engineLabel?: string
  readonly error?: DiagnosticError
  readonly events: readonly DiagnosticCycleEvent[]
  readonly origin: 'forwarded-from-parent' | 'forwarded-to-parent' | 'publication'
  readonly parentCycle?: DiagnosticCycleRef
  readonly roots: readonly DiagnosticRootPublication[]
  readonly startedAt: number
  readonly status: 'aborted' | 'completed'
  readonly transactionId: string
}

export interface DiagnosticValueContext {
  cycleId: number
  engineInstanceId: string
  engineLabel?: string
  field: 'candidate' | 'error-message' | 'error-name' | 'next' | 'previous' | 'root'
  node: DiagnosticNodeIdentity
  transactionId: string
}

export interface NodeDiagnosticMetadata<T> {
  label?: string
  summarize?: (value: T) => unknown
}

export interface DiagnosticObserverOptions {
  captureValues?: 'none' | 'summary'
  includeSuppressed?: boolean
  onObserverError?: (error: unknown) => void
  redact?: (value: DiagnosticValue, context: DiagnosticValueContext) => unknown
}

export type DiagnosticObserver = (cycle: PropagationCycle) => void

export interface DiagnosticObserverRegistration {
  observer: DiagnosticObserver
  options: ResolvedDiagnosticObserverOptions
}

export interface DiagnosticTransaction {
  activeCycle?: DiagnosticCycleRef
  deliveries: DiagnosticDelivery[]
  failure?: DiagnosticTransactionFailure
  id: string
}

export interface DiagnosticTransactionFailure {
  cycle?: DiagnosticCycleRef
  engineInstanceId: string
}

export interface DiagnosticDelivery {
  cycle: PropagationCycle
  registration: DiagnosticObserverRegistration
}

export interface ResolvedDiagnosticObserverOptions {
  captureValues: 'none' | 'summary'
  includeSuppressed: boolean
  onObserverError?: (error: unknown) => void
  redact?: (value: DiagnosticValue, context: DiagnosticValueContext) => unknown
}

interface MetadataRegistration {
  metadata: NodeDiagnosticMetadata<unknown>
  token: symbol
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] }

export interface DebugEmissionRecord {
  /** Present only when structured observation already created a cycle. */
  cycle?: DiagnosticCycleRef
  engineInstanceId: string
  engineLabel?: string
  label: string
  node: DiagnosticNodeIdentity
  value: unknown
}

export type DiagnosticAllocationKind =
  | 'candidate'
  | 'cycle'
  | 'cycle-ref'
  | 'debug-emission'
  | 'error'
  | 'evaluation-event'
  | 'node-identity'
  | 'projection-attempt'
  | 'prune-event'
  | 'root'
  | 'transaction'

const MAX_DEPTH = 3
const MAX_ENTRIES = 20
const MAX_STRING_LENGTH = 200

const nodeMetadata$$ = new Map<symbol, MetadataRegistration[]>()
let engineInstanceCounter = 0
let transactionCounter = 0
let currentTransaction: DiagnosticTransaction | undefined
let flushingDeliveries = false
const pendingTransactions: DiagnosticTransaction[] = []
let diagnosticAllocationObserver: ((kind: DiagnosticAllocationKind) => void) | undefined

/**
 * Adds diagnostic metadata to a node without activating diagnostic recording.
 * Later registrations temporarily override earlier registrations until their cleanup runs.
 */
export function describeNode<T>(node$: NodeRef<T>, metadata: NodeDiagnosticMetadata<T>): UnsubscribeHandle {
  const token = Symbol('node diagnostic metadata')
  const registration = { metadata: metadata as NodeDiagnosticMetadata<unknown>, token }
  const registrations = nodeMetadata$$.get(node$) ?? []
  registrations.push(registration)
  nodeMetadata$$.set(node$, registrations)

  return () => {
    const current = nodeMetadata$$.get(node$)
    if (current === undefined) {
      return
    }
    const index = current.findIndex((entry) => entry.token === token)
    if (index !== -1) {
      current.splice(index, 1)
    }
    if (current.length === 0) {
      nodeMetadata$$.delete(node$)
    }
  }
}

export function createEngineInstanceId(): string {
  engineInstanceCounter += 1
  return `engine-${engineInstanceCounter}`
}

/** @internal Test seam for proving that inactive propagation allocates no diagnostic records. */
export function observeDiagnosticAllocationsForTests(observer: (kind: DiagnosticAllocationKind) => void): UnsubscribeHandle {
  const previous = diagnosticAllocationObserver
  let active = true
  diagnosticAllocationObserver = observer
  return () => {
    if (!active) {
      return
    }
    active = false
    if (diagnosticAllocationObserver === observer) {
      diagnosticAllocationObserver = previous
    }
  }
}

export function recordDiagnosticAllocation(kind: DiagnosticAllocationKind): void {
  diagnosticAllocationObserver?.(kind)
}

export function getNodeDiagnosticKind(node$: symbol): DiagnosticNodeIdentity['kind'] {
  if (resourceDefs$$.has(node$)) {
    return 'resource'
  }
  const definition = nodeDefs$$.get(node$)
  if (definition?.type === CELL_TYPE) {
    return 'cell'
  }
  if (definition?.type === TRIGGER_TYPE) {
    return 'trigger'
  }
  return 'stream'
}

export function getNodeDiagnosticLabel(node$: symbol): string | undefined {
  const registrations = nodeMetadata$$.get(node$)
  return registrations?.at(-1)?.metadata.label ?? nodeDebugLabels$$.get(node$)
}

export function hasNodeSummarizer(node$: symbol): boolean {
  return nodeMetadata$$.get(node$)?.at(-1)?.metadata.summarize !== undefined
}

export function resolveDiagnosticObserverOptions(options: DiagnosticObserverOptions = {}): ResolvedDiagnosticObserverOptions {
  const resolved: ResolvedDiagnosticObserverOptions = {
    captureValues: options.captureValues ?? 'none',
    includeSuppressed: options.includeSuppressed ?? true,
  }
  if (options.onObserverError !== undefined) {
    resolved.onObserverError = options.onObserverError
  }
  if (options.redact !== undefined) {
    resolved.redact = options.redact
  }
  return resolved
}

export function summarizeDiagnosticValue(
  node$: symbol,
  value: unknown,
  options: ResolvedDiagnosticObserverOptions,
  context: DiagnosticValueContext
): DiagnosticValue | undefined {
  const kind = getNodeDiagnosticKind(node$)
  if (options.captureValues === 'none' || kind === 'resource' || kind === 'trigger') {
    return undefined
  }

  const summarizer = nodeMetadata$$.get(node$)?.at(-1)?.metadata.summarize
  let summarized = value
  if (summarizer !== undefined) {
    try {
      summarized = summarizer(value)
    } catch {
      summarized = { $type: 'summarizer-error' }
    }
  }

  let normalized = normalizeDiagnosticValue(summarized)
  if (options.redact !== undefined) {
    try {
      normalized = normalizeDiagnosticValue(options.redact(normalized, context))
    } catch {
      normalized = { $type: 'redactor-error' }
    }
  }
  return normalized
}

export function createDiagnosticError(
  error: unknown,
  phase: DiagnosticNodeError['phase'],
  node: DiagnosticNodeIdentity,
  options: ResolvedDiagnosticObserverOptions,
  context: Omit<DiagnosticValueContext, 'field' | 'node'>
): DiagnosticNodeError {
  recordDiagnosticAllocation('error')
  const result: Mutable<DiagnosticNodeError> = { node, phase }
  if (options.captureValues === 'none') {
    return result
  }

  const name = readErrorField(error, 'name')
  const message = readErrorField(error, 'message')
  if (name !== undefined) {
    const captured = redactErrorField(name, 'error-name', node, options, context)
    if (typeof captured === 'string') {
      result.name = captured
    }
  }
  if (message !== undefined) {
    const captured = redactErrorField(message, 'error-message', node, options, context)
    if (typeof captured === 'string') {
      result.message = captured
    }
  }
  return result
}

export function runInDiagnosticTransaction<T>(active: boolean, callback: (transaction?: DiagnosticTransaction) => T): T {
  if (currentTransaction !== undefined) {
    return callback(currentTransaction)
  }
  if (!active) {
    return callback(undefined)
  }

  transactionCounter += 1
  recordDiagnosticAllocation('transaction')
  const transaction: DiagnosticTransaction = { deliveries: [], id: `transaction-${transactionCounter}` }
  currentTransaction = transaction
  let error: unknown
  let result!: T
  let threw = false
  try {
    result = callback(transaction)
  } catch (caught) {
    threw = true
    error = caught
  } finally {
    currentTransaction = undefined
    flushTransaction(transaction)
  }
  if (threw) {
    // oxlint-disable-next-line no-throw-literal -- propagation must preserve the application's exact thrown value.
    throw error
  }
  return result
}

export function queueDiagnosticCycle(
  transaction: DiagnosticTransaction,
  registration: DiagnosticObserverRegistration,
  cycle: PropagationCycle
): void {
  deepFreeze(cycle)
  transaction.deliveries.push({ cycle, registration })
}

export function diagnosticNow(): number {
  return globalThis.performance?.now() ?? Date.now()
}

export function emitDebugRecord(record: DebugEmissionRecord): void {
  const displayValue = record.value === undefined ? '[triggered]' : record.value
  // oxlint-disable-next-line no-console
  console.log(`[reactive-engine] ${record.label}:`, displayValue)
}

function flushTransaction(transaction: DiagnosticTransaction): void {
  if (transaction.deliveries.length === 0) {
    return
  }
  if (flushingDeliveries) {
    pendingTransactions.push(transaction)
    return
  }

  flushingDeliveries = true
  try {
    let next: DiagnosticTransaction | undefined = transaction
    while (next !== undefined) {
      for (const { cycle, registration } of next.deliveries) {
        try {
          registration.observer(cycle)
        } catch (error) {
          try {
            registration.options.onObserverError?.(error)
          } catch {
            // Diagnostic callbacks must not alter application propagation.
          }
        }
      }
      next = pendingTransactions.shift()
    }
  } finally {
    flushingDeliveries = false
  }
}

function normalizeDiagnosticValue(value: unknown, depth = 0, seen = new WeakSet<object>()): DiagnosticValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      return { $type: 'truncated-string', length: value.length, value: value.slice(0, MAX_STRING_LENGTH) }
    }
    return value
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : { $type: 'number', value: String(value) }
  }
  if (value === undefined) {
    return { $type: 'undefined' }
  }
  if (typeof value === 'bigint') {
    return { $type: 'bigint', value: String(value) }
  }
  if (typeof value === 'symbol' || typeof value === 'function') {
    return { $type: typeof value }
  }
  if (depth >= MAX_DEPTH) {
    return { $type: 'max-depth' }
  }
  if (seen.has(value)) {
    return { $type: 'circular' }
  }

  seen.add(value)
  try {
    if (Array.isArray(value)) {
      let descriptors: Record<string, PropertyDescriptor>
      try {
        descriptors = Object.getOwnPropertyDescriptors(value)
      } catch {
        return { $type: 'uninspectable' }
      }
      const length = typeof descriptors.length?.value === 'number' ? descriptors.length.value : 0
      const result: DiagnosticValue[] = []
      for (let index = 0; index < Math.min(length, MAX_ENTRIES); index += 1) {
        result.push(normalizeDiagnosticDescriptor(descriptors[index], depth, seen))
      }
      if (length > MAX_ENTRIES) {
        result.push({ $type: 'truncated', remaining: length - MAX_ENTRIES })
      }
      return result
    }
    if (value instanceof Date) {
      try {
        return { $type: 'date', value: Date.prototype.toISOString.call(value) }
      } catch {
        return { $type: 'date', value: 'invalid' }
      }
    }
    if (value instanceof Map) {
      const entries: DiagnosticValue[] = []
      let index = 0
      for (const [key, entryValue] of Map.prototype.entries.call(value)) {
        if (index >= MAX_ENTRIES) {
          break
        }
        entries.push([normalizeDiagnosticValue(key, depth + 1, seen), normalizeDiagnosticValue(entryValue, depth + 1, seen)])
        index += 1
      }
      return { $type: 'map', entries, size: readBuiltinNumber(value, Map.prototype, 'size', index) }
    }
    if (value instanceof Set) {
      const entries: DiagnosticValue[] = []
      let index = 0
      for (const entry of Set.prototype.values.call(value)) {
        if (index >= MAX_ENTRIES) {
          break
        }
        entries.push(normalizeDiagnosticValue(entry, depth + 1, seen))
        index += 1
      }
      return { $type: 'set', entries, size: readBuiltinNumber(value, Set.prototype, 'size', index) }
    }
    if (ArrayBuffer.isView(value)) {
      return {
        $type: getPrototypeConstructorName(Object.getPrototypeOf(value) as object | null),
        byteLength:
          value instanceof DataView
            ? readBuiltinNumber(value, DataView.prototype, 'byteLength', 0)
            : readBuiltinNumber(value, Object.getPrototypeOf(Uint8Array.prototype) as object, 'byteLength', 0),
      }
    }

    let prototype: object | null
    try {
      prototype = Object.getPrototypeOf(value) as object | null
    } catch {
      return { $type: 'uninspectable' }
    }
    if (prototype !== null && prototype !== Object.prototype) {
      return { $type: getPrototypeConstructorName(prototype) }
    }

    let descriptors: Record<string, PropertyDescriptor>
    try {
      descriptors = Object.getOwnPropertyDescriptors(value)
    } catch {
      return { $type: 'uninspectable' }
    }
    const keys = Object.keys(descriptors).filter((key) => descriptors[key]?.enumerable === true)
    const result: Record<string, DiagnosticValue> = {}
    for (const key of keys.slice(0, MAX_ENTRIES)) {
      defineDiagnosticProperty(result, key, normalizeDiagnosticDescriptor(descriptors[key], depth, seen))
    }
    if (keys.length > MAX_ENTRIES) {
      defineDiagnosticProperty(result, '$truncated', keys.length - MAX_ENTRIES)
    }
    return result
  } catch {
    return { $type: 'uninspectable' }
  } finally {
    seen.delete(value)
  }
}

function defineDiagnosticProperty(target: Record<string, DiagnosticValue>, key: string, value: DiagnosticValue): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })
}

function normalizeDiagnosticDescriptor(descriptor: PropertyDescriptor | undefined, depth: number, seen: WeakSet<object>): DiagnosticValue {
  if (descriptor === undefined) {
    return { $type: 'empty' }
  }
  if (!Object.hasOwn(descriptor, 'value')) {
    return { $type: 'accessor' }
  }
  return normalizeDiagnosticValue(descriptor.value, depth + 1, seen)
}

function getPrototypeConstructorName(prototype: object | null): string {
  let current = prototype
  while (current !== null) {
    try {
      const constructor = Object.getOwnPropertyDescriptor(current, 'constructor')
      if (Object.hasOwn(constructor ?? {}, 'value') && typeof constructor?.value === 'function') {
        const name = Object.getOwnPropertyDescriptor(constructor.value, 'name')
        if (typeof name?.value === 'string' && name.value.length > 0) {
          return name.value
        }
      }
      current = Object.getPrototypeOf(current) as object | null
    } catch {
      return 'uninspectable'
    }
  }
  return 'object'
}

function readBuiltinNumber(target: object, prototype: object, property: string, fallback: number): number {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
  const getter: unknown = descriptor === undefined ? undefined : Reflect.get(descriptor, 'get')
  if (typeof getter !== 'function') {
    return fallback
  }
  const result: unknown = Reflect.apply(getter, target, [])
  return typeof result === 'number' ? result : fallback
}

function readErrorField(error: unknown, field: 'message' | 'name'): string | undefined {
  if (error === null || (typeof error !== 'object' && typeof error !== 'function')) {
    return field === 'message' ? String(error) : undefined
  }
  let current: object | null = error
  while (current !== null) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(current, field)
      if (descriptor !== undefined) {
        return Object.hasOwn(descriptor, 'value') && typeof descriptor.value === 'string' ? descriptor.value : undefined
      }
      current = Object.getPrototypeOf(current) as object | null
    } catch {
      return undefined
    }
  }
  return undefined
}

function redactErrorField(
  value: string,
  field: 'error-message' | 'error-name',
  node: DiagnosticNodeIdentity,
  options: ResolvedDiagnosticObserverOptions,
  context: Omit<DiagnosticValueContext, 'field' | 'node'>
): DiagnosticValue {
  let normalized = normalizeDiagnosticValue(value)
  if (options.redact !== undefined) {
    try {
      normalized = normalizeDiagnosticValue(options.redact(normalized, { ...context, field, node }))
    } catch {
      normalized = { $type: 'redactor-error' }
    }
  }
  return normalized
}

function deepFreeze(value: unknown, seen = new WeakSet<object>()): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return
  }
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key as keyof typeof value], seen)
  }
  Object.freeze(value)
}
