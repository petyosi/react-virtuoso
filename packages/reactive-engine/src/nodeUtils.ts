import type { NodeInit, NodeRef } from './types'

import { getCurrentEngine, nodeInits$$, nodeInitSubscriptions$$, nodeLabels$$ } from './globals'

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
 * Registers an initialization function to be called when any of the specified nodes are initialized in an engine.
 * The init function will be called at most once per engine, even if multiple nodes are initialized.
 *
 * @param init - The initialization function to call when any of the nodes are initialized.
 * @param nodes$ - One or more node references to watch for initialization.
 *
 * @category Node Utilities
 */
export function addNodeInit(init: NodeInit<unknown>, ...nodes$: NodeRef[]) {
  for (const node$ of nodes$) {
    nodeInits$$.getOrCreate(node$).add(init)
  }
  for (const subscription of nodeInitSubscriptions$$) {
    subscription(nodes$, init)
  }
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

export function pub<T>(node: NodeRef<T>, value: T) {
  const engine = getCurrentEngine()
  if (!engine) {
    throw new Error('No active engine found. You can use pub only in the context of node subscription callbacks.')
  }
  engine.pub(node, value)
}

/**
 * Publishes values to multiple nodes simultaneously in a single computation cycle.
 * Each key must be a NodeRef and each value must match the corresponding node's type.
 *
 * @param values - A record mapping NodeRefs to their values
 *
 * @category Node Utilities
 */
export function pubIn(values: Record<symbol, unknown>) {
  const engine = getCurrentEngine()
  if (!engine) {
    throw new Error('No active engine found. You can use pub only in the context of node subscription callbacks.')
  }
  engine.pubIn(values)
}
