import type { O } from './operators'
import type {
  CombinedCellRecord,
  Comparator,
  Distinct,
  ExecutionMap,
  Inp,
  NodeProjection,
  NodeRef,
  Out,
  ProjectionFunc,
  Subscription,
  TracerConsole,
  UnsubscribeHandle,
} from './types'

import { CC } from './CC'
import { CELL_TYPE, inEngineContext, nodeDefs$$, nodeInits$$ } from './globals'
import { getNodeLabel } from './nodeUtils'
import { RefCount } from './RefCount'
import { SetMap } from './SetMap'
import { Tracer } from './Tracer'
import { combinedCellProjection, defaultComparator, tap } from './utils'

/**
 * The engine orchestrates any cells and streams that it touches. The engine also stores the state and the dependencies of the nodes that are referred through it.
 * @category Engine
 */
export class Engine {
  public readonly tracer = new Tracer()
  private readonly combinedCells: CombinedCellRecord[] = []
  private readonly definitionRegistry = new Set<symbol>()
  private readonly distinctNodes = new Map<symbol, Comparator<unknown>>()
  private readonly executionMaps = new Map<symbol | symbol[], ExecutionMap>()
  private readonly graph = new SetMap<NodeProjection>()
  private readonly singletonSubscriptions = new Map<symbol, Subscription<unknown>>()
  private readonly state = new Map<symbol, unknown>()
  private readonly subscriptions = new SetMap<Subscription<unknown>>()

