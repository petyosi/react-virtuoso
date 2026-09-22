import { expectTypeOf, test } from 'vitest'

import { Cell, createDiagnosticCollector, createDiagnosticNamespace } from '..'

import type { DiagnosticObserver, NodeRef, PropagationCycle } from '..'

test('preserves namespace node values and types collector callbacks', () => {
  const value$ = Cell(0)
  const namespace = createDiagnosticNamespace('feature.run')
  const described = namespace.describe(value$, 'value')
  expectTypeOf(described).toEqualTypeOf<NodeRef<number>>()

  const collector = createDiagnosticCollector({
    filter: (record) => {
      expectTypeOf(record).toEqualTypeOf<PropagationCycle>()
      return true
    },
    retain: 2,
  })
  expectTypeOf(collector.observer).toEqualTypeOf<DiagnosticObserver>()
  expectTypeOf(collector.getCycles()).toEqualTypeOf<readonly PropagationCycle[]>()

  const cycles = collector.getCycles()
  // @ts-expect-error Collector snapshots are readonly through the public contract.
  const mutableCycles: PropagationCycle[] = cycles
  expectTypeOf(mutableCycles).toEqualTypeOf<PropagationCycle[]>()
})
