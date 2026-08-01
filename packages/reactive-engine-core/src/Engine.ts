import invariant from 'tiny-invariant'

import {
  createDiagnosticError,
  createEngineInstanceId,
  diagnosticNow,
  emitDebugRecord,
  getNodeDiagnosticKind,
  getNodeDiagnosticLabel,
  queueDiagnosticCycle,
  recordDiagnosticAllocation,
  resolveDiagnosticObserverOptions,
  runInDiagnosticTransaction,
  summarizeDiagnosticValue,
} from './diagnostics'
import { CELL_TYPE, inEngineContext, nodeDebugLabels$$, nodeDefs$$, nodeInits$$, nodeInitSubscriptions$$, resourceDefs$$ } from './globals'
import { RefCount } from './RefCount'
import { SetMap } from './SetMap'
import { combinedCellProjection, defaultComparator, tap } from './utils'

import type {
  DiagnosticCandidate,
  DiagnosticCycleRef,
  DiagnosticNodeError,
  DiagnosticNodeEvaluationEvent,
  DiagnosticNodeIdentity,
  DiagnosticObserver,
  DiagnosticObserverOptions,
  DiagnosticObserverRegistration,
  DiagnosticPruneEvent,
  DiagnosticProjectionAttempt,
  DiagnosticRootPublication,
  DiagnosticTransaction,
  DiagnosticValueContext,
  PropagationCycle,
} from './diagnostics'
import type { O } from './operators'
import type {
  CombinedCellRecord,
  Comparator,
  Distinct,
  ExecutionMap,
  Inp,
  NodeInit,
  NodeProjection,
  NodeRef,
  Out,
  ProjectionFunc,
  Subscription,
  UnsubscribeHandle,
} from './types'

// use this so that streams don't skip undefined values
const emptyStreamValue = Symbol('empty stream')

interface DiagnosticCycleCapture {
  cycle: MutablePropagationCycle
  registration: DiagnosticObserverRegistration
}

interface DiagnosticEventCapture {
  capture: DiagnosticCycleCapture
  event: MutableDiagnosticNodeEvaluationEvent
}

interface DiagnosticAttemptCapture extends DiagnosticEventCapture {
  attempt: MutableDiagnosticProjectionAttempt
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] }
type MutableDiagnosticCandidate = Mutable<DiagnosticCandidate>
type MutableDiagnosticNodeEvaluationEvent = Omit<Mutable<DiagnosticNodeEvaluationEvent>, 'attempts'> & {
  attempts: MutableDiagnosticProjectionAttempt[]
}
type MutableDiagnosticProjectionAttempt = Omit<Mutable<DiagnosticProjectionAttempt>, 'candidates'> & {
  candidates: MutableDiagnosticCandidate[]
}
type MutableDiagnosticRootPublication = Mutable<DiagnosticRootPublication>
type MutablePropagationCycle = Omit<Mutable<PropagationCycle>, 'events' | 'roots'> & {
  events: (DiagnosticPruneEvent | MutableDiagnosticNodeEvaluationEvent)[]
  roots: MutableDiagnosticRootPublication[]
}

const emptyDiagnosticAttempts: DiagnosticAttemptCapture[] = []
const emptyDiagnosticCaptures: DiagnosticCycleCapture[] = []
const emptyDiagnosticEvents: DiagnosticEventCapture[] = []
const emptyDiagnosticRegistrations: DiagnosticObserverRegistration[] = []

/**
 * The engine orchestrates any cells and streams that it touches. The engine also stores the state and the dependencies of the nodes that are referred through it.
 * @category Engine
 */
export class Engine {
  public readonly id?: string | undefined
  public isDisposed = false
  private readonly calledInits = new Set<NodeInit<unknown>>()
  private readonly childEngines: Engine[] = []
  private readonly combinedCells: CombinedCellRecord[] = []
  private readonly definitionRegistry = new Set<symbol>()
  private readonly disposeCallbacks = new Set<() => void>()
  private readonly distinctNodes = new Map<symbol, Comparator<unknown>>()
  private readonly diagnosticInstanceId = createEngineInstanceId()
  private readonly diagnosticNodeIds = new Map<symbol, string>()
  private readonly diagnosticNodeKinds = new Map<symbol, DiagnosticNodeIdentity['kind']>()
  private readonly diagnosticObservers = new Set<DiagnosticObserverRegistration>()
  private diagnosticCycleId = 0
  private diagnosticNodeId = 0
  private diagnosticObserverCountInTree = 0
  private readonly executionMaps = new Map<symbol | symbol[], ExecutionMap>()
  private readonly graph = new SetMap<NodeProjection>()
  private parentEngine: Engine | undefined = undefined
  private readonly parentEngineSingletonSubscriptions = new Map<symbol, Subscription<unknown>>()
  private readonly parentEngineSubscriptions = new SetMap<Subscription<unknown>>()
  private readonly resources = new Map<symbol, unknown>()
  private readonly singletonSubscriptions = new Map<symbol, Subscription<unknown>>()
  private readonly state = new Map<symbol, unknown>()
  private readonly streamState = new Map<symbol, unknown>()
  private readonly subscriptions = new SetMap<Subscription<unknown>>()
  /**
   * Creates a new engine.
   * @param initialValues - the initial cell values that will populate the engine.
   * Those values will not trigger a recomputation cycle, and will overwrite the initial values specified for each cell.
   * @param id - optional stable ID for storage namespacing. Use this for multi-engine apps to prevent storage key conflicts.
   * @param parentEngine - optional parent engine for child engine functionality.
   */
  constructor(initialValues: Record<symbol, unknown> = {}, id?: string, parentEngine?: Engine) {
    this.id = id
    for (const sym of Object.getOwnPropertySymbols(initialValues)) {
      this.state.set(sym, initialValues[sym])
    }
    this.parentEngine = parentEngine
    parentEngine?.childEngines.push(this)
    nodeInitSubscriptions$$.add(this.nodeInitSubscription)
  }

