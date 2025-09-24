import type { NodeInit, NodeRef } from './types'

import { getCurrentEngine, nodeInits$$, nodeLabels$$ } from './globals'

/**
 * @category Logging
 */
export function getNodeLabel(node: symbol): string {
  return nodeLabels$$.get(node) ?? '<anonymous>'
}

/**
 * @category Logging
 */
export function setNodeLabel(node: NodeRef, label: string) {
  nodeLabels$$.set(node, label)
}

/**
 * @category Node Utilities
 */
export function addNodeInit(node: NodeRef, init: NodeInit<unknown>) {
  nodeInits$$.getOrCreate(node).add(init)
}

/**
 * Gets the current value of a node. The node must be stateful. The function works only in subscription callbacks.
 *
 * @param node - the node reference.
 * @typeParam T - The type of values that the node emits.
 *
 * @category Node Utilities
 * @remarks if possible, use {@link withLatestFrom} or {@link combine}, as getValue will not create a dependency to the passed node,
 * so if you call it within a computational cycle, you may not get the correct value.
 */
export function getValue<T>(node: NodeRef<T>): T {
  const engine = getCurrentEngine()
  if (!engine) {
    throw new Error('No active engine found. You can use getValue only in the context of node subscription callbacks.')
  }
  return engine.getValue(node)
}
