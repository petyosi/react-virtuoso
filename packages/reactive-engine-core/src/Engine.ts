import invariant from 'tiny-invariant'

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

import { CELL_TYPE, inEngineContext, nodeDebugLabels$$, nodeDefs$$, nodeInits$$, nodeInitSubscriptions$$ } from './globals'
import { RefCount } from './RefCount'
import { SetMap } from './SetMap'
import { combinedCellProjection, defaultComparator, tap } from './utils'

// use this so that streams don't skip undefined values
const emptyStreamValue = Symbol('empty stream')

/**
 * The engine orchestrates any cells and streams that it touches. The engine also stores the state and the dependencies of the nodes that are referred through it.
 * @category Engine
 */
export class Engine {
  public readonly id?: string
  private readonly calledInits = new Set<NodeInit<unknown>>()
  private childEngines: Engine[] = []
  private readonly combinedCells: CombinedCellRecord[] = []
  private readonly definitionRegistry = new Set<symbol>()
  private readonly disposeCallbacks = new Set<() => void>()
  private readonly distinctNodes = new Map<symbol, Comparator<unknown>>()
  private readonly executionMaps = new Map<symbol | symbol[], ExecutionMap>()
  private readonly graph = new SetMap<NodeProjection>()
  private parentEngine: Engine | undefined = undefined
  private readonly parentEngineSingletonSubscriptions = new Map<symbol, Subscription<unknown>>()
  private readonly parentEngineSubscriptions = new SetMap<Subscription<unknown>>()
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
    for (const id of Object.getOwnPropertySymbols(initialValues)) {
      this.state.set(id, initialValues[id])
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
  cellInstance<T>(value: T, distinct: Distinct<T> = true, node = Symbol()): NodeRef<T> {
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
    if (comparator !== undefined) {
      this.distinctNodes.set(target$, comparator)
    } else {
      // delete
      this.distinctNodes.delete(target$)
    }
  }

  dispose() {
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

    this.combinedCells.length = 0
    this.definitionRegistry.clear()
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
    if (this.parentEngine?.hasOwnOrParentHasRef(node)) {
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
  // eslint-disable-next-line @typescript-eslint/unified-signatures
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
      this.parentEngine.pubIn(parentValues)
    } else {
      ownValues = values
    }

    const ids = Reflect.ownKeys(ownValues) as symbol[]

    const map = this.getExecutionMap(ids)
    const refCount = map.refCount.clone()
    const participatingNodeKeys = map.participatingNodes.slice()
    const transientState = new Map<symbol, unknown>([...this.state, ...this.streamState])

    const childChangePayload: Record<symbol, unknown> = {}

    const nodeWillNotEmit = (key: symbol) => {
      this.graph.use(key, (projections) => {
        for (const { sink, sources } of projections) {
          if (sources.has(key)) {
            refCount.decrement(sink, () => {
              participatingNodeKeys.splice(participatingNodeKeys.indexOf(sink), 1)
              nodeWillNotEmit(sink)
            })
          }
        }
      })
    }

    for (;;) {
      const nextId = participatingNodeKeys.shift()
      if (nextId === undefined) {
        break
      }
      const id = nextId
      let resolved = false
      const done = (value: unknown) => {
        const dnRef = this.distinctNodes.get(id)
        if (transientState.has(id) && dnRef?.(transientState.get(id), value)) {
          resolved = false
          return
        }
        resolved = true
        transientState.set(id, value)
        childChangePayload[id] = value

        if (this.state.has(id)) {
          this.state.set(id, value)
        } else if (this.streamState.has(id)) {
          this.streamState.set(id, value)
        }
      }
      if (Object.hasOwn(ownValues, id)) {
        done(ownValues[id])
      } else {
        map.projections.use(id, (nodeProjections) => {
          for (const projection of nodeProjections) {
            const args = [...Array.from(projection.sources), ...Array.from(projection.pulls)].map((id) => transientState.get(id))
            projection.map(done)(...args)
          }
        })
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (resolved) {
        const value = transientState.get(id)

        const debugLabel = nodeDebugLabels$$.get(id)
        if (debugLabel) {
          const displayValue = value === undefined ? '[triggered]' : value
          // eslint-disable-next-line no-console
          console.log(`[reactive-engine] ${debugLabel}:`, displayValue)
        }

        inEngineContext(this, () => {
          this.subscriptions.use(id, (nodeSubscriptions) => {
            for (const subscription of nodeSubscriptions) {
              subscription(value, this)
            }
          })
          this.singletonSubscriptions.get(id)?.(value, this)
        })
      } else {
        nodeWillNotEmit(id)
      }
    }

    for (const childEngine of this.childEngines) {
      // the pubIn will clone the passed payload, so the engines won't overlap with each other
      childEngine.pubIn(childChangePayload, true)
    }
  }

  /**
   * Explicitly includes the specified cell/stream reference in the engine.
   * Most of the time you don't need to do that, since any interaction with the node through an engine will register it.
   * The only exception of that rule should be when the interaction is conditional, and the node definition includes an init function that needs to be eagerly evaluated.
   */
  register(node$: NodeRef) {
    const definition = nodeDefs$$.get(node$)
    // node that's within the instance or registered in parent
    if (definition === undefined || this.definitionRegistry.has(node$) || this.parentEngine?.hasOwnOrParentHasRef(node$)) {
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
    if (this.parentEngine?.hasOwnOrParentHasRef(node)) {
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
  streamInstance<T>(distinct: Distinct<T> = true, node = Symbol()): NodeRef<T> {
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
    if (this.parentEngine?.hasOwnOrParentHasRef(node)) {
      // Delegate to parent's sub
      return this.parentEngine.sub(node, subscription)
    }
    this.register(node)
    const nodeSubscriptions = this.subscriptions.getOrCreate(node)
    nodeSubscriptions.add(subscription as Subscription<unknown>)
    return () => nodeSubscriptions.delete(subscription as Subscription<unknown>)
  }

  // biome-ignore lint/suspicious/noExplicitAny: any is god
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  private combineOperators<T>(...o: []): (s: Out<T>) => NodeRef<T> // biome-ignore format: keep-one-liner
  private combineOperators<T, O1>(...o: [O<T, O1>]): (s: Out<T>) => NodeRef<O1> // biome-ignore format: keep-one-liner
  private combineOperators<T, O1, O2>(...o: [O<T, O1>, O<O1, O2>]): (s: Out<T>) => NodeRef<O2> // biome-ignore format: keep-one-liner
  private combineOperators<T, O1, O2, O3>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): (s: Out<T>) => NodeRef<O3> // biome-ignore format: keep-one-liner
  private combineOperators<T, O1, O2, O3, O4>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): (s: Out<T>) => NodeRef<O4> // biome-ignore format: keep-one-liner
  private combineOperators<T, O1, O2, O3, O4, O5>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): (s: Out<T>) => NodeRef<O5> // biome-ignore format: keep-one-liner
  private combineOperators<T, O1, O2, O3, O4, O5, O6>(
    ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]
  ): (s: Out<T>) => NodeRef<O6> // biome-ignore format: keep-one-liner
  private combineOperators<T, O1, O2, O3, O4, O5, O6, O7>(
    ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]
  ): (s: Out<T>) => NodeRef<O7> // biome-ignore format: keep-one-liner
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
      invariant(singleNode, 'Single node array should have one element')
      key = singleNode
      const existingMap = this.executionMaps.get(key)
      if (existingMap !== undefined) {
        return existingMap
      }
    } else {
      for (const [key, existingMap] of this.executionMaps.entries()) {
        if (Array.isArray(key) && key.length === nodes.length && key.every((id) => nodes.includes(id))) {
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
