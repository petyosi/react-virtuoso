import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Cell, changeWith, combine, e, Engine, link, map, merge, pipe, singletonSub, Stream, sub, subMultiple } from '../..'

describe('Reactive Engine combinators', () => {
  let engineInstance: Engine
  beforeEach(() => {
    engineInstance = new Engine()
  })

  describe('combine', () => {
    it('combines values from multiple cells into an array', () => {
      const cell1$ = Cell(1)
      const cell2$ = Cell(2)
      const combined$ = combine(cell1$, cell2$)
      const spy = vi.fn()

      e.sub(combined$, spy)
      engineInstance.pub(cell1$, 42)
      expect(spy).toHaveBeenCalledWith([42, 2], engineInstance)

      engineInstance.pub(cell2$, 43)
      expect(spy).toHaveBeenCalledWith([42, 43], engineInstance)
    })

    it('emits when any of the source nodes emit', () => {
      const cell1$ = Cell(10)
      const cell2$ = Cell(20)
      const combined$ = combine(cell1$, cell2$)
      const spy = vi.fn()

      engineInstance.sub(combined$, spy)
      engineInstance.pub(cell1$, 15)
      expect(spy).toHaveBeenCalledWith([15, 20], engineInstance)

      engineInstance.pub(cell2$, 25)
      expect(spy).toHaveBeenCalledWith([15, 25], engineInstance)
    })

    it('works with single node', () => {
      const cell$ = Cell(1)
      const combined$ = combine(cell$)
      const spy = vi.fn()

      engineInstance.sub(combined$, spy)
      engineInstance.pub(cell$, 42)
      expect(spy).toHaveBeenCalledWith([42], engineInstance)
    })
  })

  describe('pipe', () => {
    it('transforms values through operators', () => {
      const source$ = Stream<number>()
      const piped$ = pipe(
        source$,
        map((x: number) => x * 2)
      )
      const spy = vi.fn()

      engineInstance.sub(piped$, spy)
      engineInstance.pub(source$, 5)
      expect(spy).toHaveBeenCalledWith(10, engineInstance)
    })

    it('chains multiple operators', () => {
      const source$ = Stream<number>()
      const piped$ = pipe(
        source$,
        map((x: number) => x * 2),
        map((x: number) => x + 1)
      )
      const spy = vi.fn()

      engineInstance.sub(piped$, spy)
      engineInstance.pub(source$, 5)
      expect(spy).toHaveBeenCalledWith(11, engineInstance) // 5 * 2 + 1
    })

    it('returns same node when no operators provided', () => {
      const source$ = Stream<number>()
      const piped$ = pipe(source$)
      const spy = vi.fn()

      engineInstance.sub(piped$, spy)
      engineInstance.pub(source$, 42)
      expect(spy).toHaveBeenCalledWith(42, engineInstance)
    })
  })

  describe('link', () => {
    it('connects source to sink node', () => {
      const source$ = Stream<number>()
      const sink$ = Stream<number>()
      const spy = vi.fn()

      link(source$, sink$)
      engineInstance.sub(sink$, spy)
      engineInstance.pub(source$, 42)
      expect(spy).toHaveBeenCalledWith(42, engineInstance)
    })

    it('works with cells', () => {
      const source$ = Cell(10)
      const sink$ = Cell(0)

      link(source$, sink$)
      engineInstance.pub(source$, 25)
      expect(engineInstance.getValue(sink$)).toBe(25)
    })
  })

  describe('sub', () => {
    it('subscribes to node values', () => {
      const stream$ = Stream<number>()
      const spy = vi.fn()

      sub(stream$, spy)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(stream$, 42)
      expect(spy).toHaveBeenCalledWith(42, engineInstance)
    })

    it('receives multiple values', () => {
      const cell$ = Cell(0)
      const spy = vi.fn()

      sub(cell$, spy)
      engineInstance.pub(cell$, 1)
      engineInstance.pub(cell$, 2)
      engineInstance.pub(cell$, 3)
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenNthCalledWith(1, 1, engineInstance)
      expect(spy).toHaveBeenNthCalledWith(2, 2, engineInstance)
      expect(spy).toHaveBeenNthCalledWith(3, 3, engineInstance)
    })
  })

  describe('singletonSub', () => {
    it('subscribes exclusively to node values', () => {
      const stream$ = Stream<number>()
      const spy1 = vi.fn()
      const spy2 = vi.fn()

      singletonSub(stream$, spy1)
      singletonSub(stream$, spy2) // should replace spy1

      engineInstance.pub(stream$, 42)
      expect(spy1).toHaveBeenCalledTimes(0)
      expect(spy2).toHaveBeenCalledWith(42, engineInstance)
    })

    it('does not affect regular subscriptions', () => {
      const stream$ = Stream<number>()
      const spy1 = vi.fn()
      const spy2 = vi.fn()

      sub(stream$, spy1) // regular subscription
      singletonSub(stream$, spy2) // singleton subscription

      engineInstance.pub(stream$, 42)
      expect(spy1).toHaveBeenCalledWith(42, engineInstance)
      expect(spy2).toHaveBeenCalledWith(42, engineInstance)
    })
  })

  describe('subMultiple', () => {
    it('calls subscription only once when multiple nodes change in same cycle', () => {
      const cell1$ = Cell(1)
      const cell2$ = Cell(2)
      const spy = vi.fn()

      subMultiple([cell1$, cell2$], spy)

      // Simulate simultaneous updates
      engineInstance.pub(cell1$, 10)
      engineInstance.pub(cell2$, 20)

      // Should be called for each individual update
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenNthCalledWith(1, [10, 2], engineInstance)
      expect(spy).toHaveBeenNthCalledWith(2, [10, 20], engineInstance)
    })

    it('works with single node', () => {
      const stream$ = Stream<number>()
      const spy = vi.fn()

      subMultiple([stream$], spy)
      engineInstance.pub(stream$, 42)
      expect(spy).toHaveBeenCalledWith([42], engineInstance)
    })

    it('works with three nodes', () => {
      const cell1$ = Cell(1)
      const cell2$ = Cell(2)
      const cell3$ = Cell(3)
      const spy = vi.fn()

      subMultiple([cell1$, cell2$, cell3$], spy)
      engineInstance.pub(cell1$, 20)
      expect(spy).toHaveBeenCalledWith([20, 2, 3], engineInstance)
    })
  })

  describe('merge', () => {
    it('emits individual values from multiple sources', () => {
      const cell1$ = Cell(1)
      const cell2$ = Cell('hello')
      const merged$ = merge(cell1$, cell2$)
      const spy = vi.fn()

      e.sub(merged$, spy)
      engineInstance.pub(cell1$, 42)
      expect(spy).toHaveBeenCalledWith(42, engineInstance)

      engineInstance.pub(cell2$, 'world')
      expect(spy).toHaveBeenCalledWith('world', engineInstance)
    })

    it('emits whenever any of the source nodes emit', () => {
      const stream1$ = Stream<number>()
      const stream2$ = Stream<number>()
      const merged$ = merge(stream1$, stream2$)
      const spy = vi.fn()

      engineInstance.sub(merged$, spy)
      engineInstance.pub(stream1$, 10)
      expect(spy).toHaveBeenCalledWith(10, engineInstance)

      engineInstance.pub(stream2$, 20)
      expect(spy).toHaveBeenCalledWith(20, engineInstance)

      engineInstance.pub(stream1$, 30)
      expect(spy).toHaveBeenCalledWith(30, engineInstance)
    })

    it('works with single node', () => {
      const cell$ = Cell(1)
      const merged$ = merge(cell$)
      const spy = vi.fn()

      engineInstance.sub(merged$, spy)
      engineInstance.pub(cell$, 42)
      expect(spy).toHaveBeenCalledWith(42, engineInstance)
    })

    it('works with cells and streams', () => {
      const cell$ = Cell(10)
      const stream$ = Stream<string>()
      const merged$ = merge(cell$, stream$)
      const spy = vi.fn()

      engineInstance.sub(merged$, spy)
      engineInstance.pub(cell$, 25)
      expect(spy).toHaveBeenCalledWith(25, engineInstance)

      engineInstance.pub(stream$, 'test')
      expect(spy).toHaveBeenCalledWith('test', engineInstance)
    })

    it('emits exact values not arrays', () => {
      const cell1$ = Cell(1)
      const cell2$ = Cell(2)
      const merged$ = merge(cell1$, cell2$)
      const spy = vi.fn()

      engineInstance.sub(merged$, spy)
      engineInstance.pub(cell1$, 100)
      expect(spy).toHaveBeenCalledWith(100, engineInstance)
      expect(spy).not.toHaveBeenCalledWith([100, 2], engineInstance)
    })

    it('works with three different types', () => {
      const num$ = Cell(1)
      const str$ = Cell('hello')
      const bool$ = Cell(true)
      const merged$ = merge(num$, str$, bool$)
      const spy = vi.fn()

      engineInstance.sub(merged$, spy)
      engineInstance.pub(num$, 42)
      expect(spy).toHaveBeenCalledWith(42, engineInstance)

      engineInstance.pub(str$, 'world')
      expect(spy).toHaveBeenCalledWith('world', engineInstance)

      engineInstance.pub(bool$, false)
      expect(spy).toHaveBeenCalledWith(false, engineInstance)
    })
  })

  describe('changeWith', () => {
    it('updates cell based on source stream and mapping function', () => {
      const items$ = Cell<string[]>([])
      const addItem$ = Stream<string>()

      changeWith(items$, addItem$, (items, item) => [...items, item])

      engineInstance.pub(addItem$, 'foo')
      expect(engineInstance.getValue(items$)).toEqual(['foo'])

      engineInstance.pub(addItem$, 'bar')
      expect(engineInstance.getValue(items$)).toEqual(['foo', 'bar'])
    })

    it('works with number accumulation', () => {
      const counter$ = Cell(0)
      const increment$ = Stream<number>()

      changeWith(counter$, increment$, (current, increment) => current + increment)

      engineInstance.pub(increment$, 5)
      expect(engineInstance.getValue(counter$)).toBe(5)

      engineInstance.pub(increment$, 3)
      expect(engineInstance.getValue(counter$)).toBe(8)
    })

    it('works with object updates', () => {
      const state$ = Cell({ count: 0, name: 'initial' })
      const updateCount$ = Stream<number>()

      changeWith(state$, updateCount$, (state, count) => ({ ...state, count }))

      engineInstance.pub(updateCount$, 42)
      expect(engineInstance.getValue(state$)).toEqual({ count: 42, name: 'initial' })
    })

    it('receives current cell value in mapping function', () => {
      const data$ = Cell({ items: ['a', 'b'] })
      const addItem$ = Stream<string>()

      changeWith(data$, addItem$, (data, newItem) => ({
        items: [...data.items, newItem],
      }))

      engineInstance.pub(addItem$, 'c')
      expect(engineInstance.getValue(data$)).toEqual({ items: ['a', 'b', 'c'] })
    })
  })
})