  /**
   * Creates or resolves an existing cell instance in the engine. Useful as a joint point when building your own operators.
   * @returns a reference to the cell.
   * @param value - the initial value of the cell
   * @param distinct - true by default. Pass false to mark the stream as a non-distinct one, meaning that publishing the same value multiple times will re-trigger a recomputation cycle.
   * @param node - optional, a reference to a cell. If the cell has not been touched in the engine before, the engine will instantiate a reference to it. If it's registered already, the function will return the reference.
   * @typeParam T - The type of values that the cell will emit/accept.
   */
  cellInstance<T>(value: T, distinct: Distinct<T> = true, node = Symbol('cell')): NodeRef<T> {
    this.diagnosticNodeKinds.set(node, 'cell')
    if (!this.state.has(node)) {
      this.state.set(node, value)
    }
    if (distinct !== false && !this.distinctNodes.has(node)) {
      this.distinctNodes.set(node, distinct === true ? defaultComparator : (distinct as Comparator<unknown>))
    }

    return node as NodeRef<T>
  }

  /**
   * @typeParam T - The type of values that the cell will emit/accept.
   * @typeParam K - The type of values that the source node will emit.
   */
  changeWith<T, K>(cell: Inp<T>, source: Out<K>, map: (cellValue: T, streamValue: K) => T) {
    this.connect({
      map: (done) => (streamValue: K, cellValue: T) => {
        done(map(cellValue, streamValue))
      },
      pulls: [cell],
      sink: cell,
      sources: [source],
    })
  }

  /**
   * @typeParam T - The type of values that the combined node will emit.
   */
  combine(...sources: Out[]): Out {
    return tap(this.streamInstance(), (sink) => {
      this.connect({
        map:
          (done) =>
          (...args) => {
            done(args)
          },
        sink,
        sources,
      })
    })
  }

  /**
   * Combines the values from multiple nodes into a cell that's an array of the latest values of the nodes.
   * @typeParam T - The type of values that the combined cell will emit.
   */
  combineCells(sources: Out[]): Out<unknown[]> {
    const existing = this.combinedCells.find((entry) => {
      return sources.length === entry.sources.length && sources.every((s, i) => s === entry.sources[i])
    })

    if (existing) {
      return existing.cell as Out<unknown[]>
    }

    return tap(
      this.cellInstance(
        sources.map((source) => this.getValue(source)),
        true
      ),
      (combinedCell) => {
        this.connect({
          map: combinedCellProjection,
          sink: combinedCell,
          sources,
        })

        this.combinedCells.push({ cell: combinedCell, sources })
      }
    )
  }

  /**
   * A low-level utility that connects multiple nodes to a sink node with a map function.
   * Used as a foundation for the higher-level operators.
   * The nodes can be active (sources) or passive (pulls).
   */
  connect<T extends unknown[] = unknown[]>({
    map,
    pulls = [],
    sink,
    sources,
  }: {
    /**
     * The projection function that will be called when any of the source nodes emits.
     */
    map: ProjectionFunc<T>
    /**
     * The nodes which values will be pulled. The values will be passed as arguments to the map function.
     */
    pulls?: Out[]
    /**
     * The sink node that will receive the result of the map function.
     */
    sink: Inp
    /**
     * The source nodes that emit values to the sink node. The values will be passed as arguments to the map function.
     */
    sources: Out[]
  }) {
    const dependency: NodeProjection<T> = {
      map,
      pulls: new Set(pulls),
      sink: this.register(sink),
      sources: new Set(sources),
    }

    for (const node of [...sources, ...pulls]) {
      this.register(node)
      this.graph.getOrCreate(node).add(dependency as NodeProjection)
    }

    this.executionMaps.clear()
  }

  copyDistinctValue(source$: NodeRef, target$: NodeRef) {
    const comparator = this.distinctNodes.get(source$)
    if (comparator === undefined) {
      this.distinctNodes.delete(target$)
    } else {
      this.distinctNodes.set(target$, comparator)
    }
  }

