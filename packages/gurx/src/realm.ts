import type { O } from './operators'

import { RefCount } from './RefCount'
import { SetMap } from './SetMap'
import { noop, tap } from './utils'

const CELL_TYPE = 'cell'
const SIGNAL_TYPE = 'signal'
const PIPE_TYPE = 'pipe'

/**
 * A typed reference to a node.
 * @typeParam T - The type of values that the node emits.
 * @category Nodes
 */
export type NodeRef<T = unknown> = symbol & { valType: T }

/**
 * A function that is called when a node emits a value.
 * @typeParam T - The type of values that the node emits.
 */
export type Subscription<T> = (value: T) => unknown

export type PipeRef<I = unknown, O = unknown> = symbol & { inputType: I; outputType: O }

export type Inp<T = unknown> = NodeRef<T> | PipeRef<T>
export type Out<T = unknown> = NodeRef<T> | PipeRef<unknown, T>

/**
 * The resulting type of a subscription to a node. Can be used to cancel the subscription.
 */
export type UnsubscribeHandle = () => void

export type ProjectionFunc<T extends unknown[] = unknown[]> = (done: (...values: unknown[]) => void) => (...args: T) => void

interface RealmProjection<T extends unknown[] = unknown[]> {
  map: ProjectionFunc<T>
  pulls: Set<symbol>
  sink: symbol
  sources: Set<symbol>
}

/**
 * The default comparator for distinct nodes - a function to determine if two values are equal. Works for primitive values.
 * @category Nodes
 */
export function defaultComparator<T>(current: T, next: T) {
  return current === next
}

interface ExecutionMap {
  participatingNodes: symbol[]
  pendingPulls: SetMap<symbol>
  projections: SetMap<RealmProjection>
  refCount: RefCount
}

/**
 * A function which determines if two values are equal.
 * Implement custom comparators for distinct nodes that contain non-primitive values.
 * @param previous - The value that previously passed through the node. can be undefined if the node has not emitted a value yet.
 * @param current - The value currently passing.
 * @typeParam T - The type of values that the comparator compares.
 * @returns true if values should be considered equal.
 * @category Nodes
 */
export type Comparator<T> = (previous: T | undefined, current: T) => boolean

/**
 * A type for the distinct parameter to the {@link Cell} and {@link Signal} constructors.
 * @typeParam T - The type of values that the node emits.
 * @category Nodes
 */
export type Distinct<T> = boolean | Comparator<T>

/**
 * A node initializer function.
 */
export type NodeInit<T> = (r: Realm, node$: NodeRef<T>) => void

export type PipeInit<I, O> = (r: Realm, inputRef$: NodeRef<I>, outputRef$: NodeRef<O>) => void

interface CellDefinition<T> {
  distinct: Distinct<T>
  init: NodeInit<T>
  initial: T
  type: typeof CELL_TYPE
}

interface SignalDefinition<T> {
  distinct: Distinct<T>
  init: NodeInit<T>
  type: typeof SIGNAL_TYPE
}

