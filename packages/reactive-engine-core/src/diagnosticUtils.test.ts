import { describe, expect, it, vi } from 'vitest'

import { createDiagnosticCollector, createDiagnosticNamespace } from './diagnosticUtils'
import { Engine } from './Engine'
import { Cell } from './nodes'

import type { DiagnosticNodeIdentity, DiagnosticProjectionAttempt, PropagationCycle } from './diagnostics'

function node(label?: string): DiagnosticNodeIdentity {
  return label === undefined ? { id: 'node', kind: 'cell' } : { id: label, kind: 'cell', label }
}

function cycle(cycleId: number, overrides: Partial<PropagationCycle> = {}): PropagationCycle {
  return {
    cycleId,
    durationMs: 0,
    engineInstanceId: 'engine-1',
    events: [],
    origin: 'publication',
    roots: [],
    startedAt: cycleId,
    status: 'completed',
    transactionId: `transaction-${cycleId}`,
    ...overrides,
  }
}

function attempt(overrides: Partial<DiagnosticProjectionAttempt>): DiagnosticProjectionAttempt {
  return {
    candidates: [],
    outcome: 'completed',
    pulls: [],
    source: 'projection',
    sources: [],
    ...overrides,
  }
}

function evaluation(attempts: DiagnosticProjectionAttempt[] = [], evaluationNode = node('other')): PropagationCycle['events'][number] {
  return { attempts, node: evaluationNode, result: 'not-emitted', type: 'evaluation' }
}

describe('createDiagnosticNamespace', () => {
  it('normalizes segments, describes the same node, and records the namespaced label', () => {
    const namespace = createDiagnosticNamespace(' feature . run ')
    const value$ = Cell(0)
    expect(namespace.describe(value$, ' result . value ')).toBe(value$)

    const records: PropagationCycle[] = []
    const engine = new Engine()
    engine.observeDiagnostics((record) => records.push(record))
    engine.pub(value$, 1)

    expect(records[0]?.roots[0]?.node.label).toBe('feature.run.result.value')
    expect(namespace.matches(records[0]!)).toBe(true)
  })

  it.each(['', ' ', '.run', 'run.', 'run..result', 'run. .result'])('rejects an invalid namespace path %j', (value) => {
    expect(() => createDiagnosticNamespace(value)).toThrow('non-empty dot-separated segments')
  })

  it.each(['', ' ', '.result', 'result.', 'result..value', 'result. .value'])('rejects an invalid child path %j', (value) => {
    const namespace = createDiagnosticNamespace('feature')
    expect(() => namespace.describe(Cell(0), value)).toThrow('non-empty dot-separated segments')
  })

  it('matches exact and descendant labels but not sibling prefixes or missing labels', () => {
    const namespace = createDiagnosticNamespace('feature.run')
    expect(namespace.matches(cycle(1, { roots: [{ node: node('feature.run') }] }))).toBe(true)
    expect(namespace.matches(cycle(1, { roots: [{ node: node('feature.run.result') }] }))).toBe(true)
    expect(namespace.matches(cycle(1, { roots: [{ node: node('feature.runner') }] }))).toBe(false)
    expect(namespace.matches(cycle(1, { roots: [{ node: node() }] }))).toBe(false)
  })

  it.each([
    ['root', cycle(1, { roots: [{ node: node('feature.run.target') }] })],
    ['evaluation', cycle(1, { events: [evaluation([], node('feature.run.target'))] })],
    ['projection source', cycle(1, { events: [evaluation([attempt({ sources: [node('feature.run.target')] })])] })],
    ['projection pull', cycle(1, { events: [evaluation([attempt({ pulls: [node('feature.run.target')] })])] })],
    [
      'candidate error',
      cycle(1, {
        events: [
          evaluation([
            attempt({
              candidates: [{ error: { node: node('feature.run.target'), phase: 'comparator' }, outcome: 'comparator-error' }],
            }),
          ]),
        ],
      }),
    ],
    ['attempt error', cycle(1, { events: [evaluation([attempt({ error: { node: node('feature.run.target'), phase: 'projection' } })])] })],
    ['pruned node', cycle(1, { events: [{ causedBy: node('other'), node: node('feature.run.target'), type: 'prune' }] })],
    ['prune cause', cycle(1, { events: [{ causedBy: node('feature.run.target'), node: node('other'), type: 'prune' }] })],
    ['cycle error', cycle(1, { error: { node: node('feature.run.target'), phase: 'subscriber' }, status: 'aborted' })],
  ])('matches a namespaced node in the %s location', (_location, record) => {
    expect(createDiagnosticNamespace('feature.run').matches(record)).toBe(true)
  })
})

