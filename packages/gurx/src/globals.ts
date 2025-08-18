import { SetMap } from './SetMap'
import { CellDefinition, NodeInit, NodeRef, SignalDefinition } from './types'

export const CELL_TYPE = 'cell'

export const SIGNAL_TYPE = 'signal'

/**
 * The default comparator for distinct nodes - a function to determine if two values are equal. Works for primitive values.
 * @category Nodes
 */
export function defaultComparator<T>(current: T, next: T) {
  return current === next
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeDefs$$ = new Map<symbol, CellDefinition<any> | SignalDefinition<any>>()
export const nodeLabels$$ = new Map<symbol, string>()
export const nodeInits$$ = new SetMap<NodeInit<unknown>>()

export const getNodeLabel = (node: symbol): string => {
  return nodeLabels$$.get(node) ?? '<anonymous>'
}

export function labelNode(node: NodeRef, label: string) {
  nodeLabels$$.set(node, label)
}

export function addNodeInit<T>(node: NodeRef<T>, init: NodeInit<T>) {
  nodeInits$$.getOrCreate(node).add(init as NodeInit<unknown>)
}