interface PipeDefinition<I, O> {
  distinct: Distinct<I>
  init: PipeInit<I, O>
  initial: O
  type: typeof PIPE_TYPE
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeDefs$$ = new Map<symbol, CellDefinition<any> | PipeDefinition<any, any> | SignalDefinition<any>>()
const nodeLabels$$ = new Map<symbol, string>()

export const getNodeLabel = (node: symbol): string => {
  return nodeLabels$$.get(node) ?? '<anonymous>'
}

let currentRealm$$: Realm | undefined = undefined

/**
 * The realm is the actual "engine" that orchestrates any cells and signals that it touches. The realm also stores the state and the dependencies of the nodes that are referred through it.
 *
 */
export class Realm {
  private readonly definitionRegistry = new Set<symbol>()
  private readonly distinctNodes = new Map<symbol, Comparator<unknown>>()
  private readonly executionMaps = new Map<symbol | symbol[], ExecutionMap>()
  private readonly graph = new SetMap<RealmProjection>()
  private readonly pipeMap = new Map<symbol, symbol>()
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
  combine<T1, T2, T3, T4, T5, T6, T7>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18> ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18]> // prettier-ignore
  combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19> ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19]> // prettier-ignore
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
  combineCells<T1, T2, T3, T4, T5, T6, T7>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
    ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19>, ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19>, Out<T20>, ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20]> // prettier-ignore
  combineCells<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21>(
    ...nodes: [ Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19>, Out<T20>, Out<T21>, ] // prettier-ignore
  ): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21]> // prettier-ignore
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
  getValues<T1, T2, T3, T4, T5, T6, T7>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]
  ): [T1, T2, T3, T4, T5, T6, T7] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]
  ): [T1, T2, T3, T4, T5, T6, T7, T8] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]
  ): [T1, T2, T3, T4, T5, T6, T7, T8, T9] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]
  ): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]
  ): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]
  ): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12] // prettier-ignore
  getValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]
  ): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13] // prettier-ignore
  getValues<T>(nodes: Out<T>[]): unknown[]
  getValues(nodes: Out[]) {
    return nodes.map((node) => this.getValue(node))
  }
  inContext<T>(fn: () => T): T {
    const prevRealm = currentRealm$$
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    currentRealm$$ = this
    const result = fn()
    currentRealm$$ = prevRealm
    return result
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
  pipe<T, O1, O2, O3, O4, O5, O6, O7>(
    s: Out<T>,
    ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]
  ): NodeRef<O7> // prettier-ignore
  pipe<T, O1, O2, O3, O4, O5, O6, O7, O8>(
    s: Out<T>,
    ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>]
  ): NodeRef<O8> // prettier-ignore
  pipe<T, O1, O2, O3, O4, O5, O6, O7, O8, O9>(
    s: Out<T>,
    ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>, O<O8, O9>]
  ): NodeRef<O9> // prettier-ignore
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
    // if we have pipe nodes, we need to use their input symbols for publishing instead
    const ids = (Reflect.ownKeys(values) as symbol[]).map((id) => {
      return this.pipeMap.get(id) ?? id
    })

    const mappedValues = Reflect.ownKeys(values).reduce<Record<symbol, unknown>>((acc, key) => {
      const symbolKey = key as symbol
      const value = values[symbolKey]
      const pipeMappedKey: symbol = this.pipeMap.get(symbolKey) ?? symbolKey
      acc[pipeMappedKey] = value
      return acc
    }, {})

    const tracePayload = Reflect.ownKeys(mappedValues).map((key) => {
      return { [getNodeLabel(key as symbol)]: values[key as symbol] }
    })

    // eslint-disable-next-line no-console
    console.log(`Realm: publishing values`, tracePayload)

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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const nextId = participatingNodeKeys.shift()
      if (nextId === undefined) {
        break
      }
      const id = nextId
      // eslint-disable-next-line no-console
      console.log(`processing node ${getNodeLabel(id)}`)
      let resolved = false
      const done = (value: unknown) => {
        const dnRef = this.distinctNodes.get(id)
        if (dnRef?.(transientState.get(id), value)) {
          // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
          console.log(`Skipping ${getNodeLabel(id)}, value is already ${value}`)
          resolved = false
          return
        }
        resolved = true
        transientState.set(id, value)
        // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
        console.log(`Setting transient state ${getNodeLabel(id)} to ${value}`)
        if (this.state.has(id)) {
          // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
          console.log(`Persisting ${getNodeLabel(id)} as ${value}`)
          this.state.set(id, value)
        }
      }
      if (Object.hasOwn(mappedValues, id)) {
        // eslint-disable-next-line no-console
        console.log(`'${getNodeLabel(id)}' value found in direct payload`)
        done(mappedValues[id])
      } else {
        // eslint-disable-next-line no-console
        console.log(`'${getNodeLabel(id)}' has a projection`)
        map.projections.use(id, (nodeProjections) => {
          for (const projection of nodeProjections) {
            const args = [...Array.from(projection.sources), ...Array.from(projection.pulls)].map((id) => transientState.get(id))
            // eslint-disable-next-line no-console
            console.log(`Start projection for '${getNodeLabel(id)}' with [${args.join(',')}]`)
            projection.map(done)(...args)
          }
        })
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (resolved) {
        const value = transientState.get(id)
        // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
        console.log(`'${getNodeLabel(id)}' value resolved to ${value}`)
        this.inContext(() => {
          this.subscriptions.use(id, (nodeSubscriptions) => {
            for (const subscription of nodeSubscriptions) {
              // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
              console.log(`'${getNodeLabel(id)}' calling subscription: ${subscription.name} with ${value}`)
              subscription(value)
            }
          })
        })
        this.singletonSubscriptions.get(id)?.(value)
      } else {
        nodeWillNotEmit(id)
      }
    }
  }
  /**
   * Explicitly includes the specified cell/signal/pipe reference in the realm.
   * Most of the time you don't need to do that, since any interaction with the node through a realm will register it.
   * The only exception of that rule should be when the interaction is conditional, and the node definition includes an init function that needs to be eagerly evaluated.
   */
  register(node$: NodeRef | PipeRef) {
    const definition = nodeDefs$$.get(node$)
    // local node
    if (definition === undefined) {
      return node$
    }

    if (!this.definitionRegistry.has(node$)) {
      this.definitionRegistry.add(node$)
      if (definition.type === CELL_TYPE) {
        return tap(this.cellInstance(definition.initial, definition.distinct, node$), (node$) => {
          this.inContext(() => {
            definition.init(this, node$)
          })
        })
      }
      if (definition.type === SIGNAL_TYPE) {
        return tap(this.signalInstance(definition.distinct, node$), (node$) => {
          this.inContext(() => {
            definition.init(this, node$)
          })
        })
      }
      // PipeRef
      const input$ = this.signalInstance(definition.distinct)
      const output$ = this.cellInstance(definition.initial, true)
      const pipe$ = this.cellInstance(definition.initial, definition.distinct, node$)
      this.link(output$, pipe$)
      this.pipeMap.set(pipe$, input$)
      this.inContext(() => {
        definition.init(this, input$, output$)
      })
      return pipe$
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
  subMultiple<T1, T2, T3, T4, T5>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>],
    subscription: Subscription<[T1, T2, T3, T4, T5]>
  ): UnsubscribeHandle
  subMultiple<T1, T2, T3, T4, T5, T6>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>],
    subscription: Subscription<[T1, T2, T3, T4, T5, T6]>
  ): UnsubscribeHandle
  subMultiple<T1, T2, T3, T4, T5, T6, T7>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>],
    subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7]>
  ): UnsubscribeHandle
  subMultiple<T1, T2, T3, T4, T5, T6, T7, T8>(
    nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>],
    subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7, T8]>
  ): UnsubscribeHandle // prettier-ignore
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
  transformer<In, Out, O1, O2, O3, O4, O5>(
    ...o: [O<In, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, Out>]
  ): (s: Inp<Out>) => Inp<In> // prettier-ignore
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