  dispose() {
    this.isDisposed = true
    this.parentEngine?.adjustDiagnosticObserverCount(-this.diagnosticObserverCountInTree)
    // Remove self from parent's childEngines array
    if (this.parentEngine) {
      const index = this.parentEngine.childEngines.indexOf(this)
      if (index !== -1) {
        this.parentEngine.childEngines.splice(index, 1)
      }
      this.parentEngine = undefined
    }

    // Call all disposal callbacks
    for (const callback of this.disposeCallbacks) {
      callback()
    }
    this.disposeCallbacks.clear()

    // Dispose resources - check Symbol.dispose first, then fall back to dispose()
    for (const resource of this.resources.values()) {
      if (resource !== null && typeof resource === 'object') {
        if (Symbol.dispose in resource) {
          ;(resource as { [Symbol.dispose]: () => void })[Symbol.dispose]()
        } else if ('dispose' in resource && typeof (resource as { dispose?: unknown }).dispose === 'function') {
          ;(resource as { dispose: () => void }).dispose()
        }
      }
    }
    this.resources.clear()

    this.combinedCells.length = 0
    this.definitionRegistry.clear()
    this.diagnosticNodeIds.clear()
    this.diagnosticNodeKinds.clear()
    this.diagnosticObservers.clear()
    this.diagnosticObserverCountInTree = 0
    this.distinctNodes.clear()
    this.executionMaps.clear()
    this.graph.clear()
    this.singletonSubscriptions.clear()
    this.parentEngineSingletonSubscriptions.clear()
    this.parentEngineSubscriptions.clear()
    this.state.clear()
    this.subscriptions.clear()
    this.calledInits.clear()
    nodeInitSubscriptions$$.delete(this.nodeInitSubscription)

    for (const child of this.childEngines) {
      child.parentEngine = undefined
    }
  }

  /**
   * @typeParam T - The type of values that the node emits.
   */
  getValue<T>(node: Out<T>): T {
    if (this.parentEngine?.hasOwnOrParentHasRef(node) === true) {
      return this.parentEngine.getValue(node)
    }
    this.register(node)
    return this.state.get(node) as T
  }

  /**
   * Links the output of a node to the input of another node.
   * @typeParam T - The type of values that the nodes will emit.
   */
  link<T>(source: Out<T>, sink: Inp<T>) {
    this.connect({
      map: (done) => (value) => {
        done(value)
      },
      sink,
      sources: [source],
    })
  }

  /**
   * Merges multiple nodes into a single stream that emits whenever any source emits.
   * Unlike combine, merge emits the individual value from whichever source emitted,
   * not an array of all values.
   * @typeParam T - The type of values that the merged stream will emit.
   */
  merge(...sources: Out[]): Out {
    return tap(this.streamInstance(), (sink) => {
      for (const source of sources) {
        this.link(source, sink)
      }
    })
  }

  /**
   * Register a callback to be called when the engine is disposed.
   * @param callback - the callback function to run on disposal
   * @returns A function to unregister the callback.
   */
  onDispose(callback: () => void): () => void {
    this.disposeCallbacks.add(callback)
    return () => this.disposeCallbacks.delete(callback)
  }

  /**
   * Observes structured propagation records for cycles that start in this engine.
   * Observer registration and options are snapshotted when each cycle starts.
   */
  observeDiagnostics(observer: DiagnosticObserver, options: DiagnosticObserverOptions = {}): UnsubscribeHandle {
    const registration: DiagnosticObserverRegistration = {
      observer,
      options: resolveDiagnosticObserverOptions(options),
    }
    this.diagnosticObservers.add(registration)
    this.adjustDiagnosticObserverCount(1)
    let active = true
    return () => {
      if (active && this.diagnosticObservers.delete(registration)) {
        active = false
        this.adjustDiagnosticObserverCount(-1)
      }
    }
  }

  /**
   * @typeParam T - The type of values that the source node will emit.
   */
  pipe<T>(source: Out<T>, ...operators: O<unknown, unknown>[]): NodeRef {
    return this.combineOperators(...operators)(source)
  }
  /**
   * Runs the subscriptions of this node.
   * @example
   * ```ts
   * const foo$ = Action()
   *
   * e.sub(foo$, console.log)
   *
   * const r = new Engine()
   * r.pub(foo$)
   * ```
   */
  pub<T>(node: Inp<T>): void
  /**
   * Publishes the specified value into a node.
   * @example
   * ```ts
   * const foo$ = Cell('foo')
   * const r = new Engine()
   * r.pub(foo$, 'bar')
   * ```
   */
  // oxlint-disable-next-line typescript/unified-signatures - this is intentional
  pub<T>(node: Inp<T>, value: T): void
  pub<T>(node: Inp<T>, value?: T) {
    this.pubIn({ [node]: value })
  }