describe('createDiagnosticCollector', () => {
  it('retains an exact chronological bound after wraparound', () => {
    const collector = createDiagnosticCollector({ retain: 3 })
    for (let cycleId = 1; cycleId <= 5; cycleId++) {
      collector.observer(cycle(cycleId))
    }
    expect(collector.getCycles().map((record) => record.cycleId)).toEqual([3, 4, 5])
  })

  it('returns independent arrays with the original cycle references and clears without replacing its observer', () => {
    const collector = createDiagnosticCollector({ retain: 2 })
    const firstCycle = cycle(1)
    const observer = collector.observer
    collector.observer(firstCycle)

    const snapshot = collector.getCycles() as PropagationCycle[]
    expect(snapshot[0]).toBe(firstCycle)
    snapshot.pop()
    expect(collector.getCycles()).toEqual([firstCycle])

    collector.clear()
    expect(collector.getCycles()).toEqual([])
    expect(collector.observer).toBe(observer)
    collector.observer(cycle(2))
    expect(collector.getCycles().map((record) => record.cycleId)).toEqual([2])
  })

  it('filters before mutation and propagates the original predicate error', () => {
    const filterError = new Error('filter')
    let shouldThrow = false
    const collector = createDiagnosticCollector({
      filter: (record) => {
        if (shouldThrow) {
          throw filterError
        }
        return record.cycleId % 2 === 0
      },
      retain: 2,
    })
    collector.observer(cycle(1))
    collector.observer(cycle(2))
    shouldThrow = true

    let caught: unknown
    try {
      collector.observer(cycle(4))
    } catch (error) {
      caught = error
    }
    expect(caught).toBe(filterError)
    expect(collector.getCycles().map((record) => record.cycleId)).toEqual([2])
  })

  it('keeps independent history for collectors observing the same cycles', () => {
    const even = createDiagnosticCollector({ filter: (record) => record.cycleId % 2 === 0, retain: 2 })
    const all = createDiagnosticCollector({ retain: 3 })
    for (let cycleId = 1; cycleId <= 3; cycleId++) {
      const record = cycle(cycleId)
      even.observer(record)
      all.observer(record)
    }
    expect(even.getCycles().map((record) => record.cycleId)).toEqual([2])
    expect(all.getCycles().map((record) => record.cycleId)).toEqual([1, 2, 3])
  })

  it('captures capacity and filter at creation', () => {
    const options = { filter: () => true, retain: 2 }
    const collector = createDiagnosticCollector(options)
    options.retain = 1
    options.filter = () => false
    collector.observer(cycle(1))
    collector.observer(cycle(2))
    collector.observer(cycle(3))
    expect(collector.getCycles().map((record) => record.cycleId)).toEqual([2, 3])
  })

  it('leaves observer error isolation to Engine', () => {
    const filterError = new Error('filter')
    const collector = createDiagnosticCollector({
      filter: () => {
        throw filterError
      },
      retain: 1,
    })
    const observerError = vi.fn()
    const value$ = Cell(0)
    const engine = new Engine()
    engine.observeDiagnostics(collector.observer, { onObserverError: observerError })

    expect(() => {
      engine.pub(value$, 1)
    }).not.toThrow()
    expect(observerError).toHaveBeenCalledWith(filterError)
    expect(collector.getCycles()).toEqual([])
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid retention %s', (retain) => {
    expect(() => createDiagnosticCollector({ retain })).toThrow('positive finite integer')
  })
})
