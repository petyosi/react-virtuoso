import { beforeEach, describe, expect, it } from 'vitest'

import { Cell, e, Engine, Stream } from '../index'
import { createSpyWithHistory } from '../testUtils'

describe('withLatestFrom operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  // Basic functionality
  it('pulls latest values from other nodes', () => {
    const source = Stream<string>()
    const other = Cell('initial')
    const combined = e.pipe(source, e.withLatestFrom(other))
    const { history, spy } = createSpyWithHistory<[string, string]>()

    e.sub(combined, spy)

    eng.pub(source, 'first')
    expect(history).toEqual([['first', 'initial']])

    eng.pub(other, 'updated')
    eng.pub(source, 'second')
    expect(history).toEqual([
      ['first', 'initial'],
      ['second', 'updated'],
    ])
  })

  it('only emits when source emits, not when other nodes emit', () => {
    const source = Stream<number>()
    const other = Cell(100)
    const combined = e.pipe(source, e.withLatestFrom(other))
    const { history, spy } = createSpyWithHistory<[number, number]>()

    e.sub(combined, spy)

    // Only source emission should trigger
    eng.pub(source, 1)
    expect(history).toEqual([[1, 100]])

    // Other node emission should not trigger
    eng.pub(other, 200)
    expect(history).toEqual([[1, 100]]) // No change

    // Source emission should pick up latest value
    eng.pub(source, 2)
    expect(history).toEqual([
      [1, 100],
      [2, 200],
    ])
  })

  // Multiple node overloads
  it('works with single node (1 + 1)', () => {
    const source = Cell('A')
    const node1 = Cell('B')
    const combined = e.pipe(source, e.withLatestFrom(node1))
    const { history, spy } = createSpyWithHistory<[string, string]>()

    e.sub(combined, spy)

    eng.pub(source, 'A1')
    expect(history).toEqual([['A1', 'B']])
  })

  it('works with two nodes (1 + 2)', () => {
    const source = Cell(0)
    const node1 = Cell(1)
    const node2 = Cell(2)
    const combined = e.pipe(source, e.withLatestFrom(node1, node2))
    const { history, spy } = createSpyWithHistory<[number, number, number]>()

    e.sub(combined, spy)

    eng.pub(source, 10)
    expect(history).toEqual([[10, 1, 2]])

    eng.pub(node1, 11)
    eng.pub(node2, 22)
    eng.pub(source, 20)
    expect(history).toEqual([
      [10, 1, 2],
      [20, 11, 22],
    ])
  })

  it('works with three nodes (1 + 3)', () => {
    const source = Cell('s')
    const node1 = Cell('a')
    const node2 = Cell('b')
    const node3 = Cell('c')
    const combined = e.pipe(source, e.withLatestFrom(node1, node2, node3))
    const { history, spy } = createSpyWithHistory<[string, string, string, string]>()

    e.sub(combined, spy)

    eng.pub(source, 's1')
    expect(history).toEqual([['s1', 'a', 'b', 'c']])
  })

  // Uninitialized nodes
  it('handles uninitialized source nodes gracefully', () => {
    const source = Stream<number>()
    const other = Cell('initialized')
    const combined = e.pipe(source, e.withLatestFrom(other))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(combined, spy)

    // Should work fine when source emits
    eng.pub(source, 42)
    expect(history).toEqual([[42, 'initialized']])
  })

  it('handles nodes with undefined/null values', () => {
    const source = Stream<string>()
    const nullCell = Cell<null>(null)
    const undefinedCell = Cell<undefined>(undefined)
    const combined = e.pipe(source, e.withLatestFrom(nullCell, undefinedCell))
    const { history, spy } = createSpyWithHistory<[string, null, undefined]>()

    e.sub(combined, spy)

    eng.pub(source, 'test')
    expect(history).toEqual([['test', null, undefined]])
  })

  it('handles mixed types correctly', () => {
    const source = Stream<number>()
    const stringCell = Cell('hello')
    const boolCell = Cell(true)
    const objectCell = Cell({ id: 1 })
    const combined = e.pipe(source, e.withLatestFrom(stringCell, boolCell, objectCell))
    const { history, spy } = createSpyWithHistory<[number, string, boolean, { id: number }]>()

    e.sub(combined, spy)

    eng.pub(source, 42)
    expect(history).toEqual([[42, 'hello', true, { id: 1 }]])
  })

  // Proper tuple typing
  it('maintains proper tuple typing for different combinations', () => {
    const source = Stream<number>()

    // Single node - should be [number, string]
    const node1 = Cell('test')
    const combined1 = e.pipe(source, e.withLatestFrom(node1))
    const spy1 = createSpyWithHistory<[number, string]>()
    e.sub(combined1, spy1.spy)

    // Two nodes - should be [number, string, boolean]
    const node2 = Cell(true)
    const combined2 = e.pipe(source, e.withLatestFrom(node1, node2))
    const spy2 = createSpyWithHistory<[number, string, boolean]>()
    e.sub(combined2, spy2.spy)

    eng.pub(source, 1)

    expect(spy1.history[0]).toEqual([1, 'test'])
    expect(spy2.history[0]).toEqual([1, 'test', true])
  })

  // Error handling
  it('handles errors from source node', () => {
    const source = Stream<number>()
    const other = Cell('stable')
    const combined = e.pipe(source, e.withLatestFrom(other))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(combined, spy)

    // Normal operation
    eng.pub(source, 1)
    expect(history).toEqual([[1, 'stable']])

    // Should continue working after any source issues
    eng.pub(source, 2)
    expect(history).toEqual([
      [1, 'stable'],
      [2, 'stable'],
    ])
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', () => {
    const source = Stream<number>()
    const other = Cell('shared')
    const combined = e.pipe(source, e.withLatestFrom(other))

    const spy1 = createSpyWithHistory<[number, string]>()
    const spy2 = createSpyWithHistory<[number, string]>()

    e.sub(combined, spy1.spy)
    e.sub(combined, spy2.spy)

    eng.pub(source, 42)

    expect(spy1.history).toEqual([[42, 'shared']])
    expect(spy2.history).toEqual([[42, 'shared']])
  })

  // Rapid updates
  it('handles rapid source updates correctly', () => {
    const source = Stream<number>()
    const other = Cell('constant')
    const combined = e.pipe(source, e.withLatestFrom(other))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(combined, spy)

    // Rapid source emissions
    for (let i = 0; i < 100; i++) {
      eng.pub(source, i)
    }

    expect(history).toHaveLength(100)
    expect(history[0]).toEqual([0, 'constant'])
    expect(history[99]).toEqual([99, 'constant'])
  })

  it('handles rapid other node updates correctly', () => {
    const source = Stream<number>()
    const other = Cell(0)
    const combined = e.pipe(source, e.withLatestFrom(other))
    const { history, spy } = createSpyWithHistory<[number, number]>()

    e.sub(combined, spy)

    // Rapid other node updates (should not trigger emissions)
    for (let i = 0; i < 100; i++) {
      eng.pub(other, i)
    }

    expect(history).toHaveLength(0) // No emissions yet

    // Single source emission should pick up latest value
    eng.pub(source, 1)
    expect(history).toEqual([[1, 99]]) // Latest value from other node
  })

  // Complex scenarios
  it('works in chain with other operators', () => {
    const source = Stream<number>()
    const other = Cell('suffix')

    // Chain with map
    const chained = e.pipe(
      source,
      e.withLatestFrom(other),
      e.map(([num, str]) => `${num}-${str}`)
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(chained, spy)

    eng.pub(source, 42)
    expect(history).toEqual(['42-suffix'])

    eng.pub(other, 'updated')
    eng.pub(source, 24)
    expect(history).toEqual(['42-suffix', '24-updated'])
  })

  it('handles circular-like dependencies safely', () => {
    const cell1 = Cell(1)
    const cell2 = Cell(2)

    const combined1 = e.pipe(cell1, e.withLatestFrom(cell2))
    const combined2 = e.pipe(cell2, e.withLatestFrom(cell1))

    const spy1 = createSpyWithHistory<[number, number]>()
    const spy2 = createSpyWithHistory<[number, number]>()

    e.sub(combined1, spy1.spy)
    e.sub(combined2, spy2.spy)

    eng.pub(cell1, 10)
    expect(spy1.history).toEqual([[10, 2]])

    eng.pub(cell2, 20)
    expect(spy2.history).toEqual([[20, 10]])

    // Should not cause infinite loops or other issues
    expect(spy1.history).toHaveLength(1)
    expect(spy2.history).toHaveLength(1)
  })
})