  /**
   * Publishes into multiple nodes simultaneously, triggering a single re-computation cycle.
   * @param values - a record of node references and their values.
   *
   * @example
   * ```ts
   * const foo$ = Cell('foo')
   * const bar$ = Cell('bar')
   *
   * const r = new Engine()
   * r.pubIn({[foo$]: 'foo1', [bar$]: 'bar1'})
   * ```
   */
  pubIn(values: Record<symbol, unknown>, skipParent = false) {
    runInDiagnosticTransaction(this.hasDiagnosticsInFamily(), (transaction) => {
      this.pubInTransaction(
        values,
        skipParent,
        transaction,
        skipParent ? 'forwarded-from-parent' : 'publication',
        transaction?.activeCycle,
        true
      )
    })
  }

  private pubInTransaction(
    values: Record<symbol, unknown>,
    skipParent: boolean,
    transaction: DiagnosticTransaction | undefined,
    origin: PropagationCycle['origin'],
    applicationParentCycle: DiagnosticCycleRef | undefined,
    applicationBoundary: boolean
  ) {
    const previousTransactionFailure = transaction?.failure
    const parentValues: Record<symbol, unknown> = {}
    let ownValues: Record<symbol, unknown> = {}

    if (this.parentEngine && !skipParent) {
      for (const k of Reflect.ownKeys(values)) {
        const key = k as NodeRef
        const val = values[key]
        if (this.parentEngine.hasOwnOrParentHasRef(key)) {
          parentValues[key] = val
        } else {
          ownValues[key] = val
        }
      }
      this.parentEngine.pubInTransaction(parentValues, false, transaction, 'forwarded-to-parent', applicationParentCycle, false)
    } else {
      ownValues = values
    }

    const ids = Reflect.ownKeys(ownValues) as symbol[]

    const map = this.getExecutionMap(ids)
    const refCount = map.refCount.clone()
    const participatingNodeKeys = map.participatingNodes.slice()
    const transientState = new Map<symbol, unknown>([...this.state, ...this.streamState])

    const childChangePayload: Record<symbol, unknown> = {}
    const registrations = transaction !== undefined && ids.length > 0 ? Array.from(this.diagnosticObservers) : emptyDiagnosticRegistrations
    let captures = emptyDiagnosticCaptures
    let cycleRef: DiagnosticCycleRef | undefined
    let previousCycle: DiagnosticCycleRef | undefined

    if (transaction !== undefined && registrations.length > 0) {
      captures = []
      this.diagnosticCycleId += 1
      recordDiagnosticAllocation('cycle-ref')
      cycleRef = { cycleId: this.diagnosticCycleId, engineInstanceId: this.diagnosticInstanceId }
      previousCycle = transaction.activeCycle
      for (const registration of registrations) {
        captures.push(this.createDiagnosticCycle(registration, ids, ownValues, transaction, cycleRef, origin, applicationParentCycle))
      }
      transaction.activeCycle = cycleRef
    }

    let currentEvents = emptyDiagnosticEvents
    let currentAttempts = emptyDiagnosticAttempts
    let currentCandidateCount = 0
    let currentAttemptErrorPhase: DiagnosticNodeError['phase'] | undefined

    // oxlint-disable eslint/no-loop-func -- propagation callbacks execute synchronously before their iteration advances.
    const nodeWillNotEmit = (key: symbol) => {
      this.graph.use(key, (projections) => {
        for (const { sink, sources } of projections) {
          if (sources.has(key)) {
            refCount.decrement(sink, () => {
              for (const capture of captures) {
                recordDiagnosticAllocation('prune-event')
                capture.cycle.events.push({
                  causedBy: this.diagnosticIdentity(key),
                  node: this.diagnosticIdentity(sink),
                  type: 'prune',
                })
              }
              participatingNodeKeys.splice(participatingNodeKeys.indexOf(sink), 1)
              nodeWillNotEmit(sink)
            })
          }
        }
      })
    }

    try {
      for (;;) {
        const nextId = participatingNodeKeys.shift()
        if (nextId === undefined) {
          break
        }
        const id = nextId
        const nodePrevious = transientState.get(id)
        const nodeHadPrevious = transientState.has(id) && nodePrevious !== emptyStreamValue
        let resolved = false
        currentEvents =
          captures.length === 0
            ? emptyDiagnosticEvents
            : captures.map((capture) => {
                recordDiagnosticAllocation('evaluation-event')
                const event: MutableDiagnosticNodeEvaluationEvent = {
                  attempts: [],
                  node: this.diagnosticIdentity(id),
                  result: 'not-emitted',
                  type: 'evaluation',
                }
                capture.cycle.events.push(event)
                return { capture, event }
              })

        const startAttempt = (source: DiagnosticProjectionAttempt['source'], sources: symbol[], pulls: symbol[]) => {
          currentCandidateCount = 0
          currentAttemptErrorPhase = undefined
          currentAttempts =
            currentEvents.length === 0
              ? emptyDiagnosticAttempts
              : currentEvents.map(({ capture, event }) => {
                  recordDiagnosticAllocation('projection-attempt')
                  const attempt: MutableDiagnosticProjectionAttempt = {
                    candidates: [],
                    outcome: 'no-candidate',
                    pulls: pulls.map((node) => this.diagnosticIdentity(node)),
                    source,
                    sources: sources.map((node) => this.diagnosticIdentity(node)),
                  }
                  event.attempts.push(attempt)
                  return { attempt, capture, event }
                })
        }

        const finishAttempt = () => {
          if (currentAttemptErrorPhase === undefined) {
            for (const { attempt } of currentAttempts) {
              attempt.outcome = currentCandidateCount === 0 ? 'no-candidate' : 'completed'
            }
          }
        }

        const done = (value: unknown) => {
          currentCandidateCount += 1
          const previous = transientState.get(id)
          const hadPrevious = transientState.has(id) && previous !== emptyStreamValue
          const dnRef = this.distinctNodes.get(id)
          let suppressed = false
          try {
            suppressed = transientState.has(id) && dnRef?.(previous, value) === true
          } catch (error) {
            currentAttemptErrorPhase = 'comparator'
            for (const { attempt, capture, event } of currentAttempts) {
              const diagnosticError = this.diagnosticError(error, 'comparator', event.node, capture)
              attempt.candidates.push(
                this.diagnosticCandidate(capture, id, event.node, 'comparator-error', hadPrevious, previous, value, diagnosticError)
              )
              attempt.error = diagnosticError
              attempt.outcome = 'errored'
              event.result = 'aborted-before-emission'
              capture.cycle.error = diagnosticError
            }
            throw error
          }

          if (suppressed) {
            resolved = false
            for (const { attempt, capture, event } of currentAttempts) {
              if (capture.registration.options.includeSuppressed) {
                attempt.candidates.push(
                  this.diagnosticCandidate(capture, id, event.node, 'distinct-suppressed', hadPrevious, previous, value)
                )
              }
            }
            return
          }

          resolved = true
          for (const { attempt, capture, event } of currentAttempts) {
            attempt.candidates.push(this.diagnosticCandidate(capture, id, event.node, 'accepted', hadPrevious, previous, value))
          }
          transientState.set(id, value)
          childChangePayload[id] = value

          if (this.state.has(id)) {
            this.state.set(id, value)
          } else if (this.streamState.has(id)) {
            this.streamState.set(id, value)
          }
        }

        if (Object.hasOwn(ownValues, id)) {
          startAttempt('root', [], [])
          done(ownValues[id])
          finishAttempt()
        } else {
          inEngineContext(this, () => {
            map.projections.use(id, (nodeProjections) => {
              for (const projection of nodeProjections) {
                const sources = Array.from(projection.sources)
                const pulls = Array.from(projection.pulls)
                const args = [...sources, ...pulls].map((nodeId) => transientState.get(nodeId))
                startAttempt('projection', sources, pulls)
                try {
                  projection.map(done)(...args)
                } catch (error) {
                  if (currentAttemptErrorPhase === undefined) {
                    currentAttemptErrorPhase = 'projection'
                    for (const { attempt, capture, event } of currentAttempts) {
                      const diagnosticError = this.diagnosticError(error, 'projection', event.node, capture)
                      attempt.error = diagnosticError
                      attempt.outcome = 'errored'
                      event.result = 'aborted-before-emission'
                      capture.cycle.error = diagnosticError
                    }
                  }
                  throw error
                }
                finishAttempt()
              }
            })
          })
        }

        if (resolved) {
          const value = transientState.get(id)
          for (const { capture, event } of currentEvents) {
            event.result = 'emitted'
            const next = this.diagnosticValue(capture, id, event.node, value, 'next')
            if (nodeHadPrevious) {
              const previous = this.diagnosticValue(capture, id, event.node, nodePrevious, 'previous')
              if (previous !== undefined) {
                event.previous = previous
              }
            }
            if (next !== undefined) {
              event.next = next
            }
          }

          const debugLabel = nodeDebugLabels$$.get(id)
          if (debugLabel !== undefined) {
            recordDiagnosticAllocation('debug-emission')
            const record = {
              engineInstanceId: this.diagnosticInstanceId,
              label: debugLabel,
              node: this.diagnosticIdentity(id),
              value,
            }
            if (this.id !== undefined) {
              Object.assign(record, { engineLabel: this.id })
            }
            if (cycleRef !== undefined) {
              Object.assign(record, { cycle: cycleRef })
            }
            emitDebugRecord(record)
          }

          try {
            inEngineContext(this, () => {
              this.subscriptions.use(id, (nodeSubscriptions) => {
                for (const subscription of nodeSubscriptions) {
                  subscription(value, this)
                }
              })
              this.singletonSubscriptions.get(id)?.(value, this)
            })
          } catch (error) {
            for (const { capture, event } of currentEvents) {
              capture.cycle.error = this.diagnosticError(error, 'subscriber', event.node, capture)
            }
            throw error
          }
        } else {
          nodeWillNotEmit(id)
        }
      }

      for (const childEngine of this.childEngines) {
        // the pubIn will clone the passed payload, so the engines won't overlap with each other
        childEngine.pubInTransaction(childChangePayload, true, transaction, 'forwarded-from-parent', applicationParentCycle, false)
      }
    } catch (error) {
      if (transaction !== undefined) {
        if (transaction.failure === undefined) {
          transaction.failure = { engineInstanceId: this.diagnosticInstanceId }
          if (cycleRef !== undefined) {
            transaction.failure.cycle = cycleRef
          }
        }
        const failure = transaction.failure
        if (failure.engineInstanceId !== this.diagnosticInstanceId) {
          for (const capture of captures) {
            capture.cycle.error ??= {
              ...(failure.cycle === undefined ? {} : { childCycle: failure.cycle }),
              childEngineInstanceId: failure.engineInstanceId,
              phase: 'child-propagation',
            }
          }
        }
      }
      for (const capture of captures) {
        capture.cycle.status = 'aborted'
      }
      if (applicationBoundary && transaction !== undefined) {
        if (previousTransactionFailure === undefined) {
          delete transaction.failure
        } else {
          transaction.failure = previousTransactionFailure
        }
      }
      throw error
    } finally {
      if (transaction !== undefined && cycleRef !== undefined) {
        if (previousCycle === undefined) {
          delete transaction.activeCycle
        } else {
          transaction.activeCycle = previousCycle
        }
        for (const capture of captures) {
          capture.cycle.durationMs = diagnosticNow() - capture.cycle.startedAt
          queueDiagnosticCycle(transaction, capture.registration, capture.cycle)
        }
      }
    }
    // oxlint-enable eslint/no-loop-func
  }

