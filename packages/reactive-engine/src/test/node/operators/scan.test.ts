import { beforeEach, describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory, testErrors } from '../../testUtils'

describe('scan operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  // Basic functionality
  it('accumulates values with accumulator function', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc, val) => acc + val, 0)
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(scanned, spy)

    eng.pub(source, 1)
    expect(history).toEqual([1])

    eng.pub(source, 2)
    expect(history).toEqual([1, 3])

    eng.pub(source, 3)
    expect(history).toEqual([1, 3, 6])
  })

  it('uses initial seed value correctly', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc, val) => acc * val, 10)
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(scanned, spy)

    eng.pub(source, 2)
    expect(history).toEqual([20]) // 10 * 2

    eng.pub(source, 3)
    expect(history).toEqual([20, 60]) // 20 * 3
  })

  // Type transformations
  it('handles type transformations properly', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc: string, val: number) => `${acc}-${val}`, 'start')
    )
    const { history, spy } = createSpyWithHistory<string>()

    e.sub(scanned, spy)

    eng.pub(source, 1)
    expect(history).toEqual(['start-1'])

    eng.pub(source, 2)
    expect(history).toEqual(['start-1', 'start-1-2'])
  })

  it('accumulates different input and output types', () => {
    interface State {
      count: number
      values: number[]
    }

    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan(
        (acc: State, val: number): State => ({
          count: acc.count + 1,
          values: [...acc.values, val],
        }),
        { count: 0, values: [] }
      )
    )
    const { history, spy } = createSpyWithHistory<State>()

    e.sub(scanned, spy)

    eng.pub(source, 10)
    expect(history[0]).toEqual({ count: 1, values: [10] })

    eng.pub(source, 20)
    expect(history[1]).toEqual({ count: 2, values: [10, 20] })
  })

  it('does not contain accumulator function throwing errors', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc: number, val: number) => {
        if (val === 999) throw testErrors.simple
        return acc + val
      }, 0)
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(scanned, spy)

    eng.pub(source, 1)
    expect(history).toEqual([1])

    // Error should not crash the engine
    expect(() => {
      eng.pub(source, 999)
    }).toThrow()

    eng.pub(source, 2)
    expect(history).toEqual([1, 3]) // Should continue with last valid state
  })

  it('preserves accumulated state when source errors', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc, val) => acc + val, 100)
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(scanned, spy)

    eng.pub(source, 5)
    expect(history).toEqual([105])

    // Even if source has issues, accumulated state should be preserved
    eng.pub(source, 3)
    expect(history).toEqual([105, 108]) // 105 + 3
  })

  // Complex objects
  it('accumulates complex objects correctly', () => {
    interface TodoState {
      nextId: number
      todos: { done: boolean; id: number; text: string }[]
    }

    type TodoAction = { id: number; type: 'remove' } | { id: number; type: 'toggle' } | { text: string; type: 'add' }

    const source = Stream<TodoAction>()
    const scanned = e.pipe(
      source,
      e.scan(
        (state: TodoState, action: TodoAction): TodoState => {
          switch (action.type) {
            case 'add':
              return {
                nextId: state.nextId + 1,
                todos: [...state.todos, { done: false, id: state.nextId, text: action.text }],
              }
            case 'remove':
              return {
                ...state,
                todos: state.todos.filter((todo) => todo.id !== action.id),
              }
            case 'toggle':
              return {
                ...state,
                todos: state.todos.map((todo) => (todo.id === action.id ? { ...todo, done: !todo.done } : todo)),
              }
            default:
              return state
          }
        },
        { nextId: 1, todos: [] }
      )
    )

    const { history, spy } = createSpyWithHistory<TodoState>()
    e.sub(scanned, spy)

    eng.pub(source, { text: 'Learn React', type: 'add' })
    expect(history[0].todos).toHaveLength(1)
    expect(history[0].todos[0].text).toBe('Learn React')

    eng.pub(source, { text: 'Learn Testing', type: 'add' })
    expect(history[1].todos).toHaveLength(2)

    eng.pub(source, { id: 1, type: 'toggle' })
    expect(history[2].todos[0].done).toBe(true)
  })

  it('handles immutable updates correctly', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc: number[], val: number) => [...acc, val], [])
    )
    const { history, spy } = createSpyWithHistory<number[]>()

    e.sub(scanned, spy)

    eng.pub(source, 1)
    const first = history[0]

    eng.pub(source, 2)
    const second = history[1]

    expect(first).toEqual([1])
    expect(second).toEqual([1, 2])
    expect(first).not.toBe(second) // Different references (immutable)
  })

  // State persistence
  it.only('maintains state across multiple subscriptions', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc, val) => {
        return acc + val
      }, 0)
    )

    // First subscriber
    const spy1 = createSpyWithHistory<number>()
    const unsub1 = eng.sub(scanned, spy1.spy)

    eng.pub(source, 5)
    expect(spy1.history).toEqual([5])

    // Add second subscriber
    const spy2 = createSpyWithHistory<number>()
    eng.sub(scanned, spy2.spy)

    eng.pub(source, 3)
    expect(spy1.history).toEqual([5, 8])
    expect(spy2.history).toEqual([8]) // Gets current accumulated state

    // Remove first subscriber
    unsub1()

    eng.pub(source, 2)
    expect(spy2.history).toEqual([8, 10]) // State continues
  })

  it('resets state when engine is recreated', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc, val) => acc + val, 100)
    )
    const { history: history1, spy: spy1 } = createSpyWithHistory<number>()

    e.sub(scanned, spy1)

    eng.pub(source, 5)
    expect(history1).toEqual([105])

    // Create new engine - should reset state
    const newEng = new Engine()
    const { history: history2, spy: spy2 } = createSpyWithHistory<number>()

    newEng.sub(scanned, spy2)
    newEng.pub(source, 5)

    expect(history2).toEqual([105]) // Fresh start with seed value
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', () => {
    const source = Stream<string>()
    const scanned = e.pipe(
      source,
      e.scan((acc, val) => acc + val, 'start:')
    )

    const spy1 = createSpyWithHistory<string>()
    const spy2 = createSpyWithHistory<string>()

    e.sub(scanned, spy1.spy)
    e.sub(scanned, spy2.spy)

    eng.pub(source, 'A')

    expect(spy1.history).toEqual(['start:A'])
    expect(spy2.history).toEqual(['start:A'])

    eng.pub(source, 'B')

    expect(spy1.history).toEqual(['start:A', 'start:AB'])
    expect(spy2.history).toEqual(['start:A', 'start:AB'])
  })

  // Edge cases with various types
  it('handles null and undefined values', () => {
    const source = Stream<null | string | undefined>()
    const scanned = e.pipe(
      source,
      e.scan((acc: string[], val: null | string | undefined) => {
        return [...acc, String(val)]
      }, [])
    )
    const { history, spy } = createSpyWithHistory<string[]>()

    e.sub(scanned, spy)

    eng.pub(source, 'hello')
    eng.pub(source, null)
    eng.pub(source, undefined)
    eng.pub(source, 'world')

    expect(history).toEqual([['hello'], ['hello', 'null'], ['hello', 'null', 'undefined'], ['hello', 'null', 'undefined', 'world']])
  })

  it('handles boolean accumulation', () => {
    const source = Stream<boolean>()
    const scanned = e.pipe(
      source,
      e.scan((acc, val) => acc && val, true)
    )
    const { history, spy } = createSpyWithHistory<boolean>()

    e.sub(scanned, spy)

    eng.pub(source, true)
    expect(history).toEqual([true])

    eng.pub(source, true)
    expect(history).toEqual([true, true])

    eng.pub(source, false)
    expect(history).toEqual([true, true, false])

    eng.pub(source, true)
    expect(history).toEqual([true, true, false, false]) // Once false, stays false
  })

  it('handles array concatenation', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc: number[], val: number) => {
        const newAcc = [...acc, val]
        return newAcc.length > 3 ? newAcc.slice(-3) : newAcc // Keep only last 3
      }, [])
    )
    const { history, spy } = createSpyWithHistory<number[]>()

    e.sub(scanned, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)
    eng.pub(source, 3)
    eng.pub(source, 4)
    eng.pub(source, 5)

    expect(history).toEqual([
      [1],
      [1, 2],
      [1, 2, 3],
      [2, 3, 4], // Sliding window
      [3, 4, 5],
    ])
  })

  // Performance considerations
  it('handles large accumulations efficiently', () => {
    const source = Stream<number>()
    const scanned = e.pipe(
      source,
      e.scan((acc, val) => acc + val, 0)
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(scanned, spy)

    // Accumulate many values
    for (let i = 1; i <= 1000; i++) {
      eng.pub(source, i)
    }

    expect(history).toHaveLength(1000)
    expect(history[0]).toBe(1)
    expect(history[999]).toBe(500500) // Sum of 1 to 1000
  })

  // Complex function patterns
  it('works with reducer-like patterns', () => {
    type CounterAction = { type: 'decrement' } | { type: 'increment' } | { type: 'reset'; value: number }

    const source = Stream<CounterAction>()
    const scanned = e.pipe(
      source,
      e.scan((count: number, action: CounterAction): number => {
        switch (action.type) {
          case 'decrement':
            return count - 1
          case 'increment':
            return count + 1
          case 'reset':
            return action.value
          default:
            return count
        }
      }, 0)
    )

    const { history, spy } = createSpyWithHistory<number>()
    e.sub(scanned, spy)

    eng.pub(source, { type: 'increment' })
    eng.pub(source, { type: 'increment' })
    eng.pub(source, { type: 'decrement' })
    eng.pub(source, { type: 'reset', value: 100 })
    eng.pub(source, { type: 'increment' })

    expect(history).toEqual([1, 2, 1, 100, 101])
  })
})