  /**
   * Creates a new engine.
   * @param initialValues - the initial cell values that will populate the engine.
   * Those values will not trigger a recomputation cycle, and will overwrite the initial values specified for each cell.
   */
  constructor(initialValues: Record<symbol, unknown> = {}) {
    for (const id of Object.getOwnPropertySymbols(initialValues)) {
      this.state.set(id, initialValues[id])
    }
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

  dispose() {
    this.combinedCells.length = 0
    this.definitionRegistry.clear()
    this.distinctNodes.clear()
    this.executionMaps.clear()
    this.graph.clear()
    this.singletonSubscriptions.clear()
    this.state.clear()
    this.subscriptions.clear()
  }

  /**
   * @typeParam T - The type of values that the node emits.
   */
  getValue<T>(node: Out<T>): T {
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
  pubIn(values: Record<symbol, unknown>) {
    const ids = Reflect.ownKeys(values) as symbol[]

    const tracePayload = Reflect.ownKeys(values).map((key) => {
      return { [getNodeLabel(key as symbol)]: values[key as symbol] }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.tracer.log(CC.blue('Engine pub '), tracePayload as any)
    this.tracer.groupCollapsed('pub:')

    const map = this.getExecutionMap(ids)
    const refCount = map.refCount.clone()
    const participatingNodeKeys = map.participatingNodes.slice()
    const transientState = new Map<symbol, unknown>(this.state)

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
      this.tracer.groupCollapsed(`${getNodeLabel(id)}:`)
      let resolved = false
      const done = (value: unknown) => {
        const dnRef = this.distinctNodes.get(id)
        if (dnRef?.(transientState.get(id), value)) {
          this.tracer.log(`Skipping ${getNodeLabel(id)}, value is already`, value)
          resolved = false
          return
        }
        resolved = true
        transientState.set(id, value)

        this.tracer.log(CC.blue('Transient state: '), value)
        if (this.state.has(id)) {
          this.tracer.log(CC.blue('Persisting state: '), value)
          this.state.set(id, value)
        }
      }
      if (Object.hasOwn(values, id)) {
        this.tracer.log(CC.blue(`${getNodeLabel(id)}: `), 'value found in direct payload')
        done(values[id])
      } else {
        map.projections.use(id, (nodeProjections) => {
          for (const projection of nodeProjections) {
            const args = [...Array.from(projection.sources), ...Array.from(projection.pulls)].map((id) => transientState.get(id))
            this.tracer.log(CC.blue(`Start projection `), getNodeLabel(id), ' args: ', args)
            this.tracer.groupCollapsed(getNodeLabel(id))
            projection.map(done)(...args)
            this.tracer.groupEnd()
          }
        })
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (resolved) {
        const value = transientState.get(id)

        this.tracer.log(CC.blue('Value resolved: '), value)
        inEngineContext(this, () => {
          this.subscriptions.use(id, (nodeSubscriptions) => {
            for (const subscription of nodeSubscriptions) {
              this.tracer.log(CC.blue('Calling subscription: '), subscription.name || '<anonymous>', value)
              subscription(value, this)
            }
          })
          this.singletonSubscriptions.get(id)?.(value, this)
        })
      } else {
        nodeWillNotEmit(id)
      }
      this.tracer.groupEnd()
    }
    this.tracer.groupEnd()
  }

  /**
   * Explicitly includes the specified cell/stream reference in the engine.
   * Most of the time you don't need to do that, since any interaction with the node through an engine will register it.
   * The only exception of that rule should be when the interaction is conditional, and the node definition includes an init function that needs to be eagerly evaluated.
   */
  register(node$: NodeRef) {
    const definition = nodeDefs$$.get(node$)
    // node that's within the instance
    if (definition === undefined) {
      return node$
    }

    if (!this.definitionRegistry.has(node$)) {
      this.definitionRegistry.add(node$)
      this.tracer.log(CC.blue(`Registration `), getNodeLabel(node$))

      const instance$ =
        definition.type === CELL_TYPE
          ? this.cellInstance(definition.initial, definition.distinct, node$)
          : this.streamInstance(definition.distinct, node$)

      inEngineContext(this, () => {
        nodeInits$$.use(instance$, (inits) => {
          for (const init of inits) {
            init(this, node$)
          }
        })
      })

      return instance$
    }
    return node$
  }

  /**
   * Clears all exclusive subscriptions.
   */
  resetSingletonSubs() {
    this.singletonSubscriptions.clear()
  }

  setLabel(label: string) {
    this.tracer.setInstanceLabel(label)
  }

  /**
   * Sets the console instance used by the engine tracing.
   */
  setTracerConsole(console: TracerConsole | undefined) {
    this.tracer.setConsole(console)
  }

  /**
   * @typeParam T - The type of values that the node will emit.
   */
  singletonSub<T>(node: Out<T>, subscription: Subscription<T> | undefined): UnsubscribeHandle {
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
   * @param node - optional, a reference to a stream. If the signal has not been touched in the engine before, the engine will instantiate a reference to it. If it's registered already, the function will return the reference.
   * @typeParam T - The type of values that the stream will emit/accept.
   */
  streamInstance<T>(distinct: Distinct<T> = true, node = Symbol()): NodeRef<T> {
    if (distinct !== false) {
      this.distinctNodes.set(node, distinct === true ? defaultComparator : (distinct as Comparator<unknown>))
    }
    return node as NodeRef<T>
  }

  /**
   * @typeParam T - The type of values that the node will emit.
   */
  sub<T>(node: Out<T>, subscription: Subscription<T>): UnsubscribeHandle {
    this.register(node)
    const nodeSubscriptions = this.subscriptions.getOrCreate(node)
    nodeSubscriptions.add(subscription as Subscription<unknown>)
    return () => nodeSubscriptions.delete(subscription as Subscription<unknown>)
  }

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
  private combineOperators<T>(...o: []): (s: Out<T>) => NodeRef<T> // prettier-ignore
  private combineOperators<T, O1>(...o: [O<T, O1>]): (s: Out<T>) => NodeRef<O1> // prettier-ignore
  private combineOperators<T, O1, O2>(...o: [O<T, O1>, O<O1, O2>]): (s: Out<T>) => NodeRef<O2> // prettier-ignore
  private combineOperators<T, O1, O2, O3>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): (s: Out<T>) => NodeRef<O3> // prettier-ignore
  private combineOperators<T, O1, O2, O3, O4>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): (s: Out<T>) => NodeRef<O4> // prettier-ignore
  private combineOperators<T, O1, O2, O3, O4, O5>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): (s: Out<T>) => NodeRef<O5> // prettier-ignore
  private combineOperators<T, O1, O2, O3, O4, O5, O6>( ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]): (s: Out<T>) => NodeRef<O6> // prettier-ignore
  private combineOperators<T, O1, O2, O3, O4, O5, O6, O7>( ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]): (s: Out<T>) => NodeRef<O7> // prettier-ignore
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
      key = nodes[0]
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
}
