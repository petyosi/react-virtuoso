import type { O } from './operators'

import { CELL_TYPE, defaultComparator, getNodeLabel, nodeDefs$$, nodeInits$$ } from './globals'
import { RefCount } from './RefCount'
import { SetMap } from './SetMap'
import { CC, Tracer, TracerConsole } from './Tracer'
import {
  Comparator,
  Distinct,
  ExecutionMap,
  Inp,
  NodeRef,
  Out,
  ProjectionFunc,
  RealmProjection,
  Subscription,
  UnsubscribeHandle,
} from './types'
import { tap } from './utils'

/**
 * The realm is the actual "engine" that orchestrates any cells and signals that it touches. The realm also stores the state and the dependencies of the nodes that are referred through it.
 *
 */
export class Realm {
  public get tracer() {
    return this._tracer
  }

  private readonly _tracer = new Tracer()
  private readonly definitionRegistry = new Set<symbol>()
  private readonly distinctNodes = new Map<symbol, Comparator<unknown>>()
  private readonly executionMaps = new Map<symbol | symbol[], ExecutionMap>()
  private readonly graph = new SetMap<RealmProjection>()
  private readonly singletonSubscriptions = new Map<symbol, Subscription<unknown>>()
  private readonly state = new Map<symbol, unknown>()

  private readonly subscriptions = new SetMap<Subscription<unknown>>()

  /**
   * Creates a new realm.
   * @param initialValues - the initial cell values that will populate the realm.
   * Those values will not trigger a recomputation cycle, and will overwrite the initial values specified for each cell.
   */
  constructor(initialValues: Record<symbol, unknown> = {}) {
    for (const id of Object.getOwnPropertySymbols(initialValues)) {
      this.state.set(id, initialValues[id])
    }
  }

  /**
   * Creates or resolves an existing cell instance in the realm. Useful as a joint point when building your own operators.
   * @returns a reference to the cell.
   * @param value - the initial value of the cell
   * @param distinct - true by default. Pass false to mark the signal as a non-distinct one, meaning that publishing the same value multiple times will re-trigger a recomputation cycle.
   * @param node - optional, a reference to a cell. If the cell has not been touched in the realm before, the realm will instantiate a reference to it. If it's registered already, the function will return the reference.
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
   * Convenient for mutation of cells that contian non-primitive values (e.g. arrays, or objects).
   * Specifies that the cell value should be changed when source emits, with the result of the map callback parameter.
   * the map parameter gets called with the current value of the cell and the value published through the source.
   * @typeParam T - the type of the cell value.
   * @typeParam K - the type of the value published through the source.
   * @example
   * ```ts
   * const items$ = Cell<string[]([])
   * const addItem$ = Signal<string>(false, (r) => {
   *   r.changeWith(items$, addItem$, (items, item) => [...items, item])
   * })
   * const r = new Realm()
   * r.pub(addItem$, 'foo')
   * r.pub(addItem$, 'bar')
   * r.getValue(items$) // ['foo', 'bar']
   * ```
   */
  changeWith<T, K>(cell: Inp<T>, source: Out<K>, map: (cellValue: T, signalValue: K) => T) {
    this.connect({
      map: (done) => (signalValue: K, cellValue: T) => {
        done(map(cellValue, signalValue))
      },
      pulls: [cell],
      sink: cell,
      sources: [source],
    })
  }

