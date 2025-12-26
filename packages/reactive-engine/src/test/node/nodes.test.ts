import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Cell, Stream, Trigger } from '../..'
import { Engine } from '../../Engine'

describe('Reactive Engine nodes', () => {
  let engineInstance: Engine
  beforeEach(() => {
    engineInstance = new Engine()
  })

  describe('Trigger', () => {
    it('activates its subscriptions when published', () => {
      const trigger$ = Trigger()
      const spy = vi.fn()
      engineInstance.sub(trigger$, spy)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(trigger$)
      expect(spy).toHaveBeenCalledTimes(1)
      engineInstance.pub(trigger$)
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })
  describe('Stream', () => {
    it('activates its subscriptions when published', () => {
      const stream$ = Stream<number>()
      const spy = vi.fn()
      engineInstance.sub(stream$, spy)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(stream$, 5)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('by default, is distinct and does not emit if the same value is published', () => {
      const stream$ = Stream<number>()
      const spy = vi.fn()
      engineInstance.sub(stream$, spy)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(stream$, 5)
      expect(spy).toHaveBeenCalledTimes(1)
      engineInstance.pub(stream$, 5)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('emits same value if distinct is false', () => {
      const stream$ = Stream<number>(false)
      const spy = vi.fn()
      engineInstance.sub(stream$, spy)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(stream$, 5)
      expect(spy).toHaveBeenCalledTimes(1)
      engineInstance.pub(stream$, 5)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('supports custom distinct comparator', () => {
      const stream$ = Stream<{ id: number }>((a, b) => {
        return a && a.id === b.id
      })
      const spy = vi.fn()
      engineInstance.sub(stream$, spy)

      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(stream$, { id: 5 })
      expect(spy).toHaveBeenCalledTimes(1)
      engineInstance.pub(stream$, { id: 5 })
      expect(spy).toHaveBeenCalledTimes(1)
      engineInstance.pub(stream$, { id: 6 })
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('Cell', () => {
    it('starts with initial value', () => {
      const cell$ = Cell(5)
      expect(engineInstance.getValue(cell$)).toEqual(5)
    })

    it('activates its subscriptions when published', () => {
      const cell$ = Cell<number>(5)
      const spy = vi.fn()
      engineInstance.sub(cell$, spy)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(cell$, 10)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('by default, is distinct and does not emit if the same value is published', () => {
      const cell$ = Cell<number>(5)
      const spy = vi.fn()
      engineInstance.sub(cell$, spy)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(cell$, 5)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(cell$, 10)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('emits same value if distinct is false', () => {
      const cell$ = Cell<number>(5, false)
      const spy = vi.fn()
      engineInstance.sub(cell$, spy)
      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(cell$, 5)
      expect(spy).toHaveBeenCalledTimes(1)
      engineInstance.pub(cell$, 10)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('supports custom distinct comparator', () => {
      const cell$ = Cell<{ id: number }>({ id: 1 }, (a, b) => {
        return a && a.id === b.id
      })
      const spy = vi.fn()
      engineInstance.sub(cell$, spy)

      expect(spy).toHaveBeenCalledTimes(0)
      engineInstance.pub(cell$, { id: 5 })
      expect(spy).toHaveBeenCalledTimes(1)
      engineInstance.pub(cell$, { id: 5 })
      expect(spy).toHaveBeenCalledTimes(1)
      engineInstance.pub(cell$, { id: 6 })
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })
})