/**
 * Defines a new **stateful node** and returns a reference to it.
 * Once a realm instance publishes or subscribes to the node, an instance of that node it will be registered in the realm.
 * @param value - the initial value of the node. Stateful nodes always have a value.
 * @param init - an optional function that will be called when the node is registered in a realm. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the realm automatically.
 * @param distinct - if true, the node will only emit values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const foo$ = Cell('foo',  (r) => {
 *   r.sub(foo$, console.log)
 * }, true)
 * const r = new Realm()
 * r.pub(foo$, 'bar') // the subscription will log 'bar'
 * ```
 * @remarks Unlike the RxJS `BehaviorSubject`, a stateful node does not immediately invoke its subscriptions when subscribed to. It only emits values when you publish something in it, either directly or through its relationships.
 * If you need to get the current value of a stateful node, use {@link Realm.getValue}.
 * @category Nodes
 */
export function Cell<T>(value: T, init: (r: Realm) => void = noop, distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, init, initial: value, type: CELL_TYPE })
  }) as NodeRef<T>
}

export function Pipe<I, O>(
  value: O,
  init: (r: Realm, input$: Out<I>, output$: Out<O>) => void,
  distinct: Distinct<I> = true
): PipeRef<I, O> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, init, initial: value, type: PIPE_TYPE })
  }) as PipeRef<I, O>
}

