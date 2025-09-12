import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Cell, e, Engine, setNodeLabel, Stream } from '../..'
import { debounceTime, filter, map, mapTo, once, onNext, scan, throttleTime, withLatestFrom } from '../../operators'
import { noop } from '../../utils'

async function awaitCall(cb: () => unknown, delay: number) {
  return await new Promise((resolve) => {
    setTimeout(() => {
      cb()
      resolve(undefined)
    }, delay)
  })
}

describe('pipe', () => {
  let eng!: Engine
  beforeEach(() => {
    eng = new Engine()
  })

  it('maps node values', () => {
    // r.setTracerConsole(console)
    const a = Stream<number>()
    setNodeLabel(a, 'a')

    const b = e.pipe(
      a,
      map((val: number) => val * 2),
      filter((val: number) => val > 3)
    )

    const spy = vi.fn()
    e.sub(b, spy)

    // action
    eng.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(4, eng)
  })

  it('filters node values', () => {
    const a = Stream<number>()

    const b = e.pipe(
      a,
      filter((val: number) => val % 2 === 0)
    )

    const spy = vi.fn()
    e.sub(b, spy)

    // action
    eng.pub(a, 2)
    eng.pub(a, 3)
    eng.pub(a, 4)
    expect(spy).toHaveBeenCalledWith(4, eng)
    expect(spy).not.toHaveBeenCalledWith(3, eng)
    expect(spy).toHaveBeenCalledWith(2, eng)
  })

  it('pulls values in withLatestFrom', () => {
    const a = Cell('foo')
    const b = Cell('bar')

    const c = e.pipe(a, withLatestFrom(b))

    const spy = vi.fn()
    e.sub(c, spy)

    // action
    eng.pub(a, 'baz')
    expect(spy).toHaveBeenCalledWith(['baz', 'bar'], eng)
    eng.pub(b, 'qux')
    expect(spy).toHaveBeenCalledTimes(1)
    eng.pub(a, 'foo')
    expect(spy).toHaveBeenCalledWith(['foo', 'qux'], eng)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('maps to fixed value with mapTo', () => {
    const a = Stream<number>()
    const b = e.pipe(a, mapTo('bar'))

    const spy = vi.fn()
    e.sub(b, spy)

    // action
    eng.pub(a, 2)
    expect(spy).toHaveBeenCalledWith('bar', eng)
  })

  it('accumulates with scan', () => {
    const a = Stream<number>()
    const b = e.pipe(
      a,
      scan((acc, value) => acc + value, 1)
    )

    const spy = vi.fn()
    e.sub(b, spy)

    // action
    eng.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(3, eng)

    eng.pub(a, 3)
    expect(spy).toHaveBeenCalledWith(6, eng)
  })

  it('onNext publishes only once, when the trigger stream emits', () => {
    const a = Stream<number>()
    const b = Stream<number>()

    const c = e.pipe(a, onNext(b))

    const spy = vi.fn()
    e.sub(c, spy)

    // action
    eng.pub(a, 2)
    expect(spy).toHaveBeenCalledTimes(0)

    eng.pub(b, 3)
    expect(spy).toHaveBeenCalledWith([2, 3], eng)
    expect(spy).toHaveBeenCalledTimes(1)

    // next publish should not retrigger the sub
    eng.pub(b, 4)
    expect(spy).toHaveBeenCalledTimes(1)

    // a new value should activate the triggering again
    eng.pub(a, 2)
    eng.pub(b, 4)
    expect(spy).toHaveBeenCalledWith([2, 4], eng)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('once publishes only once', () => {
    const a = Stream<number>()
    const b = Stream<number>()

    e.link(e.pipe(a, once()), b)

    const spy = vi.fn()
    e.sub(b, spy)

    // action
    eng.pub(a, 1)
    eng.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(1, eng)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it.skip('throttleTime delays the execution', async () => {
    const a = Stream<number>()
    const b = e.pipe(a, throttleTime(60))
    const spy = vi.fn()
    e.sub(b, spy)

    // action
    eng.pub(a, 1)

    await awaitCall(() => {
      eng.pub(a, 2)
    }, 20) // +20

    await awaitCall(() => {
      eng.pub(a, 3)
    }, 30) // +30

    expect(spy).toHaveBeenCalledTimes(0)
    await awaitCall(noop, 20) // +20 = 80

    expect(spy).toHaveBeenCalledWith(3, eng)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('debounceTime bounces the execution', async () => {
    const a = Stream<number>()
    const b = e.pipe(a, debounceTime(60))

    const spy = vi.fn()
    e.sub(b, spy)

    // action
    eng.pub(a, 1)

    await awaitCall(() => {
      eng.pub(a, 2)
    }, 20) // +20

    await awaitCall(() => {
      eng.pub(a, 3)
    }, 30) // +30

    expect(spy).toHaveBeenCalledTimes(0)
    await awaitCall(noop, 70)

    expect(spy).toHaveBeenCalledWith(3, eng)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('combines node values', () => {
    const a = Cell<number>(0)
    const b = Cell<number>(0)
    const d = Cell<number>(6)

    const c = e.combine(a, b, d)

    const spy = vi.fn()
    eng.sub(c, spy)
    eng.pubIn({ [a]: 3, [b]: 4 })
    expect(spy).toHaveBeenCalledWith([3, 4, 6], eng)
    expect(spy).toHaveBeenCalledTimes(1)
    eng.pub(d, 7)
    expect(spy).toHaveBeenCalledWith([3, 4, 7], eng)
  })

  it('supports value-less stream', () => {
    const a$ = Stream(false)
    const b$ = Cell(1)

    e.link(
      e.pipe(
        a$,
        withLatestFrom(b$),
        map(([, b]) => b + 1)
      ),
      b$
    )

    expect(eng.getValue(b$)).toBe(1)
    eng.pub(a$)
    expect(eng.getValue(b$)).toBe(2)
  })
})