  /**
   * Explicitly includes the specified cell/stream reference in the engine.
   * Most of the time you don't need to do that, since any interaction with the node through an engine will register it.
   * The only exception of that rule should be when the interaction is conditional, and the node definition includes an init function that needs to be eagerly evaluated.
   */
  register(node$: NodeRef) {
    // Check if already registered in this engine or parent
    if (this.definitionRegistry.has(node$) || this.parentEngine?.hasOwnOrParentHasRef(node$) === true) {
      return node$
    }

    // Check for resource definition first
    const resourceDef = resourceDefs$$.get(node$)
    if (resourceDef !== undefined) {
      this.definitionRegistry.add(node$)
      this.diagnosticNodeKinds.set(node$, 'resource')
      const instance = resourceDef.factory(this) as unknown
      this.resources.set(node$, instance)
      this.state.set(node$, instance)
      return node$
    }

    // Check for node definition
    const definition = nodeDefs$$.get(node$)
    if (definition === undefined) {
      return node$
    }

    this.definitionRegistry.add(node$)

    const instance$ =
      definition.type === CELL_TYPE
        ? this.cellInstance(definition.initial, definition.distinct, node$)
        : this.streamInstance(definition.distinct, node$)

    inEngineContext(this, () => {
      nodeInits$$.use(instance$, (inits) => {
        for (const init of inits) {
          // Skip if this init has already been called in this engine
          if (!this.calledInits.has(init)) {
            this.calledInits.add(init)
            init(this, node$)
          }
        }
      })
    })

    return instance$
  }

