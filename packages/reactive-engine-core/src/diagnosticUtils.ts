import invariant from 'tiny-invariant'

import { describeNode } from './diagnostics'

import type { DiagnosticNodeIdentity, DiagnosticObserver, PropagationCycle } from './diagnostics'
import type { NodeRef } from './types'

export interface DiagnosticNamespace {
  describe<T>(node$: NodeRef<T>, name: string): NodeRef<T>
  matches(cycle: PropagationCycle): boolean
}

export interface DiagnosticCollectorOptions {
  filter?: (cycle: PropagationCycle) => boolean
  retain: number
}

export interface DiagnosticCollector {
  clear(): void
  getCycles(): readonly PropagationCycle[]
  readonly observer: DiagnosticObserver
}

function normalizeDiagnosticPath(value: string, subject: string): string {
  const segments = value.split('.').map((segment) => segment.trim())
  invariant(
    segments.every((segment) => segment.length > 0),
    `${subject} must contain non-empty dot-separated segments`
  )
  return segments.join('.')
}

function assertNever(value: never): never {
  throw new Error(`Unknown diagnostic cycle event: ${String(value)}`)
}

export function createDiagnosticNamespace(namespace: string): DiagnosticNamespace {
  const normalizedNamespace = normalizeDiagnosticPath(namespace, 'Diagnostic namespace')
  const labelMatches = (label: string | undefined) => label === normalizedNamespace || label?.startsWith(`${normalizedNamespace}.`) === true
  const nodeMatches = (node: DiagnosticNodeIdentity | undefined) => labelMatches(node?.label)

  return {
    describe<T>(node$: NodeRef<T>, name: string): NodeRef<T> {
      const normalizedName = normalizeDiagnosticPath(name, 'Diagnostic name')
      describeNode(node$, { label: `${normalizedNamespace}.${normalizedName}` })
      return node$
    },
    matches(cycle) {
      if (cycle.roots.some((root) => nodeMatches(root.node)) || nodeMatches(cycle.error?.node)) {
        return true
      }

      return cycle.events.some((event) => {
        switch (event.type) {
          case 'evaluation':
            return (
              nodeMatches(event.node) ||
              event.attempts.some(
                (attempt) =>
                  nodeMatches(attempt.error?.node) ||
                  attempt.sources.some(nodeMatches) ||
                  attempt.pulls.some(nodeMatches) ||
                  attempt.candidates.some((candidate) => nodeMatches(candidate.error?.node))
              )
            )
          case 'prune':
            return nodeMatches(event.node) || nodeMatches(event.causedBy)
          default:
            return assertNever(event)
        }
      })
    },
  }
}

export function createDiagnosticCollector(options: DiagnosticCollectorOptions): DiagnosticCollector {
  const { filter, retain } = options
  invariant(
    Number.isFinite(retain) && Number.isInteger(retain) && retain > 0,
    'Diagnostic collector retain must be a positive finite integer'
  )

  const buffer = Array.from<PropagationCycle | undefined>({ length: retain })
  let size = 0
  let start = 0

  const observer: DiagnosticObserver = (cycle) => {
    if (filter?.(cycle) === false) {
      return
    }

    if (size < retain) {
      buffer[(start + size) % retain] = cycle
      size += 1
    } else {
      buffer[start] = cycle
      start = (start + 1) % retain
    }
  }

  return {
    clear() {
      buffer.fill(undefined)
      size = 0
      start = 0
    },
    getCycles() {
      return Array.from({ length: size }, (_, index) => buffer[(start + index) % retain]!)
    },
    observer,
  }
}
