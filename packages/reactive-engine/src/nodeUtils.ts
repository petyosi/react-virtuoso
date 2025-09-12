import type { NodeInit, NodeRef } from './types'

import { getCurrentEngine, nodeInits$$, nodeLabels$$ } from './globals'

export function getNodeLabel(node: symbol): string {
  return nodeLabels$$.get(node) ?? '<anonymous>'
}

export function setNodeLabel(node: NodeRef, label: string) {
  nodeLabels$$.set(node, label)
}

export function addNodeInit<T>(node: NodeRef<T>, init: NodeInit<T>) {
  nodeInits$$.getOrCreate(node).add(init as NodeInit<unknown>)
}

/**
 * Gets the current value of a node. The node must be stateful. The function works only in subscription callbacks.
 *
 * @remark if possible, use {@link withLatestFrom} or {@link combine}, as getValue will not create a dependency to the passed node,
 * so if you call it within a computational cycle, you may not get the correct value.
 * @param node - the node reference.
 */
export function getValue<T>(node: NodeRef<T>): T {
  const engine = getCurrentEngine()
  if (!engine) {
    throw new Error('No active engine found. You can use getValue only in the context of node subscription callbacks.')
  }
  return engine.getValue(node)
}