  /**
   * Clears all exclusive subscriptions.
   */
  resetSingletonSubs() {
    this.singletonSubscriptions.clear()
  }

  /**
   * @typeParam T - The type of values that the node will emit.
   */
  singletonSub<T>(node: Out<T>, subscription: Subscription<T> | undefined): UnsubscribeHandle {
    if (this.parentEngine?.hasOwnOrParentHasRef(node) === true) {
      // Delegate to parent's singletonSub
      return this.parentEngine.singletonSub(node, subscription)
    }
    this.register(node)
    if (subscription === undefined) {
      this.singletonSubscriptions.delete(node)
    } else {
      this.singletonSubscriptions.set(node, subscription as Subscription<unknown>)
    }
    return () => this.singletonSubscriptions.delete(node)
  }

  /**
   * Creates or resolves an existing stream instance in the engine. Useful as a joint point when building your own operators.
   * @returns a reference to the stream.
   * @param distinct - true by default. Pass false to mark the stream as a non-distinct one, meaning that publishing the same value multiple times will re-trigger a recomputation cycle.
   * @param node - optional, a reference to a stream. If the stream has not been touched in the engine before, the engine will instantiate a reference to it. If it's registered already, the function will return the reference.
   * @typeParam T - The type of values that the stream will emit/accept.
   */
  streamInstance<T>(distinct: Distinct<T> = true, node = Symbol('stream')): NodeRef<T> {
    this.diagnosticNodeKinds.set(node, getNodeDiagnosticKind(node))
    if (distinct !== false) {
      this.distinctNodes.set(node, distinct === true ? defaultComparator : (distinct as Comparator<unknown>))
      this.streamState.set(node, emptyStreamValue)
    }
    return node as NodeRef<T>
  }

