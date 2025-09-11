import { Engine } from './engine'
import { CELL_TYPE, SIGNAL_TYPE } from './globals'
import { RefCount } from './RefCount'
import { SetMap } from './SetMap'

/**
 * A typed reference to a node.
 * @typeParam T - The type of values that the node emits.
 * @category Nodes
 */
export type NodeRef<T = unknown> = symbol & { valType: T }

export type Inp<T = unknown> = NodeRef<T>
export type Out<T = unknown> = NodeRef<T>

/**
 * A function that is called when a node emits a value.
 * @typeParam T - The type of values that the node emits.
 */
export type Subscription<T> = (value: T, realm: Engine) => unknown

/**
 * The resulting type of a subscription to a node. Can be used to cancel the subscription.
 */
export type UnsubscribeHandle = () => void

export type ProjectionFunc<T extends unknown[] = unknown[]> = (done: (...values: unknown[]) => void) => (...args: T) => void

export interface NodeProjection<T extends unknown[] = unknown[]> {
  map: ProjectionFunc<T>
  pulls: Set<symbol>
  sink: symbol
  sources: Set<symbol>
}

export interface ExecutionMap {
  participatingNodes: symbol[]
  pendingPulls: SetMap<symbol>
  projections: SetMap<NodeProjection>
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
export type NodeInit<T> = (r: Engine, node$: NodeRef<T>) => void

export interface CellDefinition<T> {
  distinct: Distinct<T>
  init: NodeInit<T>
  initial: T
  type: typeof CELL_TYPE
}

export interface SignalDefinition<T> {
  distinct: Distinct<T>
  init: NodeInit<T>
  type: typeof SIGNAL_TYPE
}
