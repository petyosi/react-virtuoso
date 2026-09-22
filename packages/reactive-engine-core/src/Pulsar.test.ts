import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Cell, Engine, Pulsar, Stream } from './index'

import type { StateRef } from './index'

describe('Pulsar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is inert until its output activates', () => {
    const cadence$ = Cell<number | null>(100)
    Pulsar(cadence$)
    const engine = new Engine()

    engine.pub(cadence$, 50)

    expect(vi.getTimerCount()).toBe(0)
  })

  it('reads an armed cadence on activation and pulses repeatedly', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const subscriber = vi.fn()
    const engine = new Engine()

    engine.sub(pulse$, subscriber)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(99)
    expect(subscriber).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(subscriber).toHaveBeenLastCalledWith(undefined, engine)
    vi.advanceTimersByTime(100)
    expect(subscriber).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('chunks finite cadences above the platform timer limit', () => {
    const cadence$ = Cell<number | null>(2_147_483_747)
    const pulse$ = Pulsar(cadence$)
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(pulse$, subscriber)

    vi.advanceTimersByTime(2_147_483_647)
    expect(subscriber).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(99)
    expect(subscriber).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it('stays disarmed when the activation cadence is null', () => {
    const cadence$ = Cell<number | null>(null)
    const pulse$ = Pulsar(cadence$)
    const engine = new Engine()

    engine.register(pulse$)

    expect(vi.getTimerCount()).toBe(0)
  })

  it('schedules a zero-delay leading pulse after activation completes', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$, { leading: true })
    const subscriber = vi.fn()
    const engine = new Engine()

    engine.sub(pulse$, subscriber)
    expect(subscriber).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(0)
    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(100)
    expect(subscriber).toHaveBeenCalledTimes(2)
  })

  it('captures leading policy when the node is defined', () => {
    const cadence$ = Cell<number | null>(100)
    const options = { leading: true }
    const pulse$ = Pulsar(cadence$, options)
    options.leading = false
    const subscriber = vi.fn()
    const engine = new Engine()

    engine.sub(pulse$, subscriber)
    vi.advanceTimersByTime(0)

    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it('leads on a disarmed-to-armed transition', () => {
    const cadence$ = Cell<number | null>(null)
    const pulse$ = Pulsar(cadence$, { leading: true })
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(pulse$, subscriber)

    engine.pub(cadence$, 100)
    expect(subscriber).not.toHaveBeenCalled()
    vi.advanceTimersByTime(0)
    expect(subscriber).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    expect(subscriber).toHaveBeenCalledTimes(2)
  })

  it('restarts an armed cadence without another leading pulse', () => {
    const cadence$ = Cell<number | null>(100, false)
    const pulse$ = Pulsar(cadence$, { leading: true })
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(pulse$, subscriber)
    vi.advanceTimersByTime(0)

    vi.advanceTimersByTime(40)
    engine.pub(cadence$, 50)
    vi.advanceTimersByTime(0)
    expect(subscriber).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(49)
    expect(subscriber).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(subscriber).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('disarms and clears the pending timer', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(pulse$, subscriber)

    vi.advanceTimersByTime(50)
    engine.pub(cadence$, null)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(1000)
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('does not re-arm an old cadence after a subscriber disarms', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const engine = new Engine()
    const subscriber = vi.fn(() => {
      engine.pub(cadence$, null)
    })
    engine.sub(pulse$, subscriber)

    vi.advanceTimersByTime(100)

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(1000)
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it('lets a subscriber retune the next pulse from the current callback', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const engine = new Engine()
    let calls = 0
    engine.sub(pulse$, () => {
      calls += 1
      if (calls === 1) {
        engine.pub(cadence$, 50)
      }
    })

    vi.advanceTimersByTime(100)
    vi.advanceTimersByTime(49)
    expect(calls).toBe(1)
    vi.advanceTimersByTime(1)
    expect(calls).toBe(2)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('clears pending work when disposed before a pulse', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(pulse$, subscriber)

    engine.dispose()

    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(1000)
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('does not re-arm when a subscriber disposes the engine', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const engine = new Engine()
    const subscriber = vi.fn(() => {
      engine.dispose()
    })
    engine.sub(pulse$, subscriber)

    vi.advanceTimersByTime(100)

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps running after its activating subscription is removed', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const subscriber = vi.fn()
    const engine = new Engine()
    const unsubscribe = engine.sub(pulse$, subscriber)
    unsubscribe()

    vi.advanceTimersByTime(100)

    expect(subscriber).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(1)
  })

  it('delegates a parent-owned Pulsar without creating a child timer', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const parent = new Engine()
    const child = new Engine({}, undefined, parent)
    const parentSubscriber = vi.fn()
    const childSubscriber = vi.fn()
    parent.sub(pulse$, parentSubscriber)
    child.sub(pulse$, childSubscriber)

    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(100)
    expect(parentSubscriber).toHaveBeenCalledTimes(1)
    expect(childSubscriber).toHaveBeenCalledTimes(1)
  })

  it('keeps child-first activation locally owned when the parent activates later', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const parent = new Engine()
    const child = new Engine({}, undefined, parent)
    const parentSubscriber = vi.fn()
    const childSubscriber = vi.fn()
    child.sub(pulse$, childSubscriber)
    parent.sub(pulse$, parentSubscriber)

    expect(vi.getTimerCount()).toBe(2)
    vi.advanceTimersByTime(100)
    expect(parentSubscriber).toHaveBeenCalledTimes(2)
    expect(childSubscriber).toHaveBeenCalledTimes(2)

    child.dispose()
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(100)
    expect(parentSubscriber).toHaveBeenCalledTimes(3)
    expect(childSubscriber).toHaveBeenCalledTimes(2)
  })

  it('removes a delegated Pulsar subscription when the child is disposed', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const parent = new Engine()
    const child = new Engine({}, undefined, parent)
    const parentSubscriber = vi.fn()
    const childSubscriber = vi.fn()
    parent.sub(pulse$, parentSubscriber)
    child.sub(pulse$, childSubscriber)

    child.dispose()
    vi.advanceTimersByTime(100)

    expect(parentSubscriber).toHaveBeenCalledTimes(1)
    expect(childSubscriber).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(1)
  })

  it('owns independent timers in unrelated engines', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const first = new Engine()
    const second = new Engine()
    const firstSubscriber = vi.fn()
    const secondSubscriber = vi.fn()
    first.sub(pulse$, firstSubscriber)
    second.sub(pulse$, secondSubscriber)

    expect(vi.getTimerCount()).toBe(2)
    first.pub(cadence$, null)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(100)
    expect(firstSubscriber).not.toHaveBeenCalled()
    expect(secondSubscriber).toHaveBeenCalledTimes(1)
  })

  it('owns separate timers for separate Pulsars in one engine', () => {
    const first$ = Pulsar(Cell<number | null>(50))
    const second$ = Pulsar(Cell<number | null>(100))
    const engine = new Engine()
    const firstSubscriber = vi.fn()
    const secondSubscriber = vi.fn()
    engine.sub(first$, firstSubscriber)
    engine.sub(second$, secondSubscriber)

    expect(vi.getTimerCount()).toBe(2)
    vi.advanceTimersByTime(100)
    expect(firstSubscriber).toHaveBeenCalledTimes(2)
    expect(secondSubscriber).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(2)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects invalid activation cadence %s without arming',
    (invalid) => {
      const cadence$ = Cell<number | null>(invalid)
      const pulse$ = Pulsar(cadence$)
      const engine = new Engine()

      expect(() => engine.register(pulse$)).toThrow(new RangeError('Pulsar cadence must be null or a positive finite number'))
      expect(vi.getTimerCount()).toBe(0)
    }
  )

  it('keeps the last valid timer when a later invalid cadence is rejected', () => {
    const cadence$ = Cell<number | null>(100)
    const pulse$ = Pulsar(cadence$)
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(pulse$, subscriber)

    expect(() => {
      engine.pub(cadence$, 0)
    }).toThrow(new RangeError('Pulsar cadence must be null or a positive finite number'))
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(100)
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it('can recover after an invalid activation cadence is replaced', () => {
    const cadence$ = Cell<number | null>(0)
    const pulse$ = Pulsar(cadence$)
    const subscriber = vi.fn()
    const engine = new Engine()
    expect(() => engine.register(pulse$)).toThrow(RangeError)
    engine.sub(pulse$, subscriber)

    engine.pub(cadence$, 25)
    vi.advanceTimersByTime(25)

    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it('rejects a non-state cadence at runtime', () => {
    const cadence$ = Stream<number | null>() as StateRef<number | null>

    expect(() => Pulsar(cadence$)).toThrow('Pulsar cadence must be state created with Cell, DerivedCell, or ComputedCell')
  })
})