  /**
   * Combines the values from multiple nodes into a single node that emits an array of the latest values of the nodes.
   *
   * When one of the source nodes emits a value, the combined node emits an array of the latest values from each node.
   */
  combine<T1>(...nodes: [Out<T1>]): Out<T1> // prettier-ignore
  combine<T1, T2>(...nodes: [Out<T1>, Out<T2>]): Out<[T1, T2]> // prettier-ignore
  combine<T1, T2, T3>(...nodes: [Out<T1>, Out<T2>, Out<T3>]): Out<[T1, T2, T3]> // prettier-ignore
  combine<T1, T2, T3, T4>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): Out<[T1, T2, T3, T4]> // prettier-ignore
  combine<T1, T2, T3, T4, T5>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): Out<[T1, T2, T3, T4, T5]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]): Out<[T1, T2, T3, T4, T5, T6]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]): Out<[T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>] ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>] ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>] ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18> ]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19> ]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19]> // prettier-ignore
  combine(...sources: Out[]): Out {
    return tap(this.signalInstance(), (sink) => {
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
   */
  combineCells<T1>(...nodes: [Out<T1>]): Out<[T1]> // prettier-ignore
  combineCells<T1, T2>(...nodes: [Out<T1>, Out<T2>]): Out<[T1, T2]> // prettier-ignore
  combineCells<T1, T2, T3>(...nodes: [Out<T1>, Out<T2>, Out<T3>]): Out<[T1, T2, T3]> // prettier-ignore
  combineCells<T1, T2, T3, T4>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): Out<[T1, T2, T3, T4]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): Out<[T1, T2, T3, T4, T5]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]): Out<[T1, T2, T3, T4, T5, T6]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]): Out<[T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>] ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19>, Out<T20>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21>( ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19>, Out<T20>, Out<T21>, ]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21]> // prettier-ignore
  combineCells(...sources: Out[]): Out {
    return tap(
      this.cellInstance(
        sources.map((source) => this.getValue(source)),
        true
      ),
      (sink) => {
        this.connect({
          map:
            (done) =>
            (...args) => {
              done(args)
            },
          sink,
          sources,
        })
      }
    )
  }
  /**
   * A low-level utility that connects multiple nodes to a sink node with a map function. Used as a foundation for the higher-level operators.
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
    const dependency: RealmProjection<T> = {
      map,
      pulls: new Set(pulls),
      sink: this.register(sink),
      sources: new Set(sources),
    }

    for (const node of [...sources, ...pulls]) {
      this.register(node)
      this.graph.getOrCreate(node).add(dependency as RealmProjection)
    }

    this.executionMaps.clear()
  }
  /**
   * Gets the current value of a node. The node must be stateful.
   * @remark if possible, use {@link withLatestFrom} or {@link combine}, as getValue will not create a dependency to the passed node,
   * which means that if you call it within a computational cycle, you may not get the correct value.
   * @param node - the node instance.
   * @example
   * ```ts
   * const foo$ = Cell('foo')
   *
   * const r = new Realm()
   * r.getValue(foo$) // 'foo'
   * r.pub(foo$, 'bar')
   * //...
   * r.getValue(foo$) // 'bar'
   * ```
   */
  getValue<T>(node: Out<T>): T {
    this.register(node)
    return this.state.get(node) as T
  }

  /**
   * Gets the current values of the specified nodes. Works just like {@link getValue}, but with an array of node references.
   */
  getValues<T1>(nodes: [Out<T1>]): [T1] // prettier-ignore
  getValues<T1, T2>(nodes: [Out<T1>, Out<T2>]): [T1, T2] // prettier-ignore
  getValues<T1, T2, T3>(nodes: [Out<T1>, Out<T2>, Out<T3>]): [T1, T2, T3] // prettier-ignore
  getValues<T1, T2, T3, T4>(nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): [T1, T2, T3, T4] // prettier-ignore
  getValues<T1, T2, T3, T4, T5>(nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): [T1, T2, T3, T4, T5] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6>(nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]): [T1, T2, T3, T4, T5, T6] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]): [T1, T2, T3, T4, T5, T6, T7] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]): [T1, T2, T3, T4, T5, T6, T7, T8] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13] // prettier-ignore
  getValues<T>(nodes: Out<T>[]): unknown[]
  getValues(nodes: Out[]) {
    return nodes.map((node) => this.getValue(node))
  }

  /**
   * Links the output of a node to the input of another node.
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
   * Creates a new node that emits the values of the source node transformed through the specified operators.
   * @example
   * ```ts
   * const signal$ = Signal<number>(true, (r) => {
   *   const signalPlusOne$ = r.pipe(signal$, map(i => i + 1))
   *   r.sub(signalPlusOne$, console.log)
   * })
   * const r = new Realm()
   * r.pub(signal$, 1)
   */
  pipe<T>(s: Out<T>): NodeRef<T> // prettier-ignore
  pipe<T, O1>(s: Out<T>, o1: O<T, O1>): NodeRef<O1> // prettier-ignore
  pipe<T, O1, O2>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>]): NodeRef<O2> // prettier-ignore
  pipe<T, O1, O2, O3>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): NodeRef<O3> // prettier-ignore
  pipe<T, O1, O2, O3, O4>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): NodeRef<O4> // prettier-ignore
  pipe<T, O1, O2, O3, O4, O5>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): NodeRef<O5> // prettier-ignore
  pipe<T, O1, O2, O3, O4, O5, O6>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]): NodeRef<O6> // prettier-ignore
  pipe<T, O1, O2, O3, O4, O5, O6, O7>( s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]): NodeRef<O7> // prettier-ignore
  pipe<T, O1, O2, O3, O4, O5, O6, O7, O8>( s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>]): NodeRef<O8> // prettier-ignore
  pipe<T, O1, O2, O3, O4, O5, O6, O7, O8, O9>( s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>, O<O8, O9>]): NodeRef<O9> // prettier-ignore
  pipe<T>(source: Out<T>, ...operators: O<unknown, unknown>[]): NodeRef
  pipe<T>(source: Out<T>, ...operators: O<unknown, unknown>[]): NodeRef {
    return this.combineOperators(...operators)(source)
  }
  /**
   * Runs the subscrptions of this node.
   * @example
   * ```ts
   * const foo$ = Action((r) => {
   *  r.sub(foo$, console.log)
   * })
   *
   * const r = new Realm()
   * r.pub(foo$)
   */
  pub<T>(node: Inp<T>): void
  /**
   * Publishes the specified value into a node.
   * @example
   * ```ts
   * const foo$ = Cell('foo')
   * const r = new Realm()
   * r.pub(foo$, 'bar')
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
   * const r = new Realm()
   * r.pubIn({[foo$]: 'foo1', [bar$]: 'bar1'})
   * ```
   */
  pubIn(values: Record<symbol, unknown>) {
    const ids = Reflect.ownKeys(values) as symbol[]

    const tracePayload = Reflect.ownKeys(values).map((key) => {
      return { [getNodeLabel(key as symbol)]: values[key as symbol] }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.tracer.log(CC.blue('Realm pub '), tracePayload as any)
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
        this.subscriptions.use(id, (nodeSubscriptions) => {
          for (const subscription of nodeSubscriptions) {
            this.tracer.log(CC.blue('Calling subscription: '), subscription.name || '<anonymous>', value)
            subscription(value, this)
          }
        })
        this.singletonSubscriptions.get(id)?.(value, this)
      } else {
        nodeWillNotEmit(id)
      }
      this.tracer.groupEnd()
    }
    this.tracer.groupEnd()
  }
  /**
   * Explicitly includes the specified cell/signal/pipe reference in the realm.
   * Most of the time you don't need to do that, since any interaction with the node through a realm will register it.
   * The only exception of that rule should be when the interaction is conditional, and the node definition includes an init function that needs to be eagerly evaluated.
   */
  register(node$: NodeRef) {
    const definition = nodeDefs$$.get(node$)
    // local node
    if (definition === undefined) {
      return node$
    }

    if (!this.definitionRegistry.has(node$)) {
      this.definitionRegistry.add(node$)

      return tap(
        definition.type === CELL_TYPE
          ? this.cellInstance(definition.initial, definition.distinct, node$)
          : this.signalInstance(definition.distinct, node$),
        (theNode$) => {
          definition.init(this, theNode$)
          nodeInits$$.use(node$, (inits) => {
            for (const init of inits) {
              init(this, node$)
            }
          })
        }
      )
    }
    return node$
  }
  /**
   * Clears all exclusive subscriptions.
   */
  resetSingletonSubs() {
    this.singletonSubscriptions.clear()
  }

  /**
   * Sets the console instance used by the realm tracing.
   */
  setTracerConsole(console: TracerConsole | undefined) {
    this._tracer.setConsole(console)
  }
  /**
   * Creates or resolves an existing signal instance in the realm. Useful as a joint point when building your own operators.
   * @returns a reference to the signal.
   * @param distinct - true by default. Pass false to mark the signal as a non-distinct one, meaning that publishing the same value multiple times will re-trigger a recomputation cycle.
   * @param node - optional, a reference to a signal. If the signal has not been touched in the realm before, the realm will instantiate a reference to it. If it's registered already, the function will return the reference.
   */
  signalInstance<T>(distinct: Distinct<T> = true, node = Symbol()): NodeRef<T> {
    if (distinct !== false) {
      this.distinctNodes.set(node, distinct === true ? defaultComparator : (distinct as Comparator<unknown>))
    }
    return node as NodeRef<T>
  }
  /**
   * Subscribes exclusively to values in the referred node.
   * Calling this multiple times on a single node will remove the previous subscription created through `singletonSub`.
   * Subscriptions created through `sub` are not affected.
   * @returns a function that, when called, will cancel the subscription.
   *
   * @example
   * ```ts
   * const signal$ = Signal<number>()
   * const r = new Realm()
   * // console.log will run only once.
   * r.singletonSub(signal$, console.log)
   * r.singletonSub(signal$, console.log)
   * r.singletonSub(signal$, console.log)
   * r.pub(signal$, 2)
   * ```
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
   * Subscribes to the values published in the referred node.
   * @param node - the cell/signal to subscribe to.
   * @param subscription - the callback to execute when the node receives a new value.
   * @returns a function that, when called, will cancel the subscription.
   *
   * @example
   * ```ts
   * const signal$ = Signal<number>()
   * const r = new Realm()
   * const unsub = r.sub(signal$, console.log)
   * r.pub(signal$, 2)
   * unsub()
   * r.pub(signal$, 3)
   * ```
   */
  sub<T>(node: Out<T>, subscription: Subscription<T>): UnsubscribeHandle {
    this.register(node)
    const nodeSubscriptions = this.subscriptions.getOrCreate(node)
    nodeSubscriptions.add(subscription as Subscription<unknown>)
    return () => nodeSubscriptions.delete(subscription as Subscription<unknown>)
  }

  /**
   * Subscribes to multiple nodes at once. If any of the nodes emits a value, the subscription will be called with an array of the latest values from each node.
   * If the nodes change within a single execution cycle, the subscription will be called only once with the final node values.
   *
   * @example
   * ```ts
   * const foo$ = Cell('foo')
   * const bar$ = Cell('bar')
   *
   * const trigger$ = Signal<number>(true, (r) => {
   *   r.link(r.pipe(trigger$, map(i => `foo${i}`)), foo$)
   *   r.link(r.pipe(trigger$, map(i => `bar${i}`)), bar$)
   * })
   *
   * const r = new Realm()
   * r.subMultiple([foo$, bar$], ([foo, bar]) => console.log(foo, bar))
   * r.pub(trigger$, 2)
   * ```
   */
  subMultiple<T1>(nodes: [Out<T1>], subscription: Subscription<[T1]>): UnsubscribeHandle
  subMultiple<T1, T2>(nodes: [Out<T1>, Out<T2>], subscription: Subscription<[T1, T2]>): UnsubscribeHandle
  subMultiple<T1, T2, T3>(nodes: [Out<T1>, Out<T2>, Out<T3>], subscription: Subscription<[T1, T2, T3]>): UnsubscribeHandle
  subMultiple<T1, T2, T3, T4>(nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>], subscription: Subscription<[T1, T2, T3, T4]>): UnsubscribeHandle
  subMultiple<T1, T2, T3, T4, T5>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>], subscription: Subscription<[T1, T2, T3, T4, T5]>): UnsubscribeHandle // prettier-ignore
  subMultiple<T1, T2, T3, T4, T5, T6>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>], subscription: Subscription<[T1, T2, T3, T4, T5, T6]>): UnsubscribeHandle // prettier-ignore
  subMultiple<T1, T2, T3, T4, T5, T6, T7>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>], subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7]>): UnsubscribeHandle // prettier-ignore
  subMultiple<T1, T2, T3, T4, T5, T6, T7, T8>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>], subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7, T8]>): UnsubscribeHandle // prettier-ignore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subMultiple(nodes: Out[], subscription: Subscription<any>): UnsubscribeHandle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subMultiple(nodes: Out[], subscription: Subscription<any>): UnsubscribeHandle {
    const sink = this.signalInstance()
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

  /**
   * Works as a reverse pipe.
   * Constructs a function, that, when passed a certain node (sink), will create a node that will work as a publisher through the specified pipes into the sink.
   * @example
   * ```ts
   * const foo$ = Cell('foo')
   * const bar$ = Cell('bar')
   * const entry$ = Signal<number>(true, (r) => {
   *  const transform = r.transformer(map(x: number => `num${x}`))
   *  const transformFoo$ = transform(foo$)
   *  const transformBar$ = transform(bar$)
   *  r.link(entry$, transformFoo$)
   *  r.link(entry$, transformBar$)
   * })
   *
   * const r = new Realm()
   * r.pub(entry$, 1) // Both foo$ and bar$ now contain `num1`
   * ```
   */
  transformer<In>(...o: []): (s: Inp<In>) => Inp<In> // prettier-ignore
  transformer<In, Out>(...o: [O<In, Out>]): (s: Inp<Out>) => Inp<In> // prettier-ignore
  transformer<In, Out, O1>(...o: [O<In, O1>, O<O1, Out>]): (s: Inp<Out>) => Inp<In> // prettier-ignore
  transformer<In, Out, O1, O2>(...o: [O<In, O1>, O<O1, O2>, O<O2, Out>]): (s: Inp<Out>) => Inp<In> // prettier-ignore
  transformer<In, Out, O1, O2, O3>(...o: [O<In, O1>, O<O1, O2>, O<O2, O3>, O<O3, Out>]): (s: Inp<Out>) => Inp<In> // prettier-ignore
  transformer<In, Out, O1, O2, O3, O4>(...o: [O<In, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, Out>]): (s: Inp<Out>) => Inp<In> // prettier-ignore
  transformer<In, Out, O1, O2, O3, O4, O5>( ...o: [O<In, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, Out>]): (s: Inp<Out>) => Inp<In> // prettier-ignore
  transformer<In, Out>(...operators: O<unknown, unknown>[]): (s: Inp<Out>) => Inp<In>
  transformer<In, Out>(...operators: O<unknown, unknown>[]): (s: Inp<Out>) => Inp<In> {
    return (sink: Inp<Out>) => {
      return tap(this.signalInstance<In>(), (source) => {
        this.link(this.pipe(source, ...operators), sink)
        return source
      })
    }
  }

  private calculateExecutionMap(nodes: symbol[]) {
    const participatingNodes: symbol[] = []
    const visitedNodes = new Set()
    const pendingPulls = new SetMap<symbol>()
    const refCount = new RefCount()
    const projections = new SetMap<RealmProjection>()

    const visit = (node: symbol, insertIndex = 0) => {
      refCount.increment(node)

      if (visitedNodes.has(node)) {
        return
      }

      this.register(node as NodeRef)

      pendingPulls.use(node, (pulls) => {
        // biome-ignore lint/style/noParameterAssign: this saves space
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
