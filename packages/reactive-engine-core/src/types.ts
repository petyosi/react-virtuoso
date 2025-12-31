import type { Engine } from './Engine'
import type { CELL_TYPE, STREAM_TYPE } from './globals'
import type { RefCount } from './RefCount'
import type { SetMap } from './SetMap'

/**
 * A typed reference to a node ({@link Cell}, {@link Stream}, or {@link Trigger}).
 * @typeParam T - The type of values that the node emits.
 * @category Nodes
 */
export type NodeRef<T = unknown> = symbol & { valType: T }

/** An alias for the NodeRef, signifying that the ref will be used only for publishing.
 * @category Misc
 */
export type Inp<T = unknown> = NodeRef<T>

/** An alias for the NodeRef, signifying that the ref will be used only for subscriptions.
 * @category Misc
 */
export type Out<T = unknown> = NodeRef<T>

/**
 * A function that is called when a node emits a value.
 * @typeParam T - The type of values that the node emits.
 * @category Misc
 */
export type Subscription<T> = (value: T, engine: Engine) => unknown

/**
 * The resulting type of a subscription to a node. Can be used to cancel the subscription.
 * @category Misc
 */
export type UnsubscribeHandle = () => void

/** @hidden */
export type ProjectionFunc<T extends unknown[] = unknown[]> = (done: (...values: unknown[]) => void) => (...args: T) => void

/** @hidden */
export interface NodeProjection<T extends unknown[] = unknown[]> {
  map: ProjectionFunc<T>
  pulls: Set<symbol>
  sink: symbol
  sources: Set<symbol>
}

/** @hidden */
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
 * @category Misc
 */
export type Comparator<T> = (previous: T | undefined, current: T) => boolean | null | undefined

/**
 * A type for the distinct parameter to the {@link Cell} and {@link Stream} constructors.
 * @typeParam T - The type of values that the node emits.
 * @category Misc
 */
export type Distinct<T> = boolean | Comparator<T>

/**
 * A node initializer function.
 * @param eng - The engine instance that is registering the node.
 * @param node$ - The node reference that is being initialized.
 * @typeParam T - The type of values that the node emits/accepts.
 * @category Misc
 */
export type NodeInit<T> = (eng: Engine, node$: NodeRef<T>) => void

/** @hidden */
export interface CellDefinition<T> {
  distinct: Distinct<T>
  initial: T
  type: typeof CELL_TYPE
}

/** @hidden */
export interface StreamDefinition<T> {
  distinct: Distinct<T>
  type: typeof STREAM_TYPE
}

/** @hidden */
export interface CombinedCellRecord {
  cell: NodeRef
  sources: symbol[]
}