  /**
   * @typeParam T - The type of values that the node will emit.
   */
  sub<T>(node: Out<T>, subscription: Subscription<T>): UnsubscribeHandle {
    if (this.parentEngine?.hasOwnOrParentHasRef(node) === true) {
      // Delegate to parent's sub
      return this.parentEngine.sub(node, subscription)
    }
    this.register(node)
    const nodeSubscriptions = this.subscriptions.getOrCreate(node)
    nodeSubscriptions.add(subscription as Subscription<unknown>)
    return () => nodeSubscriptions.delete(subscription as Subscription<unknown>)
  }

  subMultiple(nodes: Out[], subscription: Subscription<any>): UnsubscribeHandle {
    const sink = this.streamInstance()
    this.connect({
      map:
        (done) =>
        (...args) => {
          done(args)
        },
      sink,
      sources: nodes,
    })
    return this.sub(sink, subscription)
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private createDiagnosticCycle(
    registration: DiagnosticObserverRegistration,
    ids: symbol[],
    values: Record<symbol, unknown>,
    transaction: DiagnosticTransaction,
    cycleRef: DiagnosticCycleRef,
    origin: PropagationCycle['origin'],
    applicationParentCycle: DiagnosticCycleRef | undefined
  ): DiagnosticCycleCapture {
    recordDiagnosticAllocation('cycle')
    const cycle: MutablePropagationCycle = {
      cycleId: cycleRef.cycleId,
      durationMs: 0,
      engineInstanceId: this.diagnosticInstanceId,
      events: [],
      origin,
      roots: [],
      startedAt: diagnosticNow(),
      status: 'completed',
      transactionId: transaction.id,
    }
    if (this.id !== undefined) {
      cycle.engineLabel = this.id
    }
    if (applicationParentCycle !== undefined) {
      cycle.parentCycle = { ...applicationParentCycle }
    }

    const capture = { cycle, registration }
    for (const node$ of ids) {
      const node = this.diagnosticIdentity(node$)
      recordDiagnosticAllocation('root')
      const root: MutableDiagnosticRootPublication = { node }
      const value = this.diagnosticValue(capture, node$, node, values[node$], 'root')
      if (value !== undefined) {
        root.value = value
      }
      cycle.roots.push(root)
    }
    return capture
  }

  private diagnosticCandidate(
    capture: DiagnosticCycleCapture,
    node$: symbol,
    node: DiagnosticNodeIdentity,
    outcome: DiagnosticCandidate['outcome'],
    hadPrevious: boolean,
    previous: unknown,
    next: unknown,
    error?: DiagnosticNodeError
  ): MutableDiagnosticCandidate {
    recordDiagnosticAllocation('candidate')
    const candidate: MutableDiagnosticCandidate = { outcome }
    const nextValue = this.diagnosticValue(capture, node$, node, next, 'candidate')
    if (hadPrevious) {
      const previousValue = this.diagnosticValue(capture, node$, node, previous, 'previous')
      if (previousValue !== undefined) {
        candidate.previous = previousValue
      }
    }
    if (nextValue !== undefined) {
      candidate.next = nextValue
    }
    if (error !== undefined) {
      candidate.error = error
    }
    return candidate
  }

  private diagnosticError(
    error: unknown,
    phase: DiagnosticNodeError['phase'],
    node: DiagnosticNodeIdentity,
    capture: DiagnosticCycleCapture
  ): DiagnosticNodeError {
    const context: Omit<DiagnosticValueContext, 'field' | 'node'> = {
      cycleId: capture.cycle.cycleId,
      engineInstanceId: this.diagnosticInstanceId,
      transactionId: capture.cycle.transactionId,
    }
    if (this.id !== undefined) {
      context.engineLabel = this.id
    }
    return createDiagnosticError(error, phase, node, capture.registration.options, context)
  }

  private diagnosticIdentity(node$: symbol): DiagnosticNodeIdentity {
    let id = this.diagnosticNodeIds.get(node$)
    if (id === undefined) {
      this.diagnosticNodeId += 1
      id = `node-${this.diagnosticNodeId}`
      this.diagnosticNodeIds.set(node$, id)
    }
    recordDiagnosticAllocation('node-identity')
    const identity: Mutable<DiagnosticNodeIdentity> = {
      id,
      kind: this.diagnosticNodeKinds.get(node$) ?? getNodeDiagnosticKind(node$),
    }
    const label = getNodeDiagnosticLabel(node$)
    if (label !== undefined) {
      identity.label = label
    }
    return identity
  }

  private diagnosticValue(
    capture: DiagnosticCycleCapture,
    node$: symbol,
    node: DiagnosticNodeIdentity,
    value: unknown,
    field: DiagnosticValueContext['field']
  ) {
    const context: DiagnosticValueContext = {
      cycleId: capture.cycle.cycleId,
      engineInstanceId: this.diagnosticInstanceId,
      field,
      node,
      transactionId: capture.cycle.transactionId,
    }
    if (this.id !== undefined) {
      context.engineLabel = this.id
    }
    return summarizeDiagnosticValue(node$, value, capture.registration.options, context)
  }

  private hasDiagnosticsInFamily(): boolean {
    if (this.parentEngine !== undefined) {
      return this.parentEngine.hasDiagnosticsInFamily()
    }
    return this.diagnosticObserverCountInTree > 0
  }

  private adjustDiagnosticObserverCount(delta: number): void {
    this.diagnosticObserverCountInTree += delta
    this.parentEngine?.adjustDiagnosticObserverCount(delta)
  }

  private calculateExecutionMap(nodes: symbol[]) {
    const participatingNodes: symbol[] = []
    const visitedNodes = new Set()
    const pendingPulls = new SetMap<symbol>()
    const refCount = new RefCount()
    const projections = new SetMap<NodeProjection>()

    const visit = (node: symbol, insertIndex = 0) => {
      refCount.increment(node)

      if (visitedNodes.has(node)) {
        return
      }

      this.register(node as NodeRef)

      pendingPulls.use(node, (pulls) => {
        insertIndex = Math.max(...Array.from(pulls).map((key) => participatingNodes.indexOf(key))) + 1
      })

      this.graph.use(node, (sinkProjections) => {
        for (const projection of sinkProjections) {
          if (projection.sources.has(node)) {
            projections.getOrCreate(projection.sink).add(projection)
            visit(projection.sink, insertIndex)
          } else {
            pendingPulls.getOrCreate(projection.sink).add(node)
          }
        }
      })

      visitedNodes.add(node)
      participatingNodes.splice(insertIndex, 0, node)
    }

    nodes.forEach(visit)

    return { participatingNodes, pendingPulls, projections, refCount }
  }

  private combineOperators<T>(...o: []): (s: Out<T>) => NodeRef<T> // prettier-ignore
  private combineOperators<T, O1>(...o: [O<T, O1>]): (s: Out<T>) => NodeRef<O1> // prettier-ignore
  private combineOperators<T, O1, O2>(...o: [O<T, O1>, O<O1, O2>]): (s: Out<T>) => NodeRef<O2> // prettier-ignore
  private combineOperators<T, O1, O2, O3>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): (s: Out<T>) => NodeRef<O3> // prettier-ignore
  private combineOperators<T, O1, O2, O3, O4>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): (s: Out<T>) => NodeRef<O4> // prettier-ignore
  private combineOperators<T, O1, O2, O3, O4, O5>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): (s: Out<T>) => NodeRef<O5> // prettier-ignore
  private combineOperators<T, O1, O2, O3, O4, O5, O6>(
    ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]
  ): (s: Out<T>) => NodeRef<O6> // prettier-ignore
  private combineOperators<T, O1, O2, O3, O4, O5, O6, O7>(
    ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]
  ): (s: Out<T>) => NodeRef<O7> // prettier-ignore
  private combineOperators<T>(...o: O<unknown, unknown>[]): (s: Out<T>) => NodeRef
  private combineOperators<T>(...o: O<unknown, unknown>[]): (s: Out<T>) => NodeRef {
    return (source: Out) => {
      for (const op of o) {
        source = op(source, this)
      }
      return source as NodeRef
    }
  }

  private getExecutionMap(nodes: symbol[]) {
    let key: symbol | symbol[] = nodes
    if (nodes.length === 1) {
      const singleNode = nodes[0]
      invariant(singleNode !== undefined, 'Single node array should have one element')
      key = singleNode
      const existingMap = this.executionMaps.get(key)
      if (existingMap !== undefined) {
        return existingMap
      }
    } else {
      for (const [existingKey, existingMap] of this.executionMaps.entries()) {
        if (Array.isArray(existingKey) && existingKey.length === nodes.length && existingKey.every((id) => nodes.includes(id))) {
          return existingMap
        }
      }
    }

    const map = this.calculateExecutionMap(nodes)
    this.executionMaps.set(key, map)
    return map
  }

  private hasOwnOrParentHasRef(node: NodeRef): boolean {
    return Boolean(this.parentEngine?.hasOwnOrParentHasRef(node)) || this.definitionRegistry.has(node)
  }

  private readonly nodeInitSubscription = <T>(nodes$: NodeRef<T>[], init: NodeInit<T>) => {
    // Skip if this init has already been called in this engine
    if (this.calledInits.has(init as NodeInit<unknown>)) {
      return
    }

    // Check if any of the nodes are already initialized
    for (const node$ of nodes$) {
      if (this.definitionRegistry.has(node$)) {
        this.calledInits.add(init as NodeInit<unknown>)
        init(this, node$)
        return
      }
    }
  }
}
