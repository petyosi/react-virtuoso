import type { NodeInit, NodeRef } from './types'

import { getCurrentEngine, nodeDebugLabels$$, nodeInits$$, nodeInitSubscriptions$$ } from './globals'

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

/**
 * Extracts the caller location from an Error stack trace.
 * Parses file:line from various browser stack formats (V8, Firefox, Safari).
 * This is a best-effort implementation.
 *
 * @param stack - The stack trace string
 * @returns File:line string (e.g., "App.tsx:42") or null if parsing fails
 */
function extractCallerLocation(stack: string): null | string {
  const lines = stack.split('\n')

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]

    if (!line) {
      continue
    }

    // Skip our own debug function and nodeUtils
    if (line.includes('debug') || line.includes('nodeUtils')) {
      continue
    }

    // Try to extract file:line from various formats
    // V8:      "    at file.ts:42:3" or "    at Object.<anonymous> (file.ts:42:3)"
    // Firefox: "@file.ts:42:3" or "functionName@file.ts:42:3"
    // Safari:  "file.ts:42:3"

    // Match patterns like: file.ts:42 or file.tsx:42
    const match = /([^/\\s()]+\.tsx?):(\\d+):\\d+/.exec(line)
    if (match) {
      return `${match[1]}:${match[2]}`
    }
  }

  return null
}

/**
 * Marks a node for debug logging. When the node emits in development mode,
 * its value will be logged to console.
 *
 * @param node$ - The node to debug
 * @param label - Optional custom label. If not provided, attempts to extract
 *                file:line from stack trace (best effort). Falls back to '<anonymous>'.
 * @returns Cleanup function to stop logging
 *
 * @example
 * ```ts
 * // Automatic labeling from call site
 * const count$ = Cell(0)
 * const stop = debug(count$)  // Auto-labeled as "App.tsx:42"
 *
 * // Manual label
 * const user$ = Stream<User>()
 * debug(user$, 'User Stream')
 *
 * // Later: stop() to disable logging
 * stop()
 * ```
 *
 * @category Logging
 */
export function debug<T>(node$: NodeRef<T>, label?: string): () => void {
  let nodeLabel = label

  // Try to extract location from stack trace if no label provided
  if (!nodeLabel) {
    try {
      const stack = new Error().stack
      if (stack) {
        nodeLabel = extractCallerLocation(stack) ?? undefined
      }
    } catch {
      // Stack capture failed, use fallback
    }
  }

  // Final fallback
  nodeLabel = nodeLabel ?? '<anonymous>'

  nodeDebugLabels$$.set(node$, nodeLabel)

  return () => {
    nodeDebugLabels$$.delete(node$)
  }
}
