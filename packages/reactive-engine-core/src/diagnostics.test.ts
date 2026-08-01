import { describe, expect, it, vi } from 'vitest'

import { observeDiagnosticAllocationsForTests } from './diagnostics'
import { Cell, describeNode, Engine, Resource, Stream, Trigger } from './index'

import type { DiagnosticAllocationKind, DiagnosticNodeEvaluationEvent, DiagnosticValue, PropagationCycle } from './diagnostics'

function evaluations(cycle: Readonly<PropagationCycle>): DiagnosticNodeEvaluationEvent[] {
  return cycle.events.filter((event): event is DiagnosticNodeEvaluationEvent => event.type === 'evaluation')
}

describe('engine diagnostics', () => {
  it('allocates no diagnostic records while diagnostics and debug are inactive', () => {
    const source$ = Stream<number>()
    const target$ = Cell(0)
    const downstream$ = Cell(-1)
    const engine = new Engine()
    engine.link(source$, target$)
    engine.link(target$, downstream$)
    const allocations: DiagnosticAllocationKind[] = []
    const stopTracking = observeDiagnosticAllocationsForTests((kind) => allocations.push(kind))

    try {
      engine.pub(source$, 1)
      expect(allocations).toEqual([])

      const stopObserving = engine.observeDiagnostics(() => {})
      engine.pub(source$, 2)
      engine.pub(target$, 2)
      for (const kind of [
        'transaction',
        'cycle-ref',
        'cycle',
        'root',
        'node-identity',
        'evaluation-event',
        'projection-attempt',
        'candidate',
        'prune-event',
      ] as const) {
        expect(allocations).toContain(kind)
      }
      stopObserving()

      allocations.length = 0
      const child = new Engine({}, undefined, engine)
      child.observeDiagnostics(() => {})
      child.dispose()
      engine.pub(source$, 3)
      expect(allocations).toEqual([])
    } finally {
      stopTracking()
    }
  })

  it('records ordered attempts and distinct suppression without values by default', () => {
    const source$ = Stream<number>()
    const target$ = Cell(0)
    const engine = new Engine()
    engine.connect<[number]>({
      map: (done) => (value) => {
        done(value)
        done(value)
      },
      sink: target$,
      sources: [source$],
    })
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle))

    engine.pub(source$, 1)

    expect(records).toHaveLength(1)
    const cycle = records[0]!
    expect(cycle.origin).toBe('publication')
    expect(cycle.roots[0]!.node).toMatchObject({ kind: 'stream' })
    expect(cycle.roots[0]).not.toHaveProperty('value')
    expect(evaluations(cycle).map((event) => event.result)).toEqual(['emitted', 'not-emitted'])
    expect(evaluations(cycle)[1]!.attempts[0]!.candidates.map((candidate) => candidate.outcome)).toEqual([
      'accepted',
      'distinct-suppressed',
    ])
    expect(evaluations(cycle)[1]!.attempts[0]!.candidates[0]).not.toHaveProperty('next')
    expect(Object.isFrozen(cycle)).toBe(true)
    expect(Object.isFrozen(cycle.events)).toBe(true)
  })

  it('records pulled inputs, no-candidate filters, and downstream pruning', () => {
    const source$ = Stream<number>()
    const enabled$ = Cell(false)
    const filtered$ = Stream<number>()
    const downstream$ = Stream<number>()
    const engine = new Engine()
    engine.connect<[number, boolean]>({
      map: (done) => (value, enabled) => {
        if (enabled) {
          done(value)
        }
      },
      pulls: [enabled$],
      sink: filtered$,
      sources: [source$],
    })
    engine.link(filtered$, downstream$)
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle))

    engine.pub(source$, 1)

    const filteredEvent = evaluations(records[0]!)[1]!
    expect(filteredEvent.result).toBe('not-emitted')
    expect(filteredEvent.attempts[0]!.outcome).toBe('no-candidate')
    expect(filteredEvent.attempts[0]!.pulls).toHaveLength(1)
    const prune = records[0]!.events.find((event) => event.type === 'prune')
    expect(prune?.type).toBe('prune')
    if (prune?.type === 'prune') {
      expect(prune.causedBy).toEqual(filteredEvent.node)
      expect(prune.node).toMatchObject({ kind: 'stream' })
    }
  })

  it('records one diamond sink evaluation for a multi-root publication', () => {
    const a$ = Cell(0)
    const b$ = Cell(0)
    const left$ = Stream<number>()
    const right$ = Stream<number>()
    const sink$ = Stream<number>()
    const engine = new Engine()
    engine.link(a$, left$)
    engine.link(b$, right$)
    engine.connect<[number, number]>({
      map: (done) => (left, right) => {
        done(left + right)
      },
      sink: sink$,
      sources: [left$, right$],
    })
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle))

    engine.pubIn({ [a$]: 1, [b$]: 2 })

    expect(records[0]!.roots).toHaveLength(2)
    expect(evaluations(records[0]!)).toHaveLength(5)
    expect(evaluations(records[0]!).filter((event) => event.node.id === evaluations(records[0]!)[4]!.node.id)).toHaveLength(1)
  })

  it('captures bounded detached summaries and applies node summarizers before redaction', () => {
    const node$ = Cell({ secret: 'initial', visible: 0 })
    const input = { secret: 'private', visible: 1 }
    const summarize = vi.fn((value: typeof input) => ({ secret: value.secret, visible: value.visible }))
    const cleanup = describeNode(node$, { label: 'account', summarize })
    const engine = new Engine({}, 'primary')
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle), {
      captureValues: 'summary',
      redact: (value, context) => {
        if (context.node.label === 'account' && typeof value === 'object' && !Array.isArray(value) && value !== null) {
          return { ...(value as Record<string, unknown>), secret: '[redacted]' }
        }
        return value
      },
    })

    engine.pub(node$, input)

    input.secret = 'changed-after-publication'
    input.visible = 2

    expect(summarize).toHaveBeenCalledWith(input)
    expect(records[0]!.engineLabel).toBe('primary')
    expect(records[0]!.roots[0]!.node).toMatchObject({ kind: 'cell', label: 'account' })
    expect(records[0]!.roots[0]!.value).toEqual({ secret: '[redacted]', visible: 1 })
    expect(input).toEqual({ secret: 'changed-after-publication', visible: 2 })
    cleanup()
  })

  it('normalizes difficult values and converts callback failures to safe sentinels', () => {
    const raw$ = Cell<unknown>(null)
    const summarized$ = Cell<Record<string, unknown>>({})
    const redacted$ = Cell(0)
    const throwingProxy = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('blocked')
        },
      }
    )
    const circular: Record<string, unknown> = { list: Array.from({ length: 30 }, (_, index) => index), proxy: throwingProxy }
    circular.self = circular
    describeNode(summarized$, {
      summarize: (value) => {
        value.mutatedByConsumer = true
        throw new Error('summarizer')
      },
    })
    describeNode(redacted$, { label: 'redactor' })
    const engine = new Engine()
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle), {
      captureValues: 'summary',
      redact: (value, context) => {
        if (context.node.label === 'redactor') {
          throw new Error('redactor')
        }
        return value
      },
    })

    engine.pub(raw$, circular)
    engine.pub(summarized$, {})
    engine.pub(redacted$, 1)

    const rawValue = records[0]!.roots[0]!.value
    expect(JSON.stringify(records)).toBeTruthy()
    expect(rawValue).toMatchObject({ self: { $type: 'circular' } })
    expect((rawValue as { list: unknown[] }).list).toHaveLength(21)
    expect((rawValue as { proxy: unknown }).proxy).toEqual({ $type: 'uninspectable' })
    expect(records[1]!.roots[0]!.value).toEqual({ $type: 'summarizer-error' })
    expect(records[2]!.roots[0]!.value).toEqual({ $type: 'redactor-error' })
    expect(engine.getValue(summarized$)).toMatchObject({ mutatedByConsumer: true })
  })

  it('captures object and array accessors without invoking them', () => {
    const object$ = Cell<Record<string, unknown>>({})
    const array$ = Cell<unknown[]>([])
    let accessorCalls = 0
    const objectValue = Object.defineProperty({}, 'secret', {
      enumerable: true,
      get() {
        accessorCalls += 1
        return 'private'
      },
    })
    const arrayValue: unknown[] = []
    Object.defineProperty(arrayValue, '0', {
      enumerable: true,
      get() {
        accessorCalls += 1
        return 'private'
      },
    })
    arrayValue.length = 1
    const engine = new Engine()
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle), { captureValues: 'summary' })

    engine.pub(object$, objectValue)
    engine.pub(array$, arrayValue)

    expect(accessorCalls).toBe(0)
    expect(records[0]!.roots[0]!.value).toEqual({ secret: { $type: 'accessor' } })
    expect(records[1]!.roots[0]!.value).toEqual([{ $type: 'accessor' }])
  })

  it('preserves special object keys as frozen own properties', () => {
    const node$ = Cell<Record<string, unknown>>({})
    const input = JSON.parse(
      '{"__proto__":{"escaped":true},"constructor":{"kind":"constructor"},"prototype":{"kind":"prototype"}}'
    ) as Record<string, unknown>
    const engine = new Engine()
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle), { captureValues: 'summary' })

    engine.pub(node$, input)

    const snapshot = records[0]!.roots[0]!.value as Record<string, DiagnosticValue>
    expect(Object.getPrototypeOf(snapshot)).toBe(Object.prototype)
    expect(Object.keys(snapshot)).toEqual(['__proto__', 'constructor', 'prototype'])
    expect(Object.hasOwn(snapshot, '__proto__')).toBe(true)
    expect(Object.hasOwn(snapshot, 'constructor')).toBe(true)
    expect(Object.hasOwn(snapshot, 'prototype')).toBe(true)
    expect(JSON.stringify(snapshot)).toBe(
      '{"__proto__":{"escaped":true},"constructor":{"kind":"constructor"},"prototype":{"kind":"prototype"}}'
    )
    expect(Object.isFrozen(snapshot.__proto__)).toBe(true)
    expect(Object.isFrozen(snapshot.constructor)).toBe(true)
    expect(Object.isFrozen(snapshot.prototype)).toBe(true)
    expect(Object.isFrozen(input.__proto__)).toBe(false)
  })

  it('omits previous values before a stream has emitted', () => {
    const distinct$ = Stream<number>()
    const nonDistinct$ = Stream<number>(false)
    const distinctSummarizer = vi.fn((value: number) => value)
    const nonDistinctSummarizer = vi.fn((value: number) => value)
    const removeDistinctDescription = describeNode(distinct$, { summarize: distinctSummarizer })
    const removeNonDistinctDescription = describeNode(nonDistinct$, { summarize: nonDistinctSummarizer })
    const engine = new Engine()
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle), { captureValues: 'summary' })

    engine.pub(distinct$, 1)
    engine.pub(distinct$, 2)
    engine.pub(nonDistinct$, 1)
    engine.pub(nonDistinct$, 2)

    const distinctFirst = evaluations(records[0]!)[0]!
    const distinctSecond = evaluations(records[1]!)[0]!
    const nonDistinctFirst = evaluations(records[2]!)[0]!
    const nonDistinctSecond = evaluations(records[3]!)[0]!
    expect(distinctFirst).not.toHaveProperty('previous')
    expect(distinctFirst.attempts[0]!.candidates[0]).not.toHaveProperty('previous')
    expect(distinctSecond.previous).toBe(1)
    expect(distinctSecond.attempts[0]!.candidates[0]!.previous).toBe(1)
    expect(nonDistinctFirst).not.toHaveProperty('previous')
    expect(nonDistinctSecond).not.toHaveProperty('previous')
    expect(nonDistinctSummarizer.mock.calls.flat()).toEqual([1, 1, 1, 2, 2, 2])
    expect(distinctSummarizer.mock.calls.flat().every((value) => typeof value === 'number')).toBe(true)

    removeDistinctDescription()
    removeNonDistinctDescription()
  })

  it('omits Trigger and Resource values while representing an undefined Stream value', () => {
    const trigger$ = Trigger()
    const undefined$ = Stream<undefined>(false)
    const resource$ = Resource(() => ({ socket: 'live' }))
    const engine = new Engine()
    engine.getValue(resource$)
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle), { captureValues: 'summary' })

    engine.pubIn({ [resource$]: { socket: 'next' }, [trigger$]: undefined, [undefined$]: undefined })

    const rootsByKind = Object.fromEntries(records[0]!.roots.map((root) => [root.node.kind, root]))
    expect(rootsByKind.trigger).not.toHaveProperty('value')
    expect(rootsByKind.resource).not.toHaveProperty('value')
    expect(rootsByKind.stream!.value).toEqual({ $type: 'undefined' })
  })

  it('restores earlier metadata when later registrations are removed', () => {
    const node$ = Trigger()
    const first = describeNode(node$, { label: 'first' })
    const second = describeNode(node$, { label: 'second' })
    const engine = new Engine()
    const labels: (string | undefined)[] = []
    engine.observeDiagnostics((cycle) => labels.push(cycle.roots[0]?.node.label))

    engine.pub(node$)
    second()
    engine.pub(node$)
    first()
    engine.pub(node$)

    expect(labels).toEqual(['second', 'first', undefined])
  })

  it('reports projection, comparator, and subscriber failures without changing thrown errors', () => {
    const phases: string[] = []
    for (const scenario of ['projection', 'comparator', 'subscriber'] as const) {
      const source$ = Stream<number>()
      const target$ =
        scenario === 'comparator'
          ? Cell(0, () => {
              throw new Error('compare')
            })
          : Cell(0)
      const engine = new Engine()
      if (scenario === 'projection') {
        engine.connect<[number]>({
          map: () => () => {
            throw new Error('project')
          },
          sink: target$,
          sources: [source$],
        })
      }
      if (scenario === 'subscriber') {
        engine.sub(source$, () => {
          throw new Error('subscribe')
        })
      }
      const records: Readonly<PropagationCycle>[] = []
      engine.observeDiagnostics((cycle) => records.push(cycle), { captureValues: 'summary' })

      const publish = () => {
        if (scenario === 'comparator') {
          engine.pub(target$, 1)
        } else {
          engine.pub(source$, 1)
        }
      }
      expect(publish).toThrow()
      expect(records).toHaveLength(1)
      expect(records[0]!.status).toBe('aborted')
      phases.push(records[0]!.error!.phase)
      expect(records[0]!.error!.message).toBeTruthy()
    }
    expect(phases).toEqual(['projection', 'comparator', 'subscriber'])
  })

  it('redacts error text while preserving the original thrown value', () => {
    const source$ = Stream<number>()
    const target$ = Cell(0)
    const originalError = new Error('secret-token')
    const engine = new Engine()
    engine.connect<[number]>({
      map: () => () => {
        throw originalError
      },
      sink: target$,
      sources: [source$],
    })
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle), {
      captureValues: 'summary',
      redact: (value, context) => (context.field === 'error-message' ? '[redacted-error]' : value),
    })

    let caught: unknown
    try {
      engine.pub(source$, 1)
    } catch (error) {
      caught = error
    }

    expect(caught).toBe(originalError)
    expect(records[0]!.error).toMatchObject({ message: '[redacted-error]', name: 'Error', phase: 'projection' })
    expect(JSON.stringify(records[0])).not.toContain('secret-token')
  })

  it('creates independent observer records and supports idempotent unsubscribe', () => {
    const node$ = Cell({ secret: 'initial' })
    const engine = new Engine()
    const firstRecords: Readonly<PropagationCycle>[] = []
    const secondRecords: Readonly<PropagationCycle>[] = []
    const stopFirst = engine.observeDiagnostics((cycle) => firstRecords.push(cycle), {
      captureValues: 'summary',
      redact: () => 'first-policy',
    })
    engine.observeDiagnostics((cycle) => secondRecords.push(cycle), {
      captureValues: 'summary',
      redact: () => 'second-policy',
    })

    engine.pub(node$, { secret: 'private' })

    expect(firstRecords[0]).not.toBe(secondRecords[0])
    expect(firstRecords[0]!.roots[0]!.value).toBe('first-policy')
    expect(secondRecords[0]!.roots[0]!.value).toBe('second-policy')
    expect(Object.isFrozen(firstRecords[0])).toBe(true)
    expect(Object.isFrozen(secondRecords[0])).toBe(true)

    stopFirst()
    stopFirst()
    engine.pub(node$, { secret: 'next' })

    expect(firstRecords).toHaveLength(1)
    expect(secondRecords).toHaveLength(2)
  })

  it('isolates observer failures and reports them through onObserverError', () => {
    const node$ = Cell(0)
    const engine = new Engine()
    const observerError = new Error('observer')
    const onObserverError = vi.fn(() => {
      throw new Error('secondary')
    })
    const secondObserver = vi.fn()
    engine.observeDiagnostics(
      () => {
        throw observerError
      },
      { onObserverError }
    )
    engine.observeDiagnostics(secondObserver)

    expect(() => {
      engine.pub(node$, 1)
    }).not.toThrow()
    expect(onObserverError).toHaveBeenCalledWith(observerError)
    expect(secondObserver).toHaveBeenCalledTimes(1)
    expect(engine.getValue(node$)).toBe(1)
  })

  it('omits suppressed candidate details when requested', () => {
    const node$ = Cell(0)
    const engine = new Engine()
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle), { includeSuppressed: false })

    engine.pub(node$, 0)

    const event = evaluations(records[0]!)[0]!
    expect(event.result).toBe('not-emitted')
    expect(event.attempts[0]!.candidates).toEqual([])
  })

  it('shares a transaction and records parentCycle for reentrant application publications', () => {
    const outer$ = Stream<number>()
    const inner$ = Stream<number>()
    const engine = new Engine()
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle))
    engine.sub(outer$, () => {
      engine.pub(inner$, 2)
    })

    engine.pub(outer$, 1)

    expect(records).toHaveLength(2)
    expect(records[0]!.roots[0]!.node.id).toBe(records[0]!.events[0]!.type === 'evaluation' ? records[0]!.events[0]!.node.id : '')
    expect(records[0]!.transactionId).toBe(records[1]!.transactionId)
    expect(records[0]!.parentCycle).toEqual({
      cycleId: records[1]!.cycleId,
      engineInstanceId: records[1]!.engineInstanceId,
    })
    expect(records[1]!.parentCycle).toBeUndefined()
  })

  it('queues diagnostics caused by observers behind the current delivery batch', () => {
    const first$ = Stream<number>()
    const second$ = Stream<number>()
    const engine = new Engine()
    const seen: string[] = []
    engine.observeDiagnostics((cycle) => {
      const root = cycle.roots[0]!.node.id
      seen.push(`a:${root}`)
      if (seen.length === 1) {
        engine.pub(second$, 2)
        seen.push('a:return')
      }
    })
    engine.observeDiagnostics((cycle) => seen.push(`b:${cycle.roots[0]!.node.id}`))

    engine.pub(first$, 1)

    expect(seen).toEqual([
      expect.stringMatching(/^a:/),
      'a:return',
      expect.stringMatching(/^b:/),
      expect.stringMatching(/^a:/),
      expect.stringMatching(/^b:/),
    ])
  })

  it('starts a new transaction after a microtask boundary', async () => {
    const node$ = Stream<number>()
    const engine = new Engine()
    const records: Readonly<PropagationCycle>[] = []
    engine.observeDiagnostics((cycle) => records.push(cycle))

    engine.pub(node$, 1)
    await new Promise<void>((resolve) => {
      queueMicrotask(() => {
        engine.pub(node$, 2)
        resolve()
      })
    })

    expect(records).toHaveLength(2)
    expect(records[0]!.transactionId).not.toBe(records[1]!.transactionId)
    expect(records[1]!.parentCycle).toBeUndefined()
  })

  it('uses one transaction across parent forwarding while keeping cycles engine-scoped', () => {
    const parentNode$ = Cell(0)
    const childNode$ = Cell(0)
    const parent = new Engine({}, 'parent')
    parent.register(parentNode$)
    const child = new Engine({}, 'child', parent)
    child.register(childNode$)
    const records: Readonly<PropagationCycle>[] = []
    parent.observeDiagnostics((cycle) => records.push(cycle))
    child.observeDiagnostics((cycle) => records.push(cycle))

    child.pubIn({ [parentNode$]: 1, [childNode$]: 2 })

    expect(records).toHaveLength(3)
    expect(new Set(records.map((cycle) => cycle.transactionId)).size).toBe(1)
    expect(records.map((cycle) => cycle.origin)).toEqual(['forwarded-from-parent', 'forwarded-to-parent', 'publication'])
    expect(records.map((cycle) => cycle.engineLabel)).toEqual(['child', 'parent', 'child'])
    expect(records[0]!.engineInstanceId).not.toBe(records[1]!.engineInstanceId)
    expect(records[0]!.engineInstanceId).toBe(records[2]!.engineInstanceId)
  })

  it('preserves the application parent cycle when a child publication forwards to its parent', () => {
    const outer$ = Stream<number>()
    const inner$ = Stream<number>()
    const parent = new Engine({}, 'parent')
    parent.register(inner$)
    const child = new Engine({}, 'child', parent)
    const records: Readonly<PropagationCycle>[] = []
    parent.observeDiagnostics((cycle) => records.push(cycle))
    parent.sub(outer$, () => {
      child.pub(inner$, 2)
    })

    parent.pub(outer$, 1)

    const nested = records.find((cycle) => cycle.origin === 'forwarded-to-parent')!
    const outer = records.find((cycle) => cycle.origin === 'publication')!
    expect(nested.parentCycle).toEqual({ cycleId: outer.cycleId, engineInstanceId: outer.engineInstanceId })
  })

  it('records child propagation evidence on an aborted parent cycle', () => {
    const source$ = Stream<number>()
    const childTarget$ = Cell(0)
    const parent = new Engine({}, 'parent')
    parent.register(source$)
    const child = new Engine({}, 'child', parent)
    child.connect<[number]>({
      map: () => () => {
        throw new Error('child projection')
      },
      sink: childTarget$,
      sources: [source$],
    })
    const records: Readonly<PropagationCycle>[] = []
    parent.observeDiagnostics((cycle) => records.push(cycle))
    child.observeDiagnostics((cycle) => records.push(cycle))

    expect(() => {
      parent.pub(source$, 1)
    }).toThrow('child projection')

    const childCycle = records.find((cycle) => cycle.engineLabel === 'child')!
    const parentCycle = records.find((cycle) => cycle.engineLabel === 'parent')!
    expect(childCycle.error?.phase).toBe('projection')
    expect(parentCycle).toMatchObject({ status: 'aborted' })
    expect(parentCycle.error).toEqual({
      childCycle: { cycleId: childCycle.cycleId, engineInstanceId: childCycle.engineInstanceId },
      childEngineInstanceId: childCycle.engineInstanceId,
      phase: 'child-propagation',
    })
  })

  it('snapshots observer registration when a concrete cycle starts', () => {
    const node$ = Stream<number>()
    const engine = new Engine()
    const late = vi.fn()
    engine.sub(node$, () => engine.observeDiagnostics(late))

    engine.pub(node$, 1)
    engine.pub(node$, 2)

    expect(late).toHaveBeenCalledTimes(1)
  })

  it('keeps metadata inert without summary capture and removes observers on disposal', () => {
    const node$ = Cell({ value: 0 })
    const summarize = vi.fn((value: { value: number }) => value.value)
    describeNode(node$, { summarize })
    const engine = new Engine()
    const observer = vi.fn()
    engine.observeDiagnostics(observer)

    engine.pub(node$, { value: 1 })
    engine.dispose()
    engine.pub(node$, { value: 2 })

    expect(summarize).not.toHaveBeenCalled()
    expect(observer).toHaveBeenCalledTimes(1)
  })
})