/**
 * Defines a new **stateful node**, links it to an existing node transform and returns a reference to it.
 * Once a realm instance publishes or subscribes to the node, an instance of that node it will be registered in the realm.
 * @param value - the initial value of the node. Stateful nodes always have a value.
 * @param linkFn - an function that will be called when the node is registered in a realm. Should return a node reference to link to.
 * @param distinct - if true, the node will only emit values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const bar$ = Cell('bar')
 * const foo$ = DerivedCell('foo',  (r, cell$) => {
 * r.sub(cell$, console.log)
 * return r.pipe(bar$, (bar) => `foo${bar}`)
 * }, true)
 * const r = new Realm()
 * r.pub(bar$, '-bar') // the subscription will log 'bar'
 * ```
 * @category Nodes
 */
export function DerivedCell<T>(value: T, linkFn: (r: Realm, cell: NodeRef<T>) => NodeRef<T>, distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, {
      distinct,
      init: (r, node$) => {
        r.link(linkFn(r, node$), node$)
      },
      initial: value,
      type: CELL_TYPE,
    })
  }) as NodeRef<T>
}

/**
 * Defines a new **stateless node** and returns a reference to it.
 * Once a realm instance publishes or subscribes to the node, an instance of that node it will be registered in the realm.
 * @param init - an optional function that will be called when the node is registered in a realm. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the realm automatically.
 * @param distinct - true by default. The node emits values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const foo$ = Signal<string>(true, (r) => {
 *   r.sub(foo$, console.log)
 * })
 * const r = new Realm()
 * r.pub(foo$, 'bar') // the subscription will log 'bar'
 * ```
 * @category Nodes
 */
export function Signal<T>(init: NodeInit<T> = noop, distinct: Distinct<T> = false): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, init, type: 'signal' })
  }) as NodeRef<T>
}

/**
 * Defines a new **stateless, valueless node** and returns a reference to it.
 * Once a realm instance publishes or subscribes to the node, an instance of that node it will be registered in the realm.
 * @param init - an optional function that will be called when the node is registered in a realm. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the realm automatically.
 * @example
 * ```ts
 * const foo$ = Action((r) => {
 *   r.sub(foo$, () => console.log('foo action'))
 * })
 * const r = new Realm()
 * r.pub(foo$)
 * ```
 * @category Nodes
 * @remark An action is just a signal with `void` value. It can be used to trigger side effects.
 */
export function Action(init: NodeInit<void> = noop): NodeRef<void> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct: false, init, type: 'signal' })
  }) as NodeRef<void>
}

export function labelNode(node: NodeRef, label: string) {
  nodeLabels$$.set(node, label)
}

function getCurrentRealm(): Realm {
  if (!currentRealm$$) {
    throw new Error('This function must be called within a realm instance')
  }
  return currentRealm$$
}

export const link: Realm['link'] = (source, sink) => {
  getCurrentRealm().link(source, sink)
}

// @ts-expect-error - this is fine
export const pub: Realm['pub'] = (...args) => {
  getCurrentRealm().pub(...args)
}

export const sub: Realm['sub'] = (...args) => {
  return getCurrentRealm().sub(...args)
}

export const pubIn: Realm['pubIn'] = (...args) => {
  getCurrentRealm().pubIn(...args)
}

export const pipe: Realm['pipe'] = (...args: unknown[]) => {
  // @ts-expect-error - this is fine
  return getCurrentRealm().pipe(...args)
}

export const changeWith: Realm['changeWith'] = (...args) => {
  getCurrentRealm().changeWith(...args)
}

// @ts-expect-error - this is fine
export const combine: Realm['combine'] = (...args: unknown[]) => {
  // @ts-expect-error - this is fine
  return getCurrentRealm().combine(...args)
}

export const getValue: Realm['getValue'] = (node) => {
  return getCurrentRealm().getValue(node)
}
